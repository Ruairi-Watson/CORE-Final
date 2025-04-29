// Initialize Firebase
/* global firebase */
/*global location*/
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
const analytics = firebase.analytics
//see firebaseConfig for explanation
// Dark mode toggle
document.addEventListener("DOMContentLoaded", () => {
  const darkModeBtn = document.getElementById("toggleMode");
  if (darkModeBtn) {
    darkModeBtn.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
    });
  }

  // Register form
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
            companyName: companyName
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

  // Login form
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

  // Admin Page Functions
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
  }

  // Load Leaderboard
  const leaderboardList = document.getElementById("leaderboardList");
  if (leaderboardList) {
    db.collection("departments")
      .orderBy("points", "desc")
      .onSnapshot((snapshot) => {
        leaderboardList.innerHTML = "";
        snapshot.forEach((doc) => {
          const li = document.createElement("li");
          li.textContent = `${doc.data().name} - ${doc.data().points} Points`;
          leaderboardList.appendChild(li);
        });
      });
  }
});
