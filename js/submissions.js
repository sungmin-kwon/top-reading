import { auth, db } from "./firebase-init.js";
import { collection, query, where, getDocs, getDoc, doc} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";

const tbody = document.querySelector("#submissions-table tbody");
const table = document.querySelector("#submissions-table");
const modal = document.getElementById("submission-modal");
const closeModal = document.getElementById("close-modal");
const modalSummary = document.getElementById("modal-summary");
const modalQuestions = document.getElementById("modal-questions");

let submissionData = [];

function renderTable(data) {
  tbody.innerHTML = "";
  data.forEach(({ docId, book, chapter, score, total, timestamp }) => {
    const row = document.createElement("tr");
    const dateStr = timestamp ? timestamp.toDate().toLocaleString() : "Unknown";
    const percentage = ((score / total) * 100).toFixed(1);
    row.innerHTML = `
      <td>${book}</td>
      <td>${chapter}</td>
      <td data-score="${parseFloat(percentage)}">${percentage}%</td>
      <td><a href="#" class="view-submission" data-id="${docId}">${dateStr}</a></td>
    `;
    tbody.appendChild(row);
  });
}

function sortTableBy(key, ascending = true) {
  submissionData.sort((a, b) => {
    let valA = a[key], valB = b[key];
    if (key === "timestamp") {
      valA = valA?.toMillis?.() || 0;
      valB = valB?.toMillis?.() || 0;
    }
    if (key === "score") {
      valA = a.score / a.total;
      valB = b.score / b.total;
    }
    return ascending ? valA - valB : valB - valA;
  });
  renderTable(submissionData);
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const q = query(collection(db, "submissions"), where("userId", "==", user.uid));
  const snapshot = await getDocs(q);

  submissionData = snapshot.docs.map(doc => ({
    docId: doc.id,
    ...doc.data()
  }));

  renderTable(submissionData);
});

let currentSort = {};
table.querySelectorAll("th[data-key]").forEach(th => {
  th.style.cursor = "pointer";
  th.addEventListener("click", () => {
    const key = th.getAttribute("data-key");
    const ascending = currentSort.key === key ? !currentSort.ascending : true;
    currentSort = { key, ascending };
    sortTableBy(key, ascending);

    document.querySelectorAll(".sort-indicator").forEach(span => span.textContent = "");
    const arrow = ascending ? "↑" : "↓";
    th.querySelector(".sort-indicator").textContent = arrow;
  });
});

document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("view-submission")) {
    e.preventDefault();
    const id = e.target.dataset.id;
    const snap = await getDoc(doc(db, "submissions", id));
    if (!snap.exists()) return;

    const data = snap.data();
    const timestamp = data.timestamp?.toDate().toLocaleString() || "Unknown";

    modalSummary.innerHTML = `
      <div><strong>Book:</strong> ${data.book}</div>
      <div><strong>Chapter:</strong> ${data.chapter}</div>
      <div><strong>Score:</strong> ${data.score} / ${data.total}</div>
      <div><strong>Date:</strong> ${timestamp}</div>
    `;

    modalQuestions.innerHTML = "";
    data.answers.forEach((a) => {
      const correct = a.selected === a.correct;
      const q = document.createElement("div");
      q.className = "question " + (correct ? "correct" : "wrong");
      q.innerHTML = `
        <p><strong>Q${a.number}:</strong> ${a.question}</p>
        <p><strong>Your Answer:</strong> ${a.selected}</p>
        <p><strong>Correct Answer:</strong> ${a.correct}</p>
      `;
      modalQuestions.appendChild(q);
    });

    modal.style.display = "block";
  }
});

closeModal.onclick = () => modal.style.display = "none";
window.onclick = (e) => {
  if (e.target === modal) modal.style.display = "none";
};
