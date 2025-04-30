// employee.js

const firebaseConfig = {
  // your same config
};
/*global firebase*/
/*global localStorage*/
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

document.addEventListener("DOMContentLoaded", () => {
  const companyId = localStorage.getItem("employeeCompanyId");
  if (!companyId) {
    window.location.href = "employee-login.html";
    return;
  }

  // Load challenge
  db.collection("challenges")
    .where("companyId", "==", companyId)
    .orderBy("createdAt", "desc")
    .limit(1)
    .get()
    .then((querySnapshot) => {
      if (!querySnapshot.empty) {
        document.getElementById("employeeChallenge").textContent = querySnapshot.docs[0].data().challenge;
      } else {
        document.getElementById("employeeChallenge").textContent = "No challenge set.";
      }
    });

  // Load leaderboard
  const leaderboardList = document.getElementById("employeeLeaderboard");
  db.collection("departments")
    .where("companyId", "==", companyId)
    .orderBy("points", "desc")
    .onSnapshot((snapshot) => {
      leaderboardList.innerHTML = "";
      if (snapshot.empty) {
        leaderboardList.innerHTML = "<li class='list-group-item'>No departments yet.</li>";
        return;
      }
      snapshot.forEach((doc) => {
        const li = document.createElement("li");
        li.textContent = `${doc.data().name}: ${doc.data().points} Points`;
        li.classList.add("list-group-item");
        leaderboardList.appendChild(li);
      });
    });
});
