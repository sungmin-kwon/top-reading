let quizData = null;

function loadFromJSON(jsonPath) {
  fetch(jsonPath)
    .then(res => res.json())
    .then(data => {
      quizData = data;
      populateDropdown();
    })
    .catch(err => {
      document.getElementById('quiz').innerHTML = "<p style='color:red;'>Failed to load quiz data.</p>";
      console.error("Error loading quiz data:", err);
    });
}

function populateDropdown() {
  const select = document.getElementById("chapter-select");
  quizData.chapters.forEach((chapter, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = `Chapter ${chapter.chapter_number}: ${chapter.chapter_title}`;
    select.appendChild(option);
  });

  select.addEventListener('change', loadChapter);
}

function loadChapter() {
  const selectedIndex = document.getElementById("chapter-select").value;
  const quizContainer = document.getElementById("quiz");
  quizContainer.innerHTML = "";

  if (selectedIndex === "") return;

  const chapter = quizData.chapters[selectedIndex];
  const questions = chapter.multiple_choice || [];

  if (questions.length === 0) {
    quizContainer.innerHTML = "<p>No multiple-choice questions available for this chapter.</p>";
    return;
  }

  questions.forEach((q, index) => {
    const questionDiv = document.createElement("div");
    questionDiv.className = "question";
    questionDiv.innerHTML = `
      <h3>${index + 1}. ${q.question}</h3>
      ${q.options.map(opt => `
        <label>
          <input type="radio" name="q${index}" value="${opt}">
          ${opt}
        </label>
      `).join("")}
      <button class="check-btn" onclick="checkAnswer(this, '${q.answer.replace(/'/g, "\\'")}')">Check Answer</button>
      <div class="mcq-feedback"></div>
    `;
    quizContainer.appendChild(questionDiv);
  });
}

function checkAnswer(button, correctAnswer) {
  const container = button.closest(".question");
  const selected = container.querySelector("input[type='radio']:checked");
  const feedback = container.querySelector(".mcq-feedback");

  if (!selected) {
    feedback.textContent = "⚠️ Please select an answer.";
    feedback.style.color = "orange";
    return;
  }

  if (selected.value === correctAnswer) {
    feedback.textContent = "✅ Correct!";
    feedback.style.color = "green";
  } else {
    feedback.textContent = `❌ Incorrect. The correct answer is "${correctAnswer}"`;
    feedback.style.color = "red";
  }
}
