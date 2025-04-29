// Import required functions from Firebase SDK
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your updated Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCGW4_VqassdGCOJaGPkYLGYYvBs4QMcME",
  authDomain: "core-iii-web.firebaseapp.com",
  projectId: "core-iii-web",
  storageBucket: "core-iii-web.firebasestorage.app",
  messagingSenderId: "22933808877",
  appId: "1:22933808877:web:f8494e90f24ca75eaa0ee4",
  measurementId: "G-3R70JDVY01"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
//analytics may be used later but as of time of writing is assigned a value but never used. 
const auth = getAuth(app);
const db = getFirestore(app);

// Export for use in other parts of app
export { auth, db };
 
//could, theoretically, go on top of app.js, but doing so will probably break something
//ergo, better the poison you know