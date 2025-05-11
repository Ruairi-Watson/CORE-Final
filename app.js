/* /* global document, window, alert, prompt, console */
/* global emailjs */


// === Firebase configuration using your actual live project ===
const firebaseConfig = {
  apiKey: "AIzaSyCGW4_VqassdGCOJaGPkYLGYYvBs4QMcME",
  authDomain: "core-iii-web.firebaseapp.com",
  projectId: "core-iii-web",
  storageBucket: "core-iii-web.appspot.com",
  messagingSenderId: "22933808877",
  appId: "1:22933808877:web:f8494e90f24ca75eaa0ee4",
  measurementId: "G-3R70JDVY01"
};

// === Import Firebase modules ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  onAuthStateChanged, deleteUser
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// === Initialize Firebase services ===
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// === EmailJS config ===
const EMAILJS_SERVICE_ID = "service_nk46jxr";
const EMAILJS_TEMPLATE_ID = "template_4n630w9";
const EMAILJS_PUBLIC_KEY = "gn6ldKkOG1-i58EOG";

// === Global variable to track currently signed-in UID ===
let currentUID = null;

// === Detect login status and route to appropriate dashboard ===
onAuthStateChanged(auth, async user => {
  if (user) {
    currentUID = user.uid;
    const userSnap = await getDoc(doc(db, "users", currentUID));
    const userData = userSnap.data();
    if (!userData) return;

    // Redirect based on role
    if (userData.role === "admin") {
      loadAdminDashboard(userData);
    } else {
      loadEmployeeDashboard(userData);
    }
  } else {
    // Redirect unauthenticated users to login
    if (!window.location.href.includes("register")) {
      window.location.href = "employee-login.html";
    }
  }
});

// === Admin dashboard logic ===
async function loadAdminDashboard(userData) {
  const companyRef = doc(db, "companies", userData.companyCode);

  displayWelcome(userData.email);
  setupChallengeListeners(companyRef);
  setupLeaderboard(companyRef);
  setupResetButtons(companyRef);
  setupArchive(companyRef);
  setupAccountDeletion(companyRef);
}

// === Employee dashboard logic ===
async function loadEmployeeDashboard(userData) {
  const companyRef = doc(db, "companies", userData.companyCode);

  setupLeaderboard(companyRef);
  setupCurrentChallenges(companyRef, userData);
}

// === Display the user's email in the welcome banner ===
function displayWelcome(email) {
  const welcome = document.getElementById("welcomeMessage");
  if (welcome) welcome.textContent = `Logged in as: ${email}`;
}

// === CHALLENGE CREATION ===
document.getElementById("createChallengeBtn")?.addEventListener("click", async () => {
  const title = document.getElementById("challengeTitle").value.trim();
  const points = parseInt(document.getElementById("challengePoints").value);
  const expiresAt = new Date(document.getElementById("challengeExpiry").value);

  if (!title || isNaN(points) || !expiresAt) return alert("All fields are required.");

  const userSnap = await getDoc(doc(db, "users", currentUID));
  const companyCode = userSnap.data().companyCode;

  const challengeRef = doc(collection(db, "companies", companyCode, "challenges"));
  await setDoc(challengeRef, {
    title,
    points,
    expiresAt,
    createdAt: serverTimestamp()
  });

  // Clear form fields after creation
  document.getElementById("challengeTitle").value = "";
  document.getElementById("challengePoints").value = "";
  document.getElementById("challengeExpiry").value = "";
  alert("Challenge created.");
});

// === DISPLAY CHALLENGES TO EMPLOYEES ===
function setupCurrentChallenges(companyRef, userData) {
  const q = query(collection(companyRef, "challenges"), orderBy("createdAt", "desc"));
  onSnapshot(q, snapshot => {
    const list = document.getElementById("employeeChallenges");
    if (!list) return;
    list.innerHTML = "";

    snapshot.forEach(doc => {
      const c = doc.data();
      if (new Date() > c.expiresAt.toDate()) return; // skip expired

      const li = document.createElement("li");
      li.innerText = `${c.title} (${c.points} pts)`;
      li.tabIndex = 0;
      li.setAttribute("role", "button");
      li.setAttribute("aria-label", `Complete challenge: ${c.title}`);
      li.addEventListener("click", () => completeChallenge(userData, c.points, companyRef));
      list.appendChild(li);
    });
  });
}

// === EMPLOYEE COMPLETES A CHALLENGE ===
async function completeChallenge(userData, points, companyRef) {
  const deptRef = doc(companyRef, "departments", userData.department);
  const deptSnap = await getDoc(deptRef);
  const dept = deptSnap.data() || { score: 0, badges: [], goldStreaks: 0 };

  const updatedScore = (dept.score || 0) + points;

  await updateDoc(deptRef, { score: updatedScore });
  await checkBadges(companyRef);
}

// === BADGE LOGIC: check top scorer, streaks, assign badges ===
async function checkBadges(companyRef) {
  const snap = await getDocs(collection(companyRef, "departments"));
  const depts = [];

  snap.forEach(doc => depts.push({ id: doc.id, ...doc.data() }));
  depts.sort((a, b) => b.score - a.score);

  if (!depts.length) return;

  const top = depts[0];
  const topRef = doc(companyRef, "departments", top.id);
  let badges = top.badges || [];

  // Add gold star if not already awarded
  if (!badges.includes("gold-star")) {
    badges.push("gold-star");
    await updateDoc(topRef, {
      badges,
      lastTopDate: serverTimestamp()
    });
  }

  const newStreak = (top.goldStreaks || 0) + 1;
  await updateDoc(topRef, { goldStreaks: newStreak });

  // Give trophy if on a 3-win streak
  if (newStreak >= 3 && !badges.includes("trophy")) {
    badges.push("trophy");
    await updateDoc(topRef, {
      badges,
      lastTopDate: serverTimestamp()
    });
  }

  // Reset streaks for everyone else
  for (let i = 1; i < depts.length; i++) {
    await updateDoc(doc(companyRef, "departments", depts[i].id), { goldStreaks: 0 });
  }
}

// === LEADERBOARD RENDERING ===
function setupLeaderboard(companyRef) {
  const q = query(collection(companyRef, "departments"));
  onSnapshot(q, snapshot => {
    const table = document.getElementById("leaderboard");
    if (!table) return;
    const data = [];

    snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
    data.sort((a, b) => b.score - a.score);

    const tbody = table.querySelector("tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    data.forEach(dept => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${dept.name}</td>
        <td>${dept.score}</td>
        <td>${(dept.badges || []).join(", ")}</td>
      `;
      tbody.appendChild(tr);
    });
  });
}

// === CSV EXPORT OF LEADERBOARD ===
document.getElementById("exportCSVBtn")?.addEventListener("click", async () => {
  const userSnap = await getDoc(doc(db, "users", currentUID));
  const companyCode = userSnap.data().companyCode;

  const q = query(collection(db, "companies", companyCode, "departments"));
  const snap = await getDocs(q);

  let csv = "Department,Score,Badges\n";
  snap.forEach(doc => {
    const d = doc.data();
    csv += `${d.name},${d.score},"${(d.badges || []).join(" | ")}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "leaderboard.csv";
  a.click();
});

// === RESET SCORES/STREAKS ===
function setupResetButtons(companyRef) {
  document.getElementById("resetAllBtn")?.addEventListener("click", async () => {
    const depts = await getDocs(collection(companyRef, "departments"));
    depts.forEach(async d => {
      await updateDoc(doc(companyRef, "departments", d.id), {
        score: 0,
        goldStreaks: 0,
        badges: []
      });
    });
    alert("All department scores and streaks reset.");
  });
}

// === DISPLAY ARCHIVED (EXPIRED) CHALLENGES ===
function setupArchive(companyRef) {
  const q = query(collection(companyRef, "challenges"));
  onSnapshot(q, snapshot => {
    const archive = document.getElementById("challengeArchive");
    if (!archive) return;
    archive.innerHTML = "";
    snapshot.forEach(doc => {
      const d = doc.data();
      const expired = new Date(d.expiresAt.toDate()) < new Date();
      if (!expired) return;
      const div = document.createElement("div");
      div.textContent = `${d.title} (${d.points} pts) – Expired: ${d.expiresAt.toDate().toLocaleDateString()}`;
      archive.appendChild(div);
    });
  });
}

// === DELETE ENTIRE COMPANY AND USERS ===
function setupAccountDeletion(companyRef) {
  document.getElementById("deleteCompanyBtn")?.addEventListener("click", async () => {
    const confirmInput = prompt("Type DELETE to confirm:");
    if (confirmInput !== "DELETE") return;

    const companyCode = companyRef.id;

    // Delete departments and challenges
    const collections = ["departments", "challenges"];
    for (const col of collections) {
      const docs = await getDocs(collection(companyRef, col));
      docs.forEach(async d => await deleteDoc(doc(companyRef, col, d.id)));
    }

    // Delete all users from this company
    const users = await getDocs(collection(db, "users"));
    users.forEach(async u => {
      if (u.data().companyCode === companyCode) {
        await deleteDoc(doc(db, "users", u.id));
      }
    });

    // Delete the company doc itself
    await deleteDoc(companyRef);

    // Delete this admin user from Auth
    await deleteUser(auth.currentUser);

    window.location.href = "index-landing-page.html";
  });
}

// === ERROR REPORT FORM: Send to EmailJS ===
document.getElementById("errorForm")?.addEventListener("submit", e => {
  e.preventDefault();
  const desc = document.getElementById("errorDesc").value;
  const userEmail = document.getElementById("userEmail").value;

  emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
    from_email: userEmail,
    message: desc
  }, EMAILJS_PUBLIC_KEY).then(() => {
    alert("Error report sent.");
  }).catch(err => {
    console.error(err);
    alert("Failed to send report.");
  });
});
