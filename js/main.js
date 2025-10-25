function switchLanguage(lang) {
  const currentLang = lang || localStorage.getItem('lang') || 'fr';
  document.documentElement.lang = currentLang;
  const translations = window.translations ? window.translations[currentLang] : null;
  if (!translations) {
    console.warn(`No translations found for language: ${currentLang}`);
    return;
  }

  // Fade out elements before updating
  document.querySelectorAll('[data-i18n], [data-i18n-placeholder], [data-i18n-title]').forEach(el => {
    el.classList.add('fade-out');
  });

  setTimeout(() => {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key && translations[key] !== undefined) {
        el.innerHTML = translations[key];
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key && translations[key] !== undefined) {
        el.setAttribute('placeholder', translations[key]);
      }
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (key && translations[key] !== undefined) {
        el.setAttribute('title', translations[key]);
      }
    });

    // Fade in elements
    document.querySelectorAll('[data-i18n], [data-i18n-placeholder], [data-i18n-title]').forEach(el => {
      el.classList.remove('fade-out');
    });

    const cookieBanner = document.getElementById("cookie-banner");
    if (cookieBanner) {
      const messageEl = cookieBanner.querySelector("span[data-i18n='cookie_message']");
      const btnEl = cookieBanner.querySelector("button[data-i18n='cookie_button_ok']");
      const linkEl = cookieBanner.querySelector("a[data-i18n='cookie_more_info']");
      if (messageEl && translations["cookie_message"] !== undefined) {
        messageEl.textContent = translations["cookie_message"];
      }
      if (btnEl && translations["cookie_button_ok"] !== undefined) {
        btnEl.textContent = translations["cookie_button_ok"];
      }
      if (linkEl && translations["cookie_more_info"] !== undefined) {
        linkEl.textContent = translations["cookie_more_info"];
      }
    }
  }, 300);
}

function acceptCookies() {
  localStorage.setItem("cookiesAccepted", "true");
  const banner = document.getElementById("cookie-banner");
  if (banner) {
    banner.style.display = "none";
  }
}

function handleCookieBanner() {
  const accepted = localStorage.getItem("cookiesAccepted");
  const banner = document.getElementById("cookie-banner");
  if (banner) {
    if (accepted === "true") {
      banner.style.display = "none";
    } else {
      banner.style.display = "block";
    }
  }
}

function setupSmoothScroll() {
  document.querySelectorAll('[data-scroll-target]').forEach(link => {
    if (link.dataset.smoothScrollBound === 'true') {
      return;
    }

    link.addEventListener('click', event => {
      const targetSelector = link.getAttribute('data-scroll-target');
      if (!targetSelector) {
        return;
      }

      const targetElement = document.querySelector(targetSelector);
      if (!targetElement) {
        return;
      }

      event.preventDefault();
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

      if (typeof history.replaceState === 'function') {
        history.replaceState(null, '', targetSelector);
      } else {
        window.location.hash = targetSelector;
      }
    });

    link.dataset.smoothScrollBound = 'true';
  });
}

function loadNavbar() {
  fetch("includes/navbar.html")
    .then(res => {
      if (!res.ok) {
        throw new Error(`Failed to load navbar.html: ${res.status} ${res.statusText}`);
      }
      return res.text();
    })
    .then(html => {
      const navContainer = document.getElementById("navbar-container") || document.getElementById("navbar-placeholder");
      if (!navContainer) {
        console.warn("Navbar container not found.");
        return;
      }
      navContainer.innerHTML = html;
      const lang = localStorage.getItem("lang") || "fr";
      const langSelect = document.getElementById("langSwitcher");
      if (langSelect) {
        langSelect.value = lang;
        langSelect.addEventListener("change", e => {
          const selectedLang = e.target.value;
          localStorage.setItem("lang", selectedLang);
          switchLanguage(selectedLang);
        });
      }
      setupSmoothScroll();
    })
    .catch(error => console.error("Error loading navbar:", error));
}

function loadFooter() {
  fetch("includes/footer.html")
    .then(res => {
      if (!res.ok) {
        throw new Error(`Failed to load footer.html: ${res.status} ${res.statusText}`);
      }
      return res.text();
    })
    .then(html => {
      const footerContainer = document.getElementById("footer-container") || document.getElementById("footer-placeholder");
      if (footerContainer) {
        footerContainer.innerHTML = html;
      } else {
        const bodyEnd = document.body;
        if (bodyEnd) bodyEnd.insertAdjacentHTML('beforeend', html);
        console.warn("Footer container not found, appended to body.");
      }
      handleCookieBanner();
      switchLanguage(localStorage.getItem("lang") || "fr");
    })
    .catch(error => console.error("Error loading footer:", error));
}

async function initializePage() {
  const availableLangs = ["fr", "en", "de", "ar"];
  if (!localStorage.getItem("lang")) {
    const browserLang = navigator.language.slice(0, 2).toLowerCase();
    const detectedLang = availableLangs.includes(browserLang) ? browserLang : "fr";
    localStorage.setItem("lang", detectedLang);
  }
  const currentLang = localStorage.getItem("lang") || 'fr';
  document.documentElement.lang = currentLang;

  const navbarPromise = new Promise((resolve, reject) => {
    fetch("includes/navbar.html")
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load navbar.html: ${res.status}`);
        return res.text();
      })
      .then(html => {
        const navContainer = document.getElementById("navbar-container") || document.getElementById("navbar-placeholder");
        if (navContainer) navContainer.innerHTML = html;
        else console.warn("Navbar container not found.");
        const langSelect = document.getElementById("langSwitcher");
        if (langSelect) {
          langSelect.value = currentLang;
          langSelect.addEventListener("change", e => {
            const selectedLang = e.target.value;
            localStorage.setItem("lang", selectedLang);
            switchLanguage(selectedLang);
          });
        }
        resolve();
      })
      .catch(error => {
        console.error("Error loading navbar:", error);
        reject(error);
      });
  });

  const footerPromise = new Promise((resolve, reject) => {
    fetch("includes/footer.html")
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load footer.html: ${res.status}`);
        return res.text();
      })
      .then(html => {
        const footerContainer = document.getElementById("footer-container") || document.getElementById("footer-placeholder");
        if (footerContainer) footerContainer.innerHTML = html;
        else {
          const bodyEnd = document.body;
          if (bodyEnd) bodyEnd.insertAdjacentHTML('beforeend', html);
          console.warn("Footer container not found, appended to body.");
        }
        handleCookieBanner();
        resolve();
      })
      .catch(error => {
        console.error("Error loading footer:", error);
        reject(error);
      });
  });

  try {
    await Promise.all([navbarPromise, footerPromise]);
  } catch (error) {
    console.error("Error initializing page components:", error);
  } finally {
    switchLanguage(currentLang);
    setupSmoothScroll();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initializePage();
  const burgerBtn = document.querySelector('.navbar-toggler');
  const navbarCollapse = document.getElementById('navbarNav');
  if (burgerBtn && navbarCollapse) {
    navbarCollapse.addEventListener('show.bs.collapse', () => {
      burgerBtn.classList.add('is-active');
    });
    navbarCollapse.addEventListener('hide.bs.collapse', () => {
      burgerBtn.classList.remove('is-active');
    });
  }
});
