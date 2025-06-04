import { auth, db } from "./firebase-init.js";
import {
  collection, addDoc, serverTimestamp,
  query, where, getDocs
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";

let currentUser = null;
let chapterData = [];
let submittedChapters = new Set();

const form = document.getElementById("quiz-form");
const dropdown = document.getElementById("chapter-select");
const submitBtn = document.getElementById("submit-btn");
const scoreOutput = document.getElementById("score-output");
const progress = document.getElementById("progress");

const params = new URLSearchParams(window.location.search);
const bookId = params.get("book");
const bookTitle = params.get("title") || "Untitled Book";

document.title = `${bookTitle} Quiz`;
document.getElementById("quiz-title").textContent = `${bookTitle}: Chapter-by-Chapter Test`;

onAuthStateChanged(auth, user => {
  if (!user) return (window.location.href = "login.html");
  currentUser = user;
  init(); // call main logic
});

async function init() {
  const submissionSnap = await getDocs(query(
    collection(db, "submissions"),
    where("userId", "==", currentUser.uid),
    where("book", "==", bookTitle)
  ));
  submissionSnap.forEach(doc => {
    submittedChapters.add(doc.data().chapter);
  });

  const res = await fetch(`json/${bookId}.json`);
  const data = await res.json();
  chapterData = data.chapters;

  chapterData.forEach(ch => {
    const opt = document.createElement("option");
    opt.value = ch.chapter_number;
    const isSubmitted = submittedChapters.has(ch.chapter_number);

    opt.textContent = `${isSubmitted ? '✅' : '❌'} Chapter ${ch.chapter_number}`;
    dropdown.appendChild(opt);
  });

  const completionEl = document.getElementById("chapter-completion");
  completionEl.textContent = `✅ ${submittedChapters.size} of ${chapterData.length} chapters complete`;

  dropdown.onchange = () => {
    const selected = parseInt(dropdown.value);
    const chapter = chapterData.find(ch => ch.chapter_number === selected);
    renderQuiz(chapter);
  };
}

function renderQuiz(chapter) {
  form.innerHTML = "";
  scoreOutput.textContent = "";
  const alreadySubmitted = submittedChapters.has(chapter.chapter_number);
  submitBtn.disabled = alreadySubmitted;
  submitBtn.style.display = "block";
  submitBtn.textContent = alreadySubmitted ? "Already Submitted" : "Submit Answers";
  submitBtn.classList.toggle("disabled", alreadySubmitted);

  const questions = chapter.multiple_choice;

  function updateProgress() {
    const total = questions.length;
    let answered = 0;

    for (let i = 0; i < total; i++) {
      const box = document.getElementById(`q-box-${i}`);
      const isChecked = document.querySelector(`input[name="q${i}"]:checked`);

      if (isChecked) {
        answered++;
        box.classList.add("answered");

        // Trigger animation only for this box
        box.classList.remove("animate-once");
        void box.offsetWidth; // Force reflow
        box.classList.add("animate-once");
      } else {
        box.classList.remove("answered");
      }
    }

    progressBar.textContent = `Progress: ${answered} of ${total} answered`;
  }

  questions.forEach((q, i) => {
    const fieldset = document.createElement("fieldset");
    const legend = document.createElement("legend");
    legend.textContent = `${i + 1}. ${q.question}`;
    fieldset.appendChild(legend);

    q.options.forEach(option => {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = `q${i}`;
      input.value = option;
      input.disabled = alreadySubmitted;
      input.addEventListener("change", updateProgress);
      label.appendChild(input);
      label.appendChild(document.createTextNode(" " + option));
      fieldset.appendChild(label);
    });

    form.appendChild(fieldset);
    fieldset.appendChild(document.createElement("br"));
  });

  updateProgress();
  addNavigationButtons(chapter.chapter_number);

  if (alreadySubmitted) return;

  submitBtn.onclick = async (e) => {
    e.preventDefault();
    let incomplete = false;
    const answers = [];

    questions.forEach((q, i) => {
      const selected = document.querySelector(`input[name="q${i}"]:checked`);
      if (!selected) incomplete = true;
      answers.push({
        number: q.number ?? i + 1,
        question: q.question,
        selected: selected?.value || "No answer",
        correct: q.answer
      });
    });

    if (incomplete) {
      alert("Please answer all questions before submitting.");
      return;
    }

    let score = answers.filter(a => a.selected === a.correct).length;

    await addDoc(collection(db, "submissions"), {
      userId: currentUser.uid,
      email: currentUser.email,
      book: bookTitle,
      chapter: chapter.chapter_number,
      score,
      total: questions.length,
      answers,
      timestamp: serverTimestamp()
    });

    alert("Answers submitted!");
    location.reload(); // reload to show ✓ and disable button
  };
}

function addNavigationButtons(currentChapter) {
  const navWrapper = document.getElementById("nav-buttons") || document.createElement("div");
  navWrapper.id = "nav-buttons";
  navWrapper.innerHTML = "";

  const prev = chapterData.find(ch => ch.chapter_number === currentChapter - 1);
  const next = chapterData.find(ch => ch.chapter_number === currentChapter + 1);

  if (prev) {
    const prevBtn = document.createElement("button");
    prevBtn.textContent = "← Prev Chapter";
    prevBtn.onclick = () => {
      dropdown.value = prev.chapter_number;
      dropdown.dispatchEvent(new Event("change"));
    };
    navWrapper.appendChild(prevBtn);
  }

  if (next) {
    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next Chapter →";
    nextBtn.onclick = () => {
      dropdown.value = next.chapter_number;
      dropdown.dispatchEvent(new Event("change"));
    };
    navWrapper.appendChild(nextBtn);
  }

  dropdown.parentNode.insertBefore(navWrapper, dropdown.nextSibling);
}

// Dark mode
const toggleDark = document.getElementById("dark-mode-toggle");
if (toggleDark) {
  toggleDark.onclick = () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("darkMode", document.body.classList.contains("dark"));
  };
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
  }
}
