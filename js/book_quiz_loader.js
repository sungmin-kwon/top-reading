function renderQuizLayout(bookTitle, jsonPath) {
  const container = document.querySelector(".quiz-container");

  container.innerHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
      <a href="../index.html" class="back-button">← Back to Home</a>
      <button id="dark-mode-toggle" aria-label="Toggle dark mode" style="font-size: 1.4em; background: none; border: none; cursor: pointer;">🌙</button>
    </div>

    <h2>${bookTitle}: Interactive Quiz</h2>
    
    <label for="chapter-select">Select Chapter</label>
    <select id="chapter-select">
      <option value="">-- Choose a Chapter --</option>
    </select>

    <div id="chapter-nav" style="margin: 10px 0; display: flex; gap: 10px; justify-content: center;">
      <button id="prev-chapter" disabled>← Previous Chapter</button>
      <button id="next-chapter" disabled>Next Chapter →</button>
    </div>

    <div id="quiz"></div>
  `;

  // Load dark mode toggless
  if (typeof setupDarkMode === "function") {
    setupDarkMode();
  }

  // Load quiz data
  loadFromJSON(jsonPath);
}
