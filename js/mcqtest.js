import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyARGXx_Xyo6BMuMuDLOriWTISKCB3hbXi0",
  authDomain: "top-reading.firebaseapp.com",
  projectId: "top-reading",
  storageBucket: "top-reading.appspot.com",
  messagingSenderId: "147776736959",
  appId: "1:147776736959:web:150f3a25409ba7f2c1800a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUser = null;
let chapterData = [];

const form = document.getElementById("quiz-form");
const dropdown = document.getElementById("chapter-select");
const submitBtn = document.getElementById("submit-btn");
const scoreOutput = document.getElementById("score-output");

onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    currentUser = user;
  }
});

// Load quiz data and populate dropdown
fetch("../json/mcq_lord_of_the_flies.json")
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
      label.appendChild(input);
      label.appendChild(document.createTextNode(" " + option));
      fieldset.appendChild(label);
      fieldset.appendChild(document.createElement("br"));
    });

    form.appendChild(fieldset);
  });

  submitBtn.onclick = async (e) => {
    e.preventDefault();
    let score = 0;
    const answers = [];

    questions.forEach((q, i) => {
      const selected = document.querySelector(`input[name="q${i}"]:checked`);
      const chosen = selected?.value || "No answer";
      if (chosen === q.answer) score++;
      answers.push({ question: q.question, selected: chosen, correct: q.answer });
    });

    scoreOutput.textContent = `✅ You scored ${score} / ${questions.length}`;

    // Save to Firestore
    if (currentUser) {
      await addDoc(collection(db, "quizSubmissions"), {
        userId: currentUser.uid,
        email: currentUser.email,
        book: "Lord of the Flies",
        chapter: chapter.chapter_number,
        score,
        total: questions.length,
        answers,
        timestamp: serverTimestamp()
      });
    }
  };
}
