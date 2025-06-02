// Toggle user menu dropdown
const toggleBtn = document.getElementById("user-menu-toggle");
const dropdown = document.getElementById("user-dropdown");

if (toggleBtn && dropdown) {
  toggleBtn.onclick = (e) => {
    e.stopPropagation();
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
  };

  document.addEventListener("click", () => {
    dropdown.style.display = "none";
  });
}

// Load book cards from books.html
const container = document.getElementById("book-container");
if (container) {
  fetch('books.html')
    .then(res => res.text())
    .then(html => {
      container.innerHTML = html;
    })
    .catch(err => {
      console.error('Failed to load book cards:', err);
    });
}
