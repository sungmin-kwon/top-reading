import { auth, db } from './firebase-init.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js';
import { doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js';

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const firstNameInput = document.getElementById("firstName");
const lastNameInput = document.getElementById("lastName");
const nameFieldsContainer = document.getElementById("name-fields");
const status = document.getElementById("status");
const loginBox = document.getElementById("login-box");
const darkModeToggle = document.getElementById("dark-mode-toggle");

// Dark mode icon updater
function updateDarkIcon() {
  darkModeToggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
}

// Toggle handler
darkModeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  loginBox.classList.toggle("dark");
  updateDarkIcon();
});

// Set icon on load
updateDarkIcon();

// Show extra fields only for signup
let signupStage = 0;

document.getElementById("signup").addEventListener("click", async () => {
  if (signupStage === 0) {
    // First click: show name fields
    nameFieldsContainer.classList.remove("hidden");
    signupStage = 1;
    status.textContent = "Please enter first and last names to sign up.";
    return;
  }

  const first = firstNameInput.value.trim();
  const last = lastNameInput.value.trim();

  if (!first || !last) {
    status.textContent = "Please enter first and last names.";
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
    await setDoc(doc(db, "users", cred.user.uid), {
      email: cred.user.email,
      firstName: first,
      lastName: last,
      role: "Student",
      createdAt: serverTimestamp()
    });

    status.textContent = "Signed up and profile created!";
  } catch (e) {
    status.textContent = e.message;
    console.error("Signup error:", e);
  }
});

document.getElementById("login").addEventListener("click", () => {
  signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
    .then(() => {
      window.location.href = "home.html";
    })
    .catch(e => {
      status.textContent = e.message;
      console.error("Login error:", e);
    });
});

onAuthStateChanged(auth, user => {
  if (user) {
    console.log("Already logged in:", user.email);
  }
});
