/* global firebase */
/* global emailjs */
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
emailjs.init("gn6ldKkOG1-i58EOG");

document.addEventListener("DOMContentLoaded", () => {

  // Registration form
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
            companyCode
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

  // Login form
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

  // Main dashboard logic
  auth.onAuthStateChanged((user) => {
    if (!user) return;

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

          const docs = snapshot.docs;
          for (let doc of docs) {
            const data = doc.data();

            // Exclude HR or Management
            const lowerName = data.name.trim().toLowerCase();
            if (["hr", "human relations", "management", "upper managment", "middle managment"].includes(lowerName)) continue;

            const li = document.createElement("li");

            // Emoji avatar based on department name
            const emoji = {
              "sales": "💼",
              "engineering": "🔧",
              "marketing": "🎯",
              "research": "🔬"
            }[lowerName] || "🏢";

            const name = data.name;
            const nick = data.nickname ? ` (${data.nickname})` : "";
            const pts = data.points;

            // Badge logic
            const badgeIcons = [];
            const badgeTitles = [];

            if (pts >= 50) {
              badgeIcons.push("⭐");
              badgeTitles.push("Starter - 50pts");
            }
            if (pts >= 100) {
              badgeIcons.push("🌟");
              badgeTitles.push("Veteran - 100pts");
            }
            if (data.lastGain && data.lastGain >= 30) {
              badgeIcons.push("🔥");
              badgeTitles.push("Comeback - Gained 30+pts");
            }

            const badgeHTML = badgeIcons.map((icon, i) => {
              return ` <span title="${badgeTitles[i]}">${icon}</span>`;
            }).join("");

            li.className = "list-group-item";
            li.innerHTML = `${emoji} ${name}${nick} - ${pts} Points ${badgeHTML}`;
            leaderboardList.appendChild(li);
          }
        });
    }
  });

});
