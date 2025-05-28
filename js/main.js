function switchLanguage(lang) {
  const currentLang = lang || localStorage.getItem('lang') || 'fr';
  const translations = window.translations ?. [currentLang];
  if (!translations) return;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key && translations[key]) {
      el.innerHTML = translations[key];
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key && translations[key]) {
      el.setAttribute('placeholder', translations[key]);
    }
  });

  if (translations["order_tracking_title"]) {
    document.title = translations["order_tracking_title"];
  }

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

function acceptCookies() {
  localStorage.setItem("cookiesAccepted", "true");
  const banner = document.getElementById("cookie-banner");
  if (banner) banner.style.display = "none";
}

function handleCookieBanner() {
  const accepted = localStorage.getItem("cookiesAccepted");
  const banner = document.getElementById("cookie-banner");
  if (banner && accepted === "true") {
    banner.style.display = "none";
  }
}

function loadNavbar() {
  fetch("includes/navbar.html")
    .then(res => res.text())
    .then(html => {
      const navContainer = document.getElementById("navbar-container") || document.getElementById("navbar-placeholder");
      if (!navContainer) return;

      navContainer.innerHTML = html;

      const lang = localStorage.getItem("lang") || "fr";

      // Initialise le sélecteur après l'injection
      const langSelect = document.getElementById("langSwitcher");
      if (langSelect) {
        langSelect.value = lang;
        langSelect.addEventListener("change", e => {
          const selectedLang = e.target.value;
          localStorage.setItem("lang", selectedLang);
          switchLanguage(selectedLang);
        });
      }

      switchLanguage(lang); // Appliquer immédiatement la langue actuelle
    });
}


function loadFooter() {
  fetch("includes/footer.html")
    .then(res => res.text())
    .then(html => {
      const footerContainer = document.getElementById("footer-container");
      if (footerContainer) {
        footerContainer.innerHTML = html;
      } else {
        document.body.insertAdjacentHTML('beforeend', html);
      }
      handleCookieBanner();
      switchLanguage();
    });
}

document.addEventListener("DOMContentLoaded", () => {
  const availableLangs = ["fr", "en", "de", "ar"];

  // Auto-détection de langue une seule fois
  if (!localStorage.getItem("lang")) {
    const browserLang = navigator.language.slice(0, 2).toLowerCase();
    const detectedLang = availableLangs.includes(browserLang) ? browserLang : "fr";
    localStorage.setItem("lang", detectedLang);
  }

  const userLang = localStorage.getItem("lang");
  loadNavbar();
  loadFooter();
  switchLanguage(userLang);
});
