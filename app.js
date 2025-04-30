// app.js

/* global firebase */
/* global location */

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCGW4_VqassdGCOJaGPkYLGYYvBs4QMcME",
  authDomain: "core-iii-web.firebaseapp.com",
  projectId: "core-iii-web",
  storageBucket: "core-iii-web.appspot.com",
  messagingSenderId: "22933808877",
  appId: "1:22933808877:web:f8494e90f24ca75eaa0ee4",
  measurementId: "G-3R70JDVY01"
};

// Init Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Utility: avoid duplicate alert popups
function showAlertOnce(message) {
  if (!document.body.dataset.alertShown) {
    alert(message);
    document.body.dataset.alertShown = "true";
    setTimeout(() => {
      delete document.body.dataset.alertShown;
    }, 2000);
  }
}

// Page ready
document.addEventListener("DOMContentLoaded", () => {

  // Admin Registration → Generates unique Company Code
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("registerEmail").value;
      const password = document.getElementById("registerPassword").value;
      const companyName = document.getElementById("companyName").value;
      const companyCode = Math.random().toString(36).substr(2, 8).toUpperCase(); // 8-char code

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
          alert("Registration successful! SAVE THIS CODE: " + companyCode + " — it cannot be recovered.");
          window.location.href = "admin.html";
        })
        .catch((error) => {
          showAlertOnce("Registration failed: " + error.message);
          console.error(error.message);
        });
    });
  }

  // Admin Login → Firebase email/password
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      auth.signInWithEmailAndPassword(email, password)
        .then(() => {
          alert("Login successful!");
          window.location.href = "admin.html";
        })
        .catch((error) => {
          showAlertOnce("Login failed: " + error.message);
          console.error(error.message);
        });
    });
  }

  // Secure Admin Dashboard logic — after auth ready
  auth.onAuthStateChanged((user) => {
    if (!user) return;

    // Admin: Add department
    const addDeptForm = document.getElementById("addDepartmentForm");
    if (addDeptForm) {
      addDeptForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const departmentName = document.getElementById("departmentName").value;
        const departmentPoints = parseInt(document.getElementById("departmentPoints").value, 10);

        db.collection("departments").add({
          name: departmentName,
          points: departmentPoints,
          companyId: user.uid
        })
        .then(() => {
          alert("Department added successfully.");
          location.reload();
        })
        .catch((error) => {
          console.error("Error adding department: ", error.message);
        });
      });
    }

    // Admin: Score department
    const scoreForm = document.getElementById("scoreForm");
    if (scoreForm) {
      scoreForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const deptName = document.getElementById("scoreDeptName").value;
        const scoreValue = parseInt(document.getElementById("scoreValue").value, 10);

        db.collection("departments")
          .where("companyId", "==", user.uid)
          .where("name", "==", deptName)
          .get()
          .then((querySnapshot) => {
            if (querySnapshot.empty) {
              alert("Department not found.");
              return;
            }
            querySnapshot.forEach((doc) => {
              db.collection("departments").doc(doc.id).update({
                points: firebase.firestore.FieldValue.increment(scoreValue)
              });
            });
            alert("Score added.");
            location.reload();
          })
          .catch((error) => {
            console.error("Error scoring department: ", error.message);
          });
      });
    }

    // Admin: Set weekly challenge
    const challengeForm = document.getElementById("challengeForm");
    if (challengeForm) {
      challengeForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const challenge = document.getElementById("weeklyChallenge").value;

        db.collection("challenges").add({
          challenge,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          companyId: user.uid
        })
        .then(() => {
          alert("Weekly Challenge set.");
          location.reload();
        })
        .catch((error) => {
          console.error("Error setting challenge: ", error.message);
        });
      });

      // Load latest challenge
      db.collection("challenges")
        .where("companyId", "==", user.uid)
        .orderBy("createdAt", "desc")
        .limit(1)
        .get()
        .then((querySnapshot) => {
          if (!querySnapshot.empty) {
            document.getElementById("challengeDisplay").textContent = querySnapshot.docs[0].data().challenge;
          } else {
            document.getElementById("challengeDisplay").textContent = "No challenge set.";
          }
        })
        .catch((error) => {
          console.error("Error loading challenge: ", error.message);
        });
    }

    // Admin: Load leaderboard
    const leaderboardList = document.getElementById("leaderboardList");
    if (leaderboardList) {
      db.collection("departments")
        .where("companyId", "==", user.uid)
        .orderBy("points", "desc")
        .onSnapshot((snapshot) => {
          leaderboardList.innerHTML = "";
          if (snapshot.empty) {
            leaderboardList.innerHTML = "<li class='list-group-item'>No departments yet.</li>";
            return;
          }
          snapshot.forEach((doc) => {
            const li = document.createElement("li");
            li.textContent = `${doc.data().name} - ${doc.data().points} Points`;
            li.classList.add("list-group-item");
            leaderboardList.appendChild(li);
          });
        });
    }

    // Admin: Logout
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        auth.signOut()
          .then(() => {
            window.location.href = "index.html";
          })
          .catch((error) => {
            console.error("Logout error:", error.message);
          });
      });
    }
  });
});
