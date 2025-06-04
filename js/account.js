import { auth, db } from "./firebase-init.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";

const emailEl = document.getElementById("email");
const createdEl = document.getElementById("created");
const roleEl = document.getElementById("role");
const nameEl = document.getElementById("name");
const permLink = document.getElementById("permissions-link");

onAuthStateChanged(auth, async (user) => {
  if (!user) return (window.location.href = "login.html");

  emailEl.textContent = user.email;
  createdEl.textContent = new Date(user.metadata.creationTime).toLocaleDateString();

  const docRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    roleEl.textContent = data.role || "Student";
    nameEl.textContent = `${data.firstName || ""} ${data.lastName || ""}`.trim();

    if (data.role === "Teacher" && permLink) {
      permLink.style.display = "inline-block";
    }
  } else {
    roleEl.textContent = "Student";
    nameEl.textContent = "Anonymous";
  }
});
