/* global firebase */
/* global emailjs */
/* global location */

// Firebase setup
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
emailjs.init("gn6ldKkOG1-i58EOG"); // EmailJS public key

document.addEventListener("DOMContentLoaded", () => {

  // Registration form logic
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
          return emailjs.send("service_nk46jxr", "template_4n630w9", {
            to_email: email,
            company_name: companyName,
            company_code: companyCode
          });
        })
        .then(() => {
          alert("Registration successful! A company code has been sent to your email.");
          location.href = "admin.html";
        })
        .catch((err) => {
          console.error(err.message);
          alert("Registration failed: " + err.message);
        });
    });
  }

  // Login form logic
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
            alert("Company record missing. Account deleted.");
            return auth.signOut();
          }
          alert("Login successful!");
          location.href = "admin.html";
        })
        .catch(err => alert("Login failed: " + err.message));
    });
  }

  // Authenticated user logic (dashboard features)
  auth.onAuthStateChanged((user) => {
    if (!user) return;

    // Show company name on dashboard
    db.collection("companies").doc(user.uid).get().then(doc => {
      const el = document.getElementById("companyNameHeader");
      if (doc.exists && el) {
        el.textContent = `${doc.data().companyName} – Admin Dashboard`;
      }
    });

    // Add department logic
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

    // Score department logic
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

    // Weekly challenge setup
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

      // Load current challenge
      db.collection("challenges")
        .where("companyId", "==", user.uid)
        .orderBy("createdAt", "desc")
        .limit(1)
        .get()
        .then(snapshot => {
          const display = document.getElementById("challengeDisplay");
          if (!display) return;
          if (!snapshot.empty) {
            const doc = snapshot.docs[0].data();
            display.textContent = doc.challenge;
          } else {
            display.textContent = "No challenge set.";
          }
        });
    }

    // Leaderboard
    const leaderboardList = document.getElementById("leaderboardList");
    if (leaderboardList) {
      db.collection("departments")
        .where("companyId", "==", user.uid)
        .orderBy("points", "desc")
        .onSnapshot(snapshot => {
          leaderboardList.innerHTML = "";
          if (snapshot.empty) {
            leaderboardList.innerHTML = "<li class='list-group-item'>No departments yet.</li>";
            return;
          }

          snapshot.forEach(doc => {
            const data = doc.data();
            const li = document.createElement("li");
            li.className = "list-group-item";
            li.textContent = `${data.name}${data.nickname ? ' (' + data.nickname + ')' : ''} - ${data.points} Points`;
            leaderboardList.appendChild(li);
          });
        });
    }

    // Logout logic
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        auth.signOut().then(() => location.href = "index-landing-page.html");
      });
    }
  });
});
