function updateToggleIcon(isDark) {
  const toggle = document.getElementById("dark-mode-toggle");
  if (toggle) toggle.textContent = isDark ? "☀️" : "🌙";
}

function toggleDarkMode() {
  const isDark = document.body.classList.toggle("dark-mode");
  localStorage.setItem("darkMode", isDark);
  updateToggleIcon(isDark);
}

function initializeDarkModeToggle() {
  const toggle = document.getElementById("dark-mode-toggle");
  const isDark = localStorage.getItem("darkMode") === "true";
  if (isDark) document.body.classList.add("dark-mode");
  updateToggleIcon(isDark);
  if (toggle) toggle.addEventListener("click", toggleDarkMode);
}

// Call from pages that load topbar dynamically
export function setupThemeToggleAfterTopbar() {
  const observer = new MutationObserver((mutations, obs) => {
    const toggle = document.getElementById("dark-mode-toggle");
    if (toggle) {
      initializeDarkModeToggle();
      obs.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// If topbar is already present on initial load
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("dark-mode-toggle")) {
    initializeDarkModeToggle();
  }
});
