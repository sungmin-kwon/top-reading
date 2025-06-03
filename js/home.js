import { auth, db } from "./firebase-init.js";
import {
  collection,
  getDoc,
  getDocs,
  doc
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";

const container = document.getElementById("book-container");

function renderBookCard(book) {
  const div = document.createElement("div");
  div.className = "test-card";
  div.innerHTML = `
    <img src="${book.coverImage || ''}" alt="${book.title}" style="width: 100px; float: right; margin-left: 20px;" />
    <h2>${book.title}</h2>
    <p>${book.description}</p>
    <a class="button" href="mcqtest.html?book=${book.id}&title=${encodeURIComponent(book.title)}">
      Start ${book.title} Test
    </a>
  `;
  container.appendChild(div);
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const userDoc = await getDoc(doc(db, "users", user.uid));
  const userData = userDoc.data();
  const role = userData.role;
  const allowedBooks = userData.allowedBooks || [];

  const snapshot = await getDocs(collection(db, "books"));
  const allBooks = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  const visibleBooks = role === "Teacher"
    ? allBooks
    : allBooks.filter(book => allowedBooks.includes(book.id));

  container.innerHTML = "";

  if (visibleBooks.length === 0) {
  container.innerHTML = `
    <p style="font-style: italic; opacity: 0.8;">
      You currently have no assigned books. Please contact your teacher.
    </p>
  `;
  return;
  }
  
  visibleBooks.forEach(renderBookCard);
});
