import { auth } from "./firebase-init.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";

export function setupTopbar(pageTitle = "📚 Page") {
  fetch("components/topbar.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("topbar-container").innerHTML = html;

      // Wait for DOM insertion before attaching event listeners
      setTimeout(() => {
        // Set page title
        const titleEl = document.querySelector(".portal-title");
        if (titleEl) titleEl.textContent = pageTitle;

        // Dark mode toggle
        const darkToggle = document.getElementById("dark-mode-toggle");
        if (darkToggle) {
          darkToggle.onclick = () => {
            document.body.classList.toggle("dark");
            localStorage.setItem("darkMode", document.body.classList.contains("dark"));
          };

          if (localStorage.getItem("darkMode") === "true") {
            document.body.classList.add("dark");
          }
        }

        // Dropdown toggle
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

        // Auth handling
        const userEmailDiv = document.getElementById("user-email");
        const logoutBtn = document.getElementById("logout");

        onAuthStateChanged(auth, user => {
          if (!user) {
            window.location.href = "login.html";
          } else {
            if (userEmailDiv) userEmailDiv.textContent = user.email;
            if (logoutBtn) {
              logoutBtn.onclick = () => {
                signOut(auth).then(() => window.location.href = "login.html");
              };
            }
          }
        });

      }, 50);
    });
}
