/* ========================================
   IMAGETOOLSHUB
   MAIN JAVASCRIPT
======================================== */

/* ========================================
   SELECT ELEMENTS
======================================== */

const body = document.body;
const themeToggle = document.getElementById("themeToggle");
const menuToggle = document.getElementById("menuToggle");
const navMenu = document.getElementById("navMenu");
const navLinks = document.querySelectorAll(".nav-link");

/* ========================================
   DARK MODE
======================================== */

const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
  body.classList.add("dark-mode");
}

function updateThemeIcon() {
  if (!themeToggle) {
    return;
  }

  const icon = themeToggle.querySelector("i");
  if (!icon) {
    return;
  }

  const isDarkMode = body.classList.contains("dark-mode");

  if (isDarkMode) {
    icon.className = "bx bx-sun";
    themeToggle.setAttribute("aria-label", "Switch to light mode");
  } else {
    icon.className = "bx bx-moon";
    themeToggle.setAttribute("aria-label", "Switch to dark mode");
  }
}

updateThemeIcon();

if (themeToggle) {
  themeToggle.addEventListener("click", function () {
    body.classList.toggle("dark-mode");

    const isDarkMode = body.classList.contains("dark-mode");
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");

    updateThemeIcon();
  });
}

window.addEventListener("storage", function (event) {
  if (event.key === "theme") {
    if (event.newValue === "dark") {
      body.classList.add("dark-mode");
    } else {
      body.classList.remove("dark-mode");
    }
    updateThemeIcon();
  }
});

/* ========================================
   MOBILE NAVIGATION
======================================== */

function closeMobileMenu() {
  if (!navMenu) {
    return;
  }

  navMenu.classList.remove("active");
  updateMenuIcon();
}

function updateMenuIcon() {
  if (!menuToggle) {
    return;
  }

  const icon = menuToggle.querySelector("i");
  if (!icon) {
    return;
  }

  if (!navMenu) {
    icon.className = "bx bx-menu";
    menuToggle.setAttribute("aria-label", "Open navigation menu");
    return;
  }

  const isMenuOpen = navMenu.classList.contains("active");

  if (isMenuOpen) {
    icon.className = "bx bx-x";
    menuToggle.setAttribute("aria-label", "Close navigation menu");
  } else {
    icon.className = "bx bx-menu";
    menuToggle.setAttribute("aria-label", "Open navigation menu");
  }
}

if (menuToggle && navMenu) {
  menuToggle.addEventListener("click", function (event) {
    event.stopPropagation();
    navMenu.classList.toggle("active");
    updateMenuIcon();
  });
}

navLinks.forEach(function (link) {
  link.addEventListener("click", function () {
    closeMobileMenu();
  });
});

document.addEventListener("keydown", function (event) {
  if (
    event.key === "Escape" &&
    navMenu &&
    navMenu.classList.contains("active")
  ) {
    closeMobileMenu();
  }
});

document.addEventListener("click", function (event) {
  if (!navMenu) {
    return;
  }

  const isMenuOpen = navMenu.classList.contains("active");
  if (!isMenuOpen) {
    return;
  }

  const isInsideNavbar = event.target.closest(".navbar");
  if (!isInsideNavbar) {
    closeMobileMenu();
  }
});

window.addEventListener("resize", function () {
  if (
    window.innerWidth > 768 &&
    navMenu &&
    navMenu.classList.contains("active")
  ) {
    closeMobileMenu();
  }
});

updateMenuIcon();

/* ========================================
   CONSOLE MESSAGE
======================================== */

console.log("ImageToolsHub is running successfully!");
