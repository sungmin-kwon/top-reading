import { auth, db } from "./firebase-init.js";
import {
  collection, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";

const userSelect = document.getElementById("user-select");
const booksTable = document.getElementById("books-table").querySelector("tbody");
const confirmBtn = document.getElementById("confirm-btn");
const status = document.getElementById("status");

let allBooks = [];
let currentUserId = null;

async function loadStudents() {
  const usersSnap = await getDocs(collection(db, "users"));
  userSelect.innerHTML = "";
  usersSnap.forEach(docSnap => {
    const data = docSnap.data();
    if (data.role === "Student") {
      const opt = document.createElement("option");
      opt.value = docSnap.id;
      opt.textContent = `${data.firstName || ""} ${data.lastName || ""}`.trim() || data.email;
      userSelect.appendChild(opt);
    }
  });
}

async function checkSubmissionExists(userId, bookTitle) {
  const submissionQuery = query(
    collection(db, "submissions"),
    where("userId", "==", userId),
    where("book", "==", bookTitle)
  );
  const submissionSnap = await getDocs(submissionQuery);
  return !submissionSnap.empty;
}

async function loadBooksAndPermissions(studentId) {
  currentUserId = studentId;
  const userSnap = await getDoc(doc(db, "users", studentId));
  const allowedBooks = userSnap.exists() ? (userSnap.data().allowedBooks || []) : [];

  const booksSnap = await getDocs(collection(db, "books"));
  allBooks = booksSnap.docs.map(doc => ({ id: doc.id, title: doc.data().title }));

  booksTable.innerHTML = "";

  for (const book of allBooks) {
    const row = document.createElement("tr");

    const hasSubmission = await checkSubmissionExists(studentId, book.title);

    row.innerHTML = `
      <td>${book.title}</td>
      <td><input type="checkbox" value="${book.id}" ${allowedBooks.includes(book.id) ? "checked" : ""}></td>
      <td><button class="delete-button" ${hasSubmission ? "" : "disabled"}>📌</button></td>
    `;

    row.querySelector(".delete-button").onclick = async () => {
      const confirmDelete = confirm(`Are you sure you want to delete all submissions for "${book.title}" by this student?`);
      if (!confirmDelete) return;

      const q = query(
        collection(db, "submissions"),
        where("userId", "==", studentId),
        where("book", "==", book.title)
      );
      const snap = await getDocs(q);
      const deleteOps = snap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deleteOps);
      alert(`Submissions for "${book.title}" deleted.`);
      await loadBooksAndPermissions(studentId); // reload UI
    };

    booksTable.appendChild(row);
  }
}

userSelect.addEventListener("change", () => {
  loadBooksAndPermissions(userSelect.value);
});

confirmBtn.onclick = async () => {
  const selected = [...booksTable.querySelectorAll("input[type='checkbox']:checked")].map(cb => cb.value);
  await updateDoc(doc(db, "users", currentUserId), {
    allowedBooks: selected
  });
  status.textContent = "✅ Permissions updated!";
};

onAuthStateChanged(auth, async user => {
  if (!user) return (window.location.href = "login.html");
  const docSnap = await getDoc(doc(db, "users", user.uid));
  if (!docSnap.exists() || docSnap.data().role !== "Teacher") {
    document.body.innerHTML = "<p style='text-align:center;'>Access Denied. Teachers only.</p>";
    return;
  }
  await loadStudents();
  if (userSelect.value) loadBooksAndPermissions(userSelect.value);
});
