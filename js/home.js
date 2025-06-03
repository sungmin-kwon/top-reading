import { auth, db } from "./firebase-init.js";
import { collection, getDoc, getDocs, doc} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";

const container = document.getElementById("book-container");

function renderBookCard(book) {
  const div = document.createElement("div");
  div.className = "test-card"; // Assuming 'test-card' is your desired class name
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
    console.log("User not authenticated, redirecting to login.");
    window.location.href = "login.html";
    return;
  }

  console.log("User authenticated:", user.uid);

  // Clear previous content
  container.innerHTML = "";
  let visibleBooks = [];

  try {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      console.error("User document does not exist for UID:", user.uid);
      container.innerHTML = `<p>Error: User profile not found.</p>`;
      return;
    }

    const userData = userDocSnap.data();
    const role = userData.role;
    const allowedBooks = userData.allowedBooks || []; // Default to empty array if undefined

    console.log("User role:", role);
    console.log("User allowedBooks (from client-side userDoc):", JSON.stringify(allowedBooks));

    if (role === "Teacher") {
      console.log("Fetching all books for Teacher.");
      const snapshot = await getDocs(collection(db, "books"));
      visibleBooks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log(`Teacher fetched ${visibleBooks.length} books.`);
    } else { // Student logic
      console.log("Fetching allowed books for Student.");
      if (allowedBooks.length > 0) {
        for (const bookId of allowedBooks) {
          // Ensure bookId is a valid string before proceeding
          if (typeof bookId !== 'string' || bookId.trim() === '') {
            console.warn(`Invalid bookId found in allowedBooks: '${bookId}'. Skipping.`);
            continue;
          }
          try {
            console.log(`Attempting to fetch book with ID: "${bookId}"`);
            const bookDocRef = doc(db, "books", bookId);
            const bookDocSnap = await getDoc(bookDocRef);

            if (bookDocSnap.exists()) {
              visibleBooks.push({ id: bookId, ...bookDocSnap.data() });
              console.log(`Successfully fetched book: "${bookId}"`);
            } else {
              console.warn(`Book with ID "${bookId}" does not exist in 'books' collection (docSnap.exists() is false).`);
            }
          } catch (error) {
            // This catch block will specifically catch errors related to fetching this single book,
            // including permission errors.
            console.error(`Failed to fetch book "${bookId}":`, error.message);
            if (error.code === 'permission-denied') {
              console.error(`PERMISSION DENIED for book "${bookId}". Check Firestore rules and ensure this book ID is correctly listed in the user's 'allowedBooks' field (as seen by the rules) and that the user document is accessible by the rule's get() call.`);
            }
          }
        }
      } else {
        console.log("Student has no book IDs in their allowedBooks list.");
      }
      console.log(`Student fetched ${visibleBooks.length} books out of ${allowedBooks.length} allowed.`);
    }

    if (visibleBooks.length === 0) {
      container.innerHTML = `
        <p style="font-style: italic; opacity: 0.8;">
          You currently have no assigned books. Please contact your teacher or check your assignments.
        </p>
      `;
      console.log("No books to display.");
      return;
    }

    visibleBooks.forEach(renderBookCard);

  } catch (error) {
    // Catch errors related to fetching the user document itself or other unexpected errors
    console.error("Error in onAuthStateChanged main block:", error);
    container.innerHTML = `<p>An error occurred while loading book data. Please try again later.</p>`;
  }
});