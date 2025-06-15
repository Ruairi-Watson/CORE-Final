/**
 * CORE Platform - Main Application JavaScript
 * @description Core functionality for authentication, database operations, and user management
 * @version 2.0.0
 * @license ISC
 * 
 * This file handles:
 * 1. User authentication (both admin and employee)
 * 2. Company registration
 * 3. Department point management
 * 4. Leaderboard functionality
 * 5. Email notifications
 */

'use strict';

// Application routes
const ROUTES = {
  ADMIN: '/admin.html',
  EMPLOYEE: '/employee.html',
  LOGIN: '/index-login.html',
  EMPLOYEE_LOGIN: '/employee-login.html'
};

/**
 * User-friendly error messages for all possible error scenarios
 * These messages are designed to be clear and actionable for end users
 */
const ERROR_MESSAGES = {
  AUTH_FAILED: 'Unable to log in. Please check your email and password and try again.',
  ADMIN_REQUIRED: 'This account does not have administrator privileges. Please log in with an admin account.',
  EMAIL_FAILED: 'Your account was created successfully, but we could not send the confirmation email. Please save your login information.',
  NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection and try again.',
  INVALID_INPUT: 'Please fill in all required fields correctly.',
  DATABASE_ERROR: 'Unable to save changes. Please try again in a few moments.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  PASSWORD_WEAK: 'Password must be at least 6 characters long and include a number.',
  COMPANY_EXISTS: 'This company is already registered. Please contact support if you need assistance.',
  DEPARTMENT_EXISTS: 'This department already exists. Please use a different name.',
  POINTS_INVALID: 'Please enter a valid number of points.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again to continue.',
  ACCESS_DENIED: 'You do not have permission to access this page.',
  REGISTRATION_FAILED: 'Unable to complete registration. Please try again or contact support.'
};

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCGW4_VqassdGCOJaGPkYLGYYvBs4QMcME",
  authDomain: "core-iii-web.firebaseapp.com",
  projectId: "core-iii-web",
  storageBucket: "core-iii-web.appspot.com",
  messagingSenderId: "22933808877",
  appId: "1:22933808877:web:f8494e90f24ca75eaa0ee4",
  measurementId: "G-3R70JDVY01"
};

// Initialize Firebase services
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.getAuth();
const db = firebase.getFirestore();

/**
 * List of restricted department names
 * These names are reserved for system use and cannot be used as department names
 * to prevent confusion with administrative roles
 */
const bannedNames = [
  "hr", "management", "human resources", "managers", "admin", "executives"
];

/**
 * Gets current timestamp in milliseconds
 * Used for tracking creation dates and update times
 * @returns {number} Current timestamp
 */
const now = () => new Date().getTime();

/**
 * Initializes the email notification service
 * Sets up error handling for email delivery failures
 */
document.addEventListener("DOMContentLoaded", () => {
  if (typeof emailjs !== "undefined") {
    try {
      emailjs.init("gn6ldKkOG1-i58EOG");
      console.log("Email service initialized successfully");
    } catch (error) {
      console.error("Email service initialization failed:", error);
      showError("Email notifications may not work properly. Please save any important information manually.");
    }
  } else {
    console.error("Email service not available");
    showError("Email notifications are currently unavailable. Please save any important information manually.");
  }
});

/**
 * Handles user logout process
 * Signs out the user and redirects to landing page
 * Includes error handling for failed logout attempts
 */
function logout() {
  auth.signOut()
    .then(() => {
      window.location.href = "index-landing-page.html";
    })
    .catch(error => {
      console.error("Logout failed:", error);
      showError("Unable to log out properly. Please close your browser and try again.");
    });
}

/**
 * Handles the company registration process
 * Simplified for demo version
 */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const company = document.getElementById("companyName").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    // Input validation
    if (!company || !email || !password) {
      showError("Please fill in all fields");
      return;
    }

    if (!isValidEmail(email)) {
      showError("Please enter a valid email address");
      return;
    }

    // Demo mode - simplified registration
    showError("Registration successful! You can now log in.", "success-message");
    setTimeout(() => {
      window.location.href = "index-login.html";
    }, 2000);
  });
});

// --- Utility Functions ---
/**
 * Displays error or success messages to the user
 * @param {string} message - The message to display
 * @param {string} elementId - ID of the element to show message in (optional)
 * @param {string} type - Type of message ('error' or 'success')
 */
const showError = (message, elementId = 'error-message', type = 'error') => {
  const element = document.querySelector(`#${elementId}`) || 
                 document.querySelector('.form-feedback');
  if (element) {
    element.textContent = message;
    element.setAttribute('role', 'alert');
    element.className = `form-feedback ${type}`;
    element.style.color = type === 'success' ? '#28a745' : 'var(--error-color)';
  } else {
    // Fallback to alert if no suitable element found
    alert(message);
  }
};

/**
 * Validates email format using RFC 5322 standard
 * @param {string} email - The email to validate
 * @returns {boolean} - True if email is valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
};

// --- Authentication Functions ---
/**
 * Handles admin login process
 * Simplified for demo version
 * @param {Event} event - Form submission event
 */
const handleAdminLogin = async (event) => {
  event.preventDefault();
  
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  
  if (!email || !password) {
    showError("Please fill in all fields");
    return;
  }

  // Demo mode - accept any valid email format
  if (!isValidEmail(email)) {
    showError("Please enter a valid email address");
    return;
  }

  // Demo mode - accept any password
  showError("Login successful! Redirecting...", "form-feedback", "success");
  setTimeout(() => {
    window.location.href = ROUTES.ADMIN;
  }, 1000);
};

/**
 * Handles employee login process
 * Simplified for demo version
 * @param {Event} event - Form submission event
 */
const handleEmployeeLogin = async (event) => {
  event.preventDefault();
  
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  
  if (!email || !password) {
    showError("Please fill in all fields");
    return;
  }

  // Demo mode - accept any valid email format
  if (!isValidEmail(email)) {
    showError("Please enter a valid email address");
    return;
  }

  // Demo mode - accept any password
  showError("Login successful! Redirecting...", "form-feedback", "success");
  setTimeout(() => {
    window.location.href = ROUTES.EMPLOYEE;
  }, 1000);
};

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
  // Setup login form handlers
  const adminLoginForm = document.getElementById('adminLoginForm');
  const employeeLoginForm = document.getElementById('employeeLoginForm');
  
  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', handleAdminLogin);
  }
  
  if (employeeLoginForm) {
    employeeLoginForm.addEventListener('submit', handleEmployeeLogin);
  }
  
  // Setup auth state observer
  auth.onAuthStateChanged((user) => {
    if (user) {
      console.log('User is signed in:', user.email);
    } else {
      console.log('No user is signed in');
    }
  });
});

// --- Error Handling ---
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  showError(ERROR_MESSAGES.NETWORK_ERROR);
});

// Prevent form resubmission on page refresh
if (window.history.replaceState) {
  window.history.replaceState(null, null, window.location.href);
}

/**
 * Adds points to a department's score
 * Validates input, updates department document, and refreshes leaderboard
 * Includes error handling for invalid inputs and database operations
 */
async function addPoints() {
  const name = document.getElementById("scoreDeptName").value.trim().toLowerCase();
  const points = parseInt(document.getElementById("scorePoints").value.trim());

  // Input validation
  if (!name || !points) {
    showError("Please fill in all fields");
    return;
  }

  if (isNaN(points) || points <= 0) {
    showError("Please enter a valid positive number of points");
    return;
  }

  // Check for banned names
  if (bannedNames.includes(name)) {
    showError("This department name is not allowed");
    return;
  }

  try {
    const deptRef = db.collection("departments").doc(name);
    const deptDoc = await deptRef.get();

    if (!deptDoc.exists) {
      showError("Department not found");
      return;
    }

    const currentData = deptDoc.data();
    const newPoints = (currentData.points || 0) + points;
    const history = currentData.history || [];
    
    // Add to history
    history.push({
      points,
      date: now(),
      addedBy: auth.currentUser?.uid || 'system'
    });

    // Update department document
    await deptRef.update({
      points: newPoints,
      lastUpdated: now(),
      history: history
    });

    showError(`Successfully added ${points} points to ${name}!`, "form-feedback", "success");
    
    // Clear form
    document.getElementById("scoreDeptName").value = "";
    document.getElementById("scorePoints").value = "";

    // Refresh leaderboard
    await loadLeaderboard();
  } catch (error) {
    console.error("Error adding points:", error);
    showError("Failed to add points. Please try again.");
  }
}

/**
 * Edits the total points for a department
 * Validates input, updates department document, and maintains history
 * Includes error handling for invalid inputs and database operations
 */
async function editPoints() {
  const name = document.getElementById("editDeptName").value.trim().toLowerCase();
  const points = parseInt(document.getElementById("editDeptPoints").value.trim());

  // Input validation
  if (!name || !points) {
    showError("Please fill in all fields");
    return;
  }

  if (isNaN(points) || points < 0) {
    showError("Please enter a valid non-negative number of points");
    return;
  }

  // Check for banned names
  if (bannedNames.includes(name)) {
    showError("This department name is not allowed");
    return;
  }

  try {
    const deptRef = db.collection("departments").doc(name);
    const deptDoc = await deptRef.get();

    if (!deptDoc.exists) {
      showError("Department not found");
      return;
    }

    const currentData = deptDoc.data();
    const history = currentData.history || [];
    
    // Add to history
    history.push({
      points: points - (currentData.points || 0), // Record the point difference
      date: now(),
      addedBy: auth.currentUser?.uid || 'system',
      type: 'manual_edit'
    });

    // Update department document
    await deptRef.update({
      points: points,
      lastUpdated: now(),
      history: history
    });

    showError(`Successfully updated ${name}'s total points to ${points}!`, "form-feedback", "success");
    
    // Clear form
    document.getElementById("editDeptName").value = "";
    document.getElementById("editDeptPoints").value = "";

    // Refresh leaderboard
    await loadLeaderboard();
  } catch (error) {
    console.error("Error editing points:", error);
    showError("Failed to update points. Please try again.");
  }
}

/**
 * Loads and displays the department leaderboard
 * Updates department achievements and badges
 * Includes error handling for database operations
 */
async function loadLeaderboard() {
  const list = document.getElementById("leaderboardList");
  if (!list) return;
  
  try {
    list.innerHTML = "<li>Loading leaderboard...</li>";

    const snap = await db.collection("departments").orderBy("points", "desc").get();
    const departments = [];
    
    snap.forEach(doc => {
      const data = doc.data();
      data.name = doc.id;
      departments.push(data);
    });

    // Update achievements for top department
    if (departments.length > 0) {
      const topDept = departments[0];
      const ref = db.collection("departments").doc(topDept.name);
      const deptData = await ref.get();
      
      if (deptData.exists) {
        let streak = deptData.data().streak || 0;
        streak++;
        
        await ref.update({
          streak,
          lastUpdated: now(),
          ...(streak === 1 && { goldAwarded: now() }),
          ...(streak >= 3 && { trophyAwarded: now() })
        });
      }
    }

    // Display departments and achievements
    if (departments.length === 0) {
      list.innerHTML = "<li>No departments found. Add points to see the leaderboard.</li>";
      return;
    }

    list.innerHTML = "";
    departments.forEach((dept, index) => {
      const li = document.createElement("li");
      const position = index + 1;
      
      // Add position indicator (🥇, 🥈, 🥉 for top 3)
      const medal = position === 1 ? "🥇" : position === 2 ? "🥈" : position === 3 ? "🥉" : "";
      
      li.textContent = `${medal} ${dept.name}: ${dept.points} points`;
      
      // Add achievement badges
      const span = document.createElement("span");
      const badges = [];

      if (dept.trophyAwarded) {
        badges.push(`<span title="🏆 3-Week Streak Champion (Achieved: ${new Date(dept.trophyAwarded).toLocaleDateString()})">🏆</span>`);
      }
      if (dept.goldAwarded) {
        badges.push(`<span title="⭐ First Place Achievement (Achieved: ${new Date(dept.goldAwarded).toLocaleDateString()})">⭐</span>`);
      }

      // Check weekly achievement
      const weekAgo = now() - 7 * 24 * 60 * 60 * 1000;
      const weeklyPoints = (dept.history || [])
        .filter(e => e.date >= weekAgo)
        .reduce((sum, e) => sum + (e.points || 0), 0);
        
      if (weeklyPoints >= 200) {
        badges.push(`<span title="🔥 High Achiever: ${weeklyPoints} points this week">🔥</span>`);
      }

      span.innerHTML = badges.join(" ");
      li.appendChild(span);
      list.appendChild(li);
    });
  } catch (error) {
    console.error("Error loading leaderboard:", error);
    list.innerHTML = "<li>Unable to load the leaderboard. Please refresh the page.</li>";
  }
}

/**
 * Resets all department data to initial state
 * Includes safety checks and confirmation
 * @returns {Promise<void>}
 */
async function resetAllData() {
  try {
    // Safety check - require confirmation
    if (!confirm('Are you sure you want to reset all department data? This cannot be undone.')) {
      return;
    }

    const departments = await db.collection("departments").get();
    const batch = db.batch();

    departments.forEach(doc => {
      batch.update(doc.ref, {
        points: 0,
        history: [],
        streak: 0,
        goldAwarded: null,
        trophyAwarded: null,
        lastUpdated: now()
      });
    });

    await batch.commit();
    showError("All department data has been reset successfully!", "form-feedback", "success");
    await loadLeaderboard();
  } catch (error) {
    console.error("Error resetting data:", error);
    showError("Failed to reset data. Please try again.");
  }
}

/**
 * Submits demo data to initialize the system
 * Creates sample departments with initial points
 * @returns {Promise<void>}
 */
async function submitDemoData() {
  try {
    const demoDepartments = [
      { name: "engineering", points: 150, history: [{ points: 150, date: now(), addedBy: 'system' }] },
      { name: "marketing", points: 120, history: [{ points: 120, date: now(), addedBy: 'system' }] },
      { name: "sales", points: 200, history: [{ points: 200, date: now(), addedBy: 'system' }] },
      { name: "design", points: 180, history: [{ points: 180, date: now(), addedBy: 'system' }] }
    ];

    const batch = db.batch();

    for (const dept of demoDepartments) {
      const deptRef = db.collection("departments").doc(dept.name);
      batch.set(deptRef, {
        ...dept,
        lastUpdated: now(),
        streak: 0,
        goldAwarded: null,
        trophyAwarded: null
      });
    }

    await batch.commit();
    showError("Demo data has been submitted successfully!", "form-feedback", "success");
    await loadLeaderboard();
  } catch (error) {
    console.error("Error submitting demo data:", error);
    showError("Failed to submit demo data. Please try again.");
  }
}

/**
 * Authentication state observer
 * Simplified for demo version
 */
auth.onAuthStateChanged(async user => {
  const pageId = document.body.id;
  
  if (pageId === "admin-dashboard") {
    // Demo mode - always load dashboard data
    loadLeaderboard();
  }
});

/**
 * Handles error report submission
 * Validates input, saves to database, and sends email notification
 * @param {Event} event - Form submission event
 */
async function submitErrorReport(event) {
  event.preventDefault();
  
  const description = document.getElementById('error-message').value.trim();
  const errorType = document.getElementById('error-type').value;
  const steps = document.getElementById('steps').value.trim();
  const browserInfo = document.getElementById('browser-info').value;
  const pageUrl = document.getElementById('page-url').value;
  const timestamp = document.getElementById('timestamp').value;

  // Input validation
  if (!description || !errorType) {
    showError('Please fill in all required fields.');
    return;
  }

  if (description.length < 20) {
    showError('Please provide a more detailed description (minimum 20 characters).');
    return;
  }

  try {
    // Get current user and verify authentication
    const user = auth.currentUser;
    if (!user) {
      showError('Your session has expired. Please log in again.');
      setTimeout(() => {
        window.location.href = ROUTES.LOGIN;
      }, 2000);
      return;
    }

    // Get user's department if available
    let userDepartment = '';
    try {
      const employeeDoc = await db.collection('employees').doc(user.uid).get();
      if (employeeDoc.exists) {
        userDepartment = employeeDoc.data().department || '';
      }
    } catch (error) {
      console.error('Error fetching department:', error);
      // Continue without department info
    }

    // Create error report document
    const errorReport = {
      userId: user.uid,
      userEmail: user.email,
      department: userDepartment,
      description,
      errorType,
      steps,
      systemInfo: {
        browser: browserInfo,
        page: pageUrl,
        timestamp: new Date(timestamp)
      },
      status: 'new',
      createdAt: now(),
      lastUpdated: now()
    };

    // Save to database with retry
    let reportRef;
    try {
      reportRef = await db.collection('errorReports').add(errorReport);
    } catch (dbError) {
      console.error('Database error:', dbError);
      if (dbError.code === 'permission-denied') {
        throw new Error('You do not have permission to submit reports. Please contact your administrator.');
      }
      throw new Error('Unable to save your report. Please try again.');
    }

    // Send email notification with template verification
    try {
      // Verify EmailJS is initialized
      if (typeof emailjs === 'undefined') {
        throw new Error('Email service not initialized');
      }

      const emailTemplate = {
        report_id: reportRef.id,
        user_email: user.email,
        error_type: errorType,
        description: description.substring(0, 500), // Limit description length for email
        department: userDepartment,
        page_url: pageUrl,
        timestamp: new Date(timestamp).toLocaleString()
      };

      await emailjs.send('service_nk46jxr', 'template_error_report', emailTemplate);
      console.log('Error report notification sent successfully');
    } catch (emailError) {
      console.error('Failed to send error report notification:', emailError);
      // Update database to mark email failure
      try {
        await reportRef.update({
          emailStatus: 'failed',
          emailError: emailError.message
        });
      } catch (updateError) {
        console.error('Failed to update email status:', updateError);
      }
    }

    // Show success message
    showError(
      'Your report has been submitted successfully. Reference ID: ' + reportRef.id, 
      'success-message', 
      'success'
    );

    // Reset form after delay
    setTimeout(() => {
      const form = document.getElementById('errorForm');
      if (form) {
        form.reset();
        // Reset hidden fields
        document.getElementById('browser-info').value = navigator.userAgent;
        document.getElementById('page-url').value = window.location.href;
        document.getElementById('timestamp').value = new Date().toISOString();
      }
    }, 2000);

  } catch (error) {
    console.error('Error submitting report:', error);
    
    let errorMessage = error.message || 'Unable to submit your report. ';
    if (error.code === 'permission-denied') {
      errorMessage = 'You do not have permission to submit reports. Please contact your administrator.';
    } else if (error.code === 'unauthenticated') {
      errorMessage = 'Please log in and try again.';
    } else if (!navigator.onLine) {
      errorMessage = 'You appear to be offline. Please check your internet connection and try again.';
    } else {
      errorMessage += ' Please try again or contact support directly.';
    }
    
    showError(errorMessage);
    throw error; // Re-throw to trigger the form's error handling
  }
}
