import { auth, db } from "./firebase-init.js";
import { collection, getDoc, getDocs, doc
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";
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
    window.location.href = "login.html";
    return;
  }

  // Clear previous content
  container.innerHTML = "";
  let visibleBooks = [];

  try {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      // It's good practice to inform the user if their profile is missing
      container.innerHTML = `<p style="font-style: italic; opacity: 0.8;">Your user profile was not found. Please contact support.</p>`;
      return;
    }

    const userData = userDocSnap.data();
    const role = userData.role;
    const allowedBooks = userData.allowedBooks || []; // Default to empty array

    if (role === "Teacher") {
      const snapshot = await getDocs(collection(db, "books"));
      visibleBooks = snapshot.docs.map(docData => ({ // Renamed 'doc' to 'docData' to avoid conflict
        id: docData.id,
        ...docData.data()
      }));
    } else { // Student logic
      if (allowedBooks.length > 0) {
        const bookPromises = allowedBooks.map(async (bookId) => {
          // Ensure bookId is a valid string before proceeding
          if (typeof bookId !== 'string' || bookId.trim() === '') {
            // Silently skip invalid bookIds in production, or log to a server-side analytics/error tool if needed
            return null;
          }
          try {
            const bookDocRef = doc(db, "books", bookId);
            const bookDocSnap = await getDoc(bookDocRef);
            return bookDocSnap.exists() ? { id: bookId, ...bookDocSnap.data() } : null;
          } catch (error) {
            // Log unexpected errors during individual book fetch if necessary, perhaps to a dedicated error tracker
            // For now, we'll let it return null, and it will be filtered out.
            // console.error(`Error fetching book "${bookId}": ${error.message}`); // Keep this commented or use a proper error tracker
            return null;
          }
        });

        const results = await Promise.all(bookPromises);
        visibleBooks = results.filter(book => book !== null);
      }
    }

    if (visibleBooks.length === 0) {
      container.innerHTML = `
        <p style="font-style: italic; opacity: 0.8;">
          You currently have no assigned books. Please contact your teacher or check your assignments.
        </p>
      `;
      return;
    }

    visibleBooks.forEach(renderBookCard);

  } catch (error) {
    // Catch errors related to fetching the user document itself or other unexpected errors
    // console.error("Critical error in onAuthStateChanged:", error); // Keep this commented or use a proper error tracker
    container.innerHTML = `<p style="font-style: italic; opacity: 0.8;">An error occurred while loading your books. Please try refreshing the page.</p>`;
  }
});