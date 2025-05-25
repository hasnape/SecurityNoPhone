function switchLanguage(lang) {
  const currentLang = lang || localStorage.getItem('lang') || 'fr';
  const translations = window.translations ?. [currentLang];
  if (!translations) return;

  // Texte HTML
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key && translations[key]) {
      el.innerHTML = translations[key];
    }
  });

  // Attributs (ex: placeholder)
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key && translations[key]) {
      el.setAttribute('placeholder', translations[key]);
    }
  });

  // Titre du document
  if (translations["order_tracking_title"]) {
    document.title = translations["order_tracking_title"];
  }

  // Traduction bannière cookies
  const cookieBanner = document.getElementById("cookie-banner");
  if (cookieBanner) {
    const message = translations["cookie_message"];
    const btnText = translations["cookie_button_ok"];
    const linkText = translations["cookie_more_info"];

    if (message) cookieBanner.querySelector("span[data-i18n='cookie_message']").textContent = message;
    if (btnText) cookieBanner.querySelector("button").textContent = btnText;
    if (linkText) cookieBanner.querySelector("a").textContent = linkText;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const availableLangs = ["fr", "en", "de", "ar"];
  const langSelect = document.getElementById("langSwitcher");

  // Détection initiale de langue
  if (!localStorage.getItem("lang")) {
    const browserLang = navigator.language.slice(0, 2).toLowerCase();
    const detectedLang = availableLangs.includes(browserLang) ? browserLang : "fr";
    localStorage.setItem("lang", detectedLang);
  }

  const userLang = localStorage.getItem("lang");

  if (langSelect) {
    langSelect.value = userLang;
    langSelect.addEventListener("change", e => {
      const selectedLang = e.target.value;
      localStorage.setItem("lang", selectedLang);
      switchLanguage(selectedLang);
    });
  }

  switchLanguage(userLang);
});

document.addEventListener("DOMContentLoaded", () => {
  // Injecter la navbar
  fetch("includes/navbar.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("navbar-container").innerHTML = html;
      switchLanguage(); // Appliquer la traduction après injection
    });

  // Injecter le footer
  fetch("includes/footer.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("footer-container").innerHTML = html;
    });
});
// Injecte navbar
fetch("includes/navbar.html")
  .then(res => res.text())
  .then(html => {
    const navContainer = document.getElementById("navbar-container");
    if (navContainer) {
      navContainer.innerHTML = html;
      if (typeof switchLanguage === "function") switchLanguage();
    }
  });

// Injecte footer
fetch("includes/footer.html")
  .then(res => res.text())
  .then(html => {
    const footerContainer = document.getElementById("footer-container");
    if (footerContainer) {
      footerContainer.innerHTML = html;
    }
  });
