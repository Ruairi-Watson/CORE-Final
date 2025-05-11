// === Firebase Config ===
const firebaseConfig = {
  apiKey: "AIzaSyCGW4_VqassdGCOJaGPkYLGYYvBs4QMcME",
  authDomain: "core-iii-web.firebaseapp.com",
  projectId: "core-iii-web",
  storageBucket: "core-iii-web.appspot.com",
  messagingSenderId: "22933808877",
  appId: "1:22933808877:web:f8494e90f24ca75eaa0ee4",
  measurementId: "G-3R70JDVY01"
};

// === Declare Globals ===
/* global firebase */
/* global emailjs */
/* global location */
/* global localStorage */

// === Init Firebase ===
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// === Load Page Logic ===
document.addEventListener("DOMContentLoaded", () => {

  // === Register Company ===
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("registerEmail").value;
      const password = document.getElementById("registerPassword").value;
      const companyName = document.getElementById("companyName").value;
      const companyCode = Math.random().toString(36).substring(2, 10).toUpperCase();

      auth.createUserWithEmailAndPassword(email, password)
        .then(cred => {
          return db.collection("companies").doc(cred.user.uid).set({
            email,
            companyName,
            companyCode,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        })
        .then(() => {
          return emailjs.send("service_nk46jxr", "template_4n630w9", {
            to_email: email,
            company_name: companyName,
            company_code: companyCode
          });
        })
        .then(() => {
          alert("Registration successful!");
          location.href = "admin.html";
        })
        .catch(err => alert("Registration failed: " + err.message));
    });
  }

  // === Admin Login ===
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      auth.signInWithEmailAndPassword(email, password)
        .then(async (cred) => {
          const doc = await db.collection("companies").doc(cred.user.uid).get();
          if (!doc.exists) {
            await cred.user.delete();
            alert("Company not found.");
            return auth.signOut();
          }
          alert("Login successful.");
          location.href = "admin.html"; // redirect now
        })
        .catch(err => alert("Login failed: " + err.message));
    });
  }

  // === Employee Login ===
  const employeeLoginForm = document.getElementById("employeeLoginForm");
  if (employeeLoginForm) {
    employeeLoginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const code = document.getElementById("companyCode").value.trim();

      db.collection("companies").where("companyCode", "==", code).get()
        .then(snapshot => {
          if (snapshot.empty) {
            alert("Invalid code.");
          } else {
            const companyId = snapshot.docs[0].id;
            localStorage.setItem("employeeCompanyId", companyId);
            location.href = "employee-dashboard.html";
          }
        })
        .catch(err => alert("Error: " + err.message));
    });
  }

  // === Employee Dashboard ===
  if (window.location.pathname.includes("employee-dashboard.html")) {
    const cid = localStorage.getItem("employeeCompanyId");
    if (!cid) return location.href = "employee-login.html";

    const display = document.getElementById("employeeChallengeDisplay");
    db.collection("challenges").where("companyId", "==", cid).orderBy("createdAt", "desc").limit(1).get()
      .then(snapshot => {
        display.textContent = snapshot.empty ? "No challenge set." : snapshot.docs[0].data().challenge;
      });

    const list = document.getElementById("employeeLeaderboardList");
    db.collection("departments").where("companyId", "==", cid).orderBy("points", "desc").get()
      .then(snapshot => {
        if (snapshot.empty) {
          list.innerHTML = "<li class='list-group-item'>No departments yet.</li>";
        } else {
          snapshot.forEach(doc => {
            const d = doc.data();
            let badgeSpan = "";
            if (d.badges?.length) {
              d.badges.forEach((b, i) => {
                const icon = b === "gold" ? "⭐" : b === "trophy" ? "🏆" :
                             b === "starter" ? "🔰" : b === "veteran" ? "💪" :
                             b === "comeback" ? "📈" : "";
                badgeSpan += ` <span title="${d.badgeDates?.[i] || ''}">${icon}</span>`;
              });
            }

            const nicknameText = d.nickname ? ` (${d.nickname})` : "";
            list.innerHTML += `<li class='list-group-item'>${d.name}${nicknameText} – ${d.points} pts ${badgeSpan}</li>`;
          });
        }
      });
  }

  // === Admin Dashboard Live Load ===
  auth.onAuthStateChanged((user) => {
    if (!user || !window.location.pathname.includes("admin.html")) return;

    db.collection("companies").doc(user.uid).get().then(doc => {
      const head = document.getElementById("companyNameHeader");
      if (doc.exists && head) head.textContent = `${doc.data().companyName} – Admin Dashboard`;
    });

    const addForm = document.getElementById("addDepartmentForm");
    if (addForm) {
      addForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("departmentName").value;
        const points = parseInt(document.getElementById("departmentPoints").value, 10);
        const nick = document.getElementById("departmentNick")?.value || "";
        db.collection("departments").add({
          name, points, nickname: nick,
          companyId: user.uid,
          goldStreaks: 0,
          badges: [],
          badgeDates: []
        }).then(() => location.reload());
      });
    }

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
            alert("Points added.");
            location.reload();
          });
      });
    }

    const challengeForm = document.getElementById("challengeForm");
    if (challengeForm) {
      challengeForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const txt = document.getElementById("weeklyChallenge").value;
        db.collection("challenges").add({
          challenge: txt,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          companyId: user.uid
        }).then(() => location.reload());
      });

      db.collection("challenges").where("companyId", "==", user.uid).orderBy("createdAt", "desc").limit(1).get()
        .then(snapshot => {
          const display = document.getElementById("challengeDisplay");
          if (snapshot.empty) {
            display.textContent = "No challenge set.";
          } else {
            const c = snapshot.docs[0];
            const t = c.data().challenge;
            display.innerHTML = `
              <strong>${t}</strong>
              <button onclick="editChallenge('${c.id}', '${t}')" class="btn btn-sm btn-outline-secondary ms-2">Edit</button>
              <button onclick="deleteChallenge('${c.id}')" class="btn btn-sm btn-outline-danger ms-1">Delete</button>
            `;
          }
        });
    }

    window.editChallenge = function (id, current) {
      const updated = prompt("Edit challenge:", current);
      if (updated) {
        db.collection("challenges").doc(id).update({ challenge: updated }).then(() => location.reload());
      }
    };

    window.deleteChallenge = function (id) {
      if (confirm("Delete challenge?")) {
        db.collection("challenges").doc(id).delete().then(() => location.reload());
      }
    };

    const leaderboardList = document.getElementById("leaderboardList");
    if (leaderboardList) {
      db.collection("departments").where("companyId", "==", user.uid).orderBy("points", "desc").onSnapshot(snapshot => {
        leaderboardList.innerHTML = "";

        if (snapshot.empty) {
          leaderboardList.innerHTML = "<li class='list-group-item'>No departments yet.</li>";
          return;
        }

        const docs = snapshot.docs;
        const top = docs[0];

        db.collection("departments").doc(top.id).get().then(async (doc) => {
          const data = doc.data();
          const now = new Date().toISOString().split("T")[0];
          const badges = data.badges || [];
          const dates = data.badgeDates || [];

          if (!badges.includes("gold")) {
            badges.push("gold");
            dates.push(now);
          }

          const newStreak = (data.goldStreaks || 0) + 1;
          await db.collection("departments").doc(top.id).update({ goldStreaks: newStreak });

          if (newStreak >= 3 && !badges.includes("trophy")) {
            badges.push("trophy");
            dates.push(now);
          }

          await db.collection("departments").doc(top.id).update({
            badges,
            badgeDates: dates
          });
        });

        docs.forEach(doc => {
          const d = doc.data();
          const name = d.name;
          const nick = d.nickname || "";
          const pts = d.points;
          const badges = d.badges || [];
          const dates = d.badgeDates || [];

          let badgeHTML = "";
          badges.forEach((b, i) => {
            const title = b === "gold" ? "⭐" : b === "trophy" ? "🏆" : "";
            badgeHTML += ` <span title="${dates[i] || ''}">${title}</span>`;
          });

          const nicknameText = nick ? ` (${nick})` : "";
          leaderboardList.innerHTML += `<li class='list-group-item'>${name}${nicknameText} – ${pts} pts ${badgeHTML}</li>`;
        });
      });
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        auth.signOut().then(() => location.href = "index-landing-page.html");
      });
    }
  });
});
