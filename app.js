// app.js

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

  // Register
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("registerEmail").value;
      const password = document.getElementById("registerPassword").value;
      const companyName = document.getElementById("companyName").value;

      auth.createUserWithEmailAndPassword(email, password)
        .then((cred) => {
          return db.collection('companies').doc(cred.user.uid).set({
            companyName: companyName,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        })
        .then(() => {
          alert("Registration successful!");
          window.location.href = "admin.html";
        })
        .catch((error) => {
          console.error(error.message);
          alert("Registration failed: " + error.message);
        });
    });
  }

  // Login
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
          console.error(error.message);
          alert("Login failed: " + error.message);
        });
    });
  }

  // Add Department
  const addDeptForm = document.getElementById("addDepartmentForm");
  if (addDeptForm) {
    addDeptForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const departmentName = document.getElementById("departmentName").value;
      const departmentPoints = parseInt(document.getElementById("departmentPoints").value, 10);

      db.collection("departments").add({
        name: departmentName,
        points: departmentPoints
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

  // Score Department
  const scoreForm = document.getElementById("scoreForm");
  if (scoreForm) {
    scoreForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const deptName = document.getElementById("scoreDeptName").value;
      const scoreValue = parseInt(document.getElementById("scoreValue").value, 10);

      db.collection("departments").where("name", "==", deptName).get()
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

  // Set Weekly Challenge
  const challengeForm = document.getElementById("challengeForm");
  if (challengeForm) {
    challengeForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const challenge = document.getElementById("weeklyChallenge").value;

      db.collection("challenges").add({
        challenge: challenge,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
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
    db.collection("challenges").orderBy("createdAt", "desc").limit(1).get()
      .then((querySnapshot) => {
        if (!querySnapshot.empty) {
          const challengeData = querySnapshot.docs[0].data();
          document.getElementById("challengeDisplay").textContent = challengeData.challenge;
        } else {
          document.getElementById("challengeDisplay").textContent = "No challenge set.";
        }
      })
      .catch((error) => {
        console.error("Error loading challenge: ", error.message);
      });
  }

  // Leaderboard
  const leaderboardList = document.getElementById("leaderboardList");
  if (leaderboardList) {
    db.collection("departments").orderBy("points", "desc").onSnapshot((snapshot) => {
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

  // Logout
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
