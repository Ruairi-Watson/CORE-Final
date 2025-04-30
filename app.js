/* global firebase */
/* global location */

const firebaseConfig = {
  apiKey: "AIzaSyCGW4_VqassdGCOJaGPkYLGYYvBs4QMcME",
  authDomain: "core-iii-web.firebaseapp.com",
  projectId: "core-iii-web",
  storageBucket: "core-iii-web.appspot.com",
  messagingSenderId: "22933808877",
  appId: "1:22933808877:web:f8494e90f24ca75eaa0ee4",
  measurementId: "G-3R70JDVY01"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

document.addEventListener("DOMContentLoaded", () => {

  // Registration
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("registerEmail").value;
      const password = document.getElementById("registerPassword").value;
      const companyName = document.getElementById("companyName").value;
      const companyCode = Math.random().toString(36).substr(2, 8).toUpperCase();

      auth.createUserWithEmailAndPassword(email, password)
        .then((cred) => {
          return db.collection("companies").doc(cred.user.uid).set({
            companyName,
            email,
            companyCode,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        })
        .then(() => {
          alert("Registration successful! SAVE THIS CODE: " + companyCode);
          location.href = "admin.html";
        })
        .catch(err => alert("Error: " + err.message));
    });
  }

  //  Login
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      auth.signInWithEmailAndPassword(email, password)
        .then(() => {
          alert("Login successful!");
          location.href = "admin.html";
        })
        .catch(err => alert("Login failed: " + err.message));
    });
  }

  // Admin Dashboard logic
  auth.onAuthStateChanged((user) => {
    if (!user) return;

    // Show company name
    db.collection("companies").doc(user.uid).get().then(doc => {
      if (doc.exists && document.getElementById("companyNameHeader")) {
        document.getElementById("companyNameHeader").textContent =
          doc.data().companyName + " – Admin Dashboard";
      }
    });

    // add department
    const addDeptForm = document.getElementById("addDepartmentForm");
    if (addDeptForm) {
      addDeptForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("departmentName").value;
        const points = parseInt(document.getElementById("departmentPoints").value, 10);
        const nickname = document.getElementById("departmentNick")?.value || "";

        db.collection("departments").add({
          name, points, nickname,
          companyId: user.uid,
          goldStreaks: 0,
          badges: [],
          badgeDates: []
        }).then(() => location.reload());
      });
    }

    // Score department
    const scoreForm = document.getElementById("scoreForm");
    if (scoreForm) {
      scoreForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("scoreDeptName").value;
        const score = parseInt(document.getElementById("scoreValue").value, 10);

        db.collection("departments")
          .where("companyId", "==", user.uid)
          .where("name", "==", name)
          .get()
          .then(snapshot => {
            if (snapshot.empty) return alert("Department not found.");
            snapshot.forEach(doc => {
              db.collection("departments").doc(doc.id).update({
                points: firebase.firestore.FieldValue.increment(score)
              });
            });
            alert("Points added!");
            location.reload();
          });
      });
    }

    // Set challenge
    const challengeForm = document.getElementById("challengeForm");
    if (challengeForm) {
      challengeForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const challenge = document.getElementById("weeklyChallenge").value;

        db.collection("challenges").add({
          challenge,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          companyId: user.uid
        }).then(() => location.reload());
      });

      // Show + edit latest challenge
      db.collection("challenges")
        .where("companyId", "==", user.uid)
        .orderBy("createdAt", "desc")
        .limit(1)
        .get()
        .then(snapshot => {
          const display = document.getElementById("challengeDisplay");
          if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            const c = doc.data().challenge;

            display.innerHTML = `
              <strong>${c}</strong>
              <button class="btn btn-sm btn-outline-secondary ms-2" onclick="editChallenge('${doc.id}', '${c}')">Edit</button>
              <button class="btn btn-sm btn-outline-danger ms-1" onclick="deleteChallenge('${doc.id}')">Delete</button>
            `;
          } else {
            display.textContent = "No challenge set.";
          }
        });
    }

    window.editChallenge = function (id, current) {
      const updated = prompt("Edit challenge:", current);
      if (updated) {
        db.collection("challenges").doc(id).update({ challenge: updated });
        location.reload();
      }
    };

    window.deleteChallenge = function (id) {
      if (confirm("Delete this challenge?")) {
        db.collection("challenges").doc(id).delete();
        location.reload();
      }
    };

    // Load leaderboard + award stickers
    const leaderboardList = document.getElementById("leaderboardList");
    if (leaderboardList) {
      db.collection("departments")
        .where("companyId", "==", user.uid)
        .orderBy("points", "desc")
        .onSnapshot(async (snapshot) => {
          leaderboardList.innerHTML = "";

          if (snapshot.empty) {
            leaderboardList.innerHTML = "<li class='list-group-item'>No departments yet.</li>";
            return;
          }

          const docs = snapshot.docs;
          const topDept = docs[0];

          // Give gold/trophy if needed
          await db.collection("departments").doc(topDept.id).get().then(async (doc) => {
            let data = doc.data();
            const now = new Date().toISOString().split("T")[0];
            const badges = data.badges || [];
            const dates = data.badgeDates || [];

            if (!badges.includes("gold")) {
              badges.push("gold");
              dates.push(now);
            } else {
              const streak = (data.goldStreaks || 0) + 1;
              await db.collection("departments").doc(topDept.id).update({
                goldStreaks: streak
              });
              if (streak >= 3 && !badges.includes("trophy")) {
                badges.push("trophy");
                dates.push(now);
              }
            }

            await db.collection("departments").doc(topDept.id).update({
              badges, badgeDates: dates
            });
          });

          // Render list
          docs.forEach(doc => {
            const data = doc.data();
            const li = document.createElement("li");
            const name = data.name;
            const nick = data.nickname ? ` (${data.nickname})` : "";
            const pts = data.points;
            const badges = data.badges || [];
            const dates = data.badgeDates || [];

            let badgeText = "";
            badges.forEach((b, i) => {
              const title = b === "gold" ? "⭐" : b === "trophy" ? "🏆" : "";
              const tooltip = `title="${dates[i]}"`;
              badgeText += ` <span ${tooltip}>${title}</span>`;
            });

            li.className = "list-group-item";
            li.innerHTML = `${name}${nick} - ${pts} Points ${badgeText}`;
            leaderboardList.appendChild(li);
          });
        });
    }

    // Logout
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        auth.signOut().then(() => location.href = "index.html");
      });
    }
  });
});
