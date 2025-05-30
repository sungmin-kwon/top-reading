function updateToggleIcon(isDark) {
  const toggle = document.getElementById("dark-mode-toggle");
  if (toggle) toggle.textContent = isDark ? "☀️" : "🌙";
}

function toggleDarkMode() {
  const isDark = document.body.classList.toggle("dark-mode");
  localStorage.setItem("darkMode", isDark);
  updateToggleIcon(isDark);
}

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("dark-mode-toggle");
  const isDark = localStorage.getItem("darkMode") === "true";
  if (isDark) document.body.classList.add("dark-mode");
  updateToggleIcon(isDark);
  if (toggle) toggle.addEventListener("click", toggleDarkMode);
});
