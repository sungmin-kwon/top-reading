let quizData = null;
let currentChapterIndex = -1;

function loadFromJSON(jsonPath) {
  fetch(jsonPath)
    .then(res => res.json())
    .then(data => {
      quizData = data;
      populateDropdown();
      setupNavButtons();
    })
    .catch(err => {
      document.getElementById('quiz').innerHTML = "<p style='color:red;'>Failed to load quiz data.</p>";
      console.error("Error loading quiz data:", err);
    });
}

function populateDropdown() {
  const select = document.getElementById("chapter-select");
  select.innerHTML = '<option value="">-- Choose a Chapter --</option>';

  quizData.chapters.forEach((chapter, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = `Chapter ${chapter.chapter_number}: ${chapter.chapter_title}`;
    select.appendChild(option);
  });

  select.addEventListener('change', () => {
    currentChapterIndex = parseInt(select.value);
    renderChapter(currentChapterIndex);
    updateNavButtons();
  });
}

function setupNavButtons() {
  const prevBtn = document.getElementById("prev-chapter");
  const nextBtn = document.getElementById("next-chapter");

  if (!prevBtn || !nextBtn) return;

  prevBtn.addEventListener("click", () => {
    if (currentChapterIndex > 0) {
      currentChapterIndex--;
      document.getElementById("chapter-select").value = currentChapterIndex;
      renderChapter(currentChapterIndex);
      updateNavButtons();
    }
  });

  nextBtn.addEventListener("click", () => {
    if (currentChapterIndex < quizData.chapters.length - 1) {
      currentChapterIndex++;
      document.getElementById("chapter-select").value = currentChapterIndex;
      renderChapter(currentChapterIndex);
      updateNavButtons();
    }
  });
}

function updateNavButtons() {
  const prevBtn = document.getElementById("prev-chapter");
  const nextBtn = document.getElementById("next-chapter");

  if (!prevBtn || !nextBtn) return;

  prevBtn.disabled = currentChapterIndex <= 0;
  nextBtn.disabled = currentChapterIndex >= quizData.chapters.length - 1;
}

function renderChapter(index) {
  const chapter = quizData.chapters[index];
  const quizContainer = document.getElementById("quiz");
  quizContainer.innerHTML = "";

  if (!chapter || !chapter.multiple_choice || chapter.multiple_choice.length === 0) {
    quizContainer.innerHTML = "<p>No multiple-choice questions available for this chapter.</p>";
    return;
  }

  chapter.multiple_choice.forEach((q, i) => {
    const questionDiv = document.createElement("div");
    questionDiv.className = "question";
    questionDiv.innerHTML = `
      <h3>${i + 1}. ${q.question}</h3>
      ${q.options.map(opt => `
        <label>
          <input type="radio" name="q${i}" value="${opt}">
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
