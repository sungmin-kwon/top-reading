import { auth, db } from "./firebase-init.js";
import { collection, addDoc, serverTimestamp, query, where, getDocs} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";

let currentUser = null;
let chapterData = [];

const form = document.getElementById("quiz-form");
const dropdown = document.getElementById("chapter-select");
const submitBtn = document.getElementById("submit-btn");
const scoreOutput = document.getElementById("score-output");
const progress = document.getElementById("progress");

onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    currentUser = user;
  }
});

const params = new URLSearchParams(window.location.search);
const bookId = params.get("book");
const bookTitle = params.get("title") || "Untitled Book";

document.title = `${bookTitle} Quiz`;
document.getElementById("quiz-title").textContent = `${bookTitle}: Chapter-by-Chapter Test`;

fetch(`json/${bookId}.json`)
  .then(res => res.json())
  .then(data => {
    chapterData = data.chapters;

    chapterData.forEach(ch => {
      const opt = document.createElement("option");
      opt.value = ch.chapter_number;
      opt.textContent = `Chapter ${ch.chapter_number}`;
      dropdown.appendChild(opt);
    });

    dropdown.onchange = () => {
      const selected = parseInt(dropdown.value);
      const chapter = chapterData.find(ch => ch.chapter_number === selected);
      renderQuiz(chapter);
    };
  });

function renderQuiz(chapter) {
  form.innerHTML = "";
  scoreOutput.textContent = "";
  submitBtn.style.display = "block";

  const questions = chapter.multiple_choice;

  function updateProgress() {
    const total = questions.length;
    let answered = 0;
    for (let i = 0; i < total; i++) {
      if (document.querySelector(`input[name="q${i}"]:checked`)) {
        answered++;
      }
    }
    if (progress) progress.textContent = `Progress: ${answered} of ${total} answered`;
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
      input.addEventListener("change", updateProgress);

      label.appendChild(input);
      label.appendChild(document.createTextNode(" " + option));
      fieldset.appendChild(label);
    });

    form.appendChild(fieldset);
    fieldset.appendChild(document.createElement("br"));
  });

  updateProgress();

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

    const qSnap = query(
      collection(db, "submissions"),
      where("userId", "==", currentUser.uid),
      where("book", "==", bookTitle),
      where("chapter", "==", chapter.chapter_number)
    );

    const snap = await getDocs(qSnap);
    if (!snap.empty) {
      alert("You have already submitted answers for this chapter.");
      return;
    }

    let score = 0;
    answers.forEach(a => {
      if (a.selected === a.correct) score++;
    });

    const modal = document.getElementById("result-modal");
    const modalContent = document.getElementById("result-content");
    const closeModal = document.getElementById("close-modal");

    modalContent.innerHTML = `<strong>✅ You answered ${score} / ${questions.length} questions correctly.</strong><br><br>`;

    answers.forEach(a => {
      const isCorrect = a.selected === a.correct;
      modalContent.innerHTML += `
        <p>
          <strong>Q${a.number}:</strong> ${a.question}<br>
          <span style="color: ${isCorrect ? 'green' : 'red'};">
            Your Answer: ${a.selected} ${isCorrect ? '✓' : '✗'}
          </span><br>
          ${!isCorrect ? `Correct Answer: ${a.correct}<br>` : ""}
        </p><hr>`;
    });

    modal.style.display = "block";

    closeModal.onclick = () => modal.style.display = "none";
    window.onclick = e => {
      if (e.target === modal) modal.style.display = "none";
    };

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
  };
}

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
