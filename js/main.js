// Fonction globale pour changer la langue
function switchLanguage(lang) {
  const currentLang = lang || localStorage.getItem('lang') || 'fr';
  document.documentElement.lang = currentLang; // Mettre à jour l'attribut lang de la balise HTML

  const translations = window.translations ?. [currentLang];
  if (!translations) {
    console.warn(`No translations found for language: ${currentLang}`);
    return;
  }

  // Traduire les éléments avec data-i18n (y compris la balise <title> si elle a data-i18n)
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key && translations[key] !== undefined) { // Vérifier que la clé existe dans les traductions
      el.innerHTML = translations[key];
    } else if (key) {
      // console.warn(`Translation key "${key}" not found for language "${currentLang}" in element:`, el);
    }
  });

  // Traduire les placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key && translations[key] !== undefined) {
      el.setAttribute('placeholder', translations[key]);
    } else if (key) {
      // console.warn(`Placeholder key "${key}" not found for language "${currentLang}" in element:`, el);
    }
  });

  // Traduire les attributs title (pour les tooltips par exemple)
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (key && translations[key] !== undefined) {
      el.setAttribute('title', translations[key]);
    } else if (key) {
      // console.warn(`Title key "${key}" not found for language "${currentLang}" in element:`, el);
    }
  });

  // La logique spécifique pour "order_tracking_title" n'est plus nécessaire si
  // la balise <title> a un attribut data-i18n (par exemple <title data-i18n="page_title_tracking">...</title>)
  // Elle sera gérée par la boucle querySelectorAll('[data-i18n]') ci-dessus.
  // Exemple: if (document.querySelector('title[data-i18n]')) { /* déjà géré */ }

  // Mise à jour spécifique pour le bandeau de cookies si présent et si les clés existent
  const cookieBanner = document.getElementById("cookie-banner");
  if (cookieBanner) {
    const messageEl = cookieBanner.querySelector("span[data-i18n='cookie_message']");
    const btnEl = cookieBanner.querySelector("button[data-i18n='cookie_button_ok']"); // Assumant que le bouton a aussi un data-i18n
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
}

// Fonction pour accepter les cookies
function acceptCookies() {
  localStorage.setItem("cookiesAccepted", "true");
  const banner = document.getElementById("cookie-banner");
  if (banner) {
    banner.style.display = "none";
  }
}

// Fonction pour gérer l'affichage initial du bandeau de cookies
function handleCookieBanner() {
  const accepted = localStorage.getItem("cookiesAccepted");
  const banner = document.getElementById("cookie-banner"); // S'assurer qu'il est chargé
  if (banner) { // Vérifier si le bandeau existe dans le DOM
    if (accepted === "true") {
      banner.style.display = "none";
    } else {
      banner.style.display = "block"; // S'assurer qu'il est visible s'il n'est pas accepté
    }
  }
}

// Fonction pour charger la barre de navigation
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

      const lang = localStorage.getItem("lang") || "fr"; // Récupérer la langue après l'injection

      // Initialise le sélecteur de langue après l'injection du HTML de la navbar
      const langSelect = document.getElementById("langSwitcher");
      if (langSelect) {
        langSelect.value = lang;
        langSelect.addEventListener("change", e => {
          const selectedLang = e.target.value;
          localStorage.setItem("lang", selectedLang);
          switchLanguage(selectedLang); // Appel de la fonction globale switchLanguage
        });
      } else {
        // console.warn("Language switcher (langSwitcher) not found in loaded navbar.");
      }

      // Appliquer la langue à la navbar fraîchement chargée et au reste de la page si ce n'est pas déjà fait
      // switchLanguage(lang); // Normalement, l'appel global à la fin de DOMContentLoaded s'en charge
      // Mais un rappel ici peut être utile si loadNavbar est appelé tardivement.
      // Cependant, pour éviter des appels multiples, on s'assure qu'il est appelé après que TOUT est prêt.
    })
    .catch(error => console.error("Error loading navbar:", error));
}

// Fonction pour charger le pied de page
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
        // Fallback si aucun conteneur spécifique n'est trouvé, pour éviter une erreur
        // Mais il est préférable d'avoir un conteneur défini.
        const bodyEnd = document.body; // Insérer avant la fin du body
        if (bodyEnd) bodyEnd.insertAdjacentHTML('beforeend', html);
        console.warn("Footer container not found, appended to body. Consider adding a #footer-container div.");
      }
      handleCookieBanner(); // Gérer l'affichage du bandeau de cookies après l'avoir chargé
      // switchLanguage(); // L'appel global à la fin de DOMContentLoaded s'en charge normalement.
      // Si le footer a beaucoup de texte i18n, cet appel peut être nécessaire.
    })
    .catch(error => console.error("Error loading footer:", error));
}

// Événement lorsque le DOM est entièrement chargé
document.addEventListener("DOMContentLoaded", () => {
  const availableLangs = ["fr", "en", "de", "ar"];

  // Auto-détection de la langue du navigateur une seule fois si aucune langue n'est sauvegardée
  if (!localStorage.getItem("lang")) {
    const browserLang = navigator.language.slice(0, 2).toLowerCase();
    const detectedLang = availableLangs.includes(browserLang) ? browserLang : "fr"; // 'fr' par défaut
    localStorage.setItem("lang", detectedLang);
  }

  const currentLang = localStorage.getItem("lang") || 'fr'; // S'assurer d'avoir une langue

  // Charger les composants dynamiques
  // Ces fonctions vont insérer le HTML. switchLanguage sera appelé après pour traduire.
  loadNavbar();
  loadFooter();

  // Appliquer la langue à toute la page une fois que tout est potentiellement chargé.
  // Il peut y avoir un léger décalage si fetch prend du temps.
  // Une approche plus robuste pourrait être que loadNavbar/loadFooter retournent des promesses
  // et switchLanguage est appelé après Promise.all([loadNavbar(), loadFooter()]).
  // Pour l'instant, cet appel tardif et celui dans loadNavbar devraient couvrir la plupart des cas.

  // Mettre à jour l'attribut lang de la balise HTML dès que possible.
  document.documentElement.lang = currentLang;

  // Appeler switchLanguage une fois que le DOM est prêt et que la langue initiale est définie.
  // Cet appel traduira le contenu statique initial et les éléments chargés par les includes
  // si les includes sont déjà terminés.
  switchLanguage(currentLang);


  // Si les includes prennent du temps, et que switchLanguage est appelé avant qu'ils ne soient complets,
  // le contenu injecté ne sera pas traduit.
  // Pour pallier cela, on pourrait faire en sorte que loadNavbar et loadFooter appellent switchLanguage
  // une fois leur contenu injecté.
  // Modification : loadNavbar appelle déjà switchLanguage. loadFooter devrait aussi le faire pour être sûr.
  // Assurons-nous que l'appel dans loadFooter est correct :

  // Correction dans loadFooter pour appeler switchLanguage (la version globale) :
  // (Déjà présent dans votre code d'origine pour loadFooter, juste vérifier qu'il utilise la bonne fonction)
  // function loadFooter() { ... then(html => { ... handleCookieBanner(); switchLanguage(); }); }
  // La fonction switchLanguage() dans loadFooter doit être l'appel à la fonction globale.
});

// Pour s'assurer que switchLanguage est appelé après le chargement de la navbar et du footer.
// Cette approche est plus robuste que des appels séparés.
async function initializePage() {
  const availableLangs = ["fr", "en", "de", "ar"];
  if (!localStorage.getItem("lang")) {
    const browserLang = navigator.language.slice(0, 2).toLowerCase();
    const detectedLang = availableLangs.includes(browserLang) ? browserLang : "fr";
    localStorage.setItem("lang", detectedLang);
  }
  const currentLang = localStorage.getItem("lang") || 'fr';
  document.documentElement.lang = currentLang;

  // Utiliser des promesses pour s'assurer que les chargements sont finis
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
          langSelect.value = currentLang; // Utiliser currentLang déterminé au début
          langSelect.addEventListener("change", e => {
            const selectedLang = e.target.value;
            localStorage.setItem("lang", selectedLang);
            switchLanguage(selectedLang); // Appel direct
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
        handleCookieBanner(); // Doit être appelé après que le footer est dans le DOM
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
    // Peut-être afficher un message d'erreur à l'utilisateur sur la page
  } finally {
    // Une fois que tout est chargé (ou a échoué), appliquer les traductions
    switchLanguage(currentLang);
  }
}

// Remplacer l'ancien écouteur DOMContentLoaded par l'appel à la nouvelle fonction d'initialisation
document.addEventListener("DOMContentLoaded", initializePage);

document.addEventListener('DOMContentLoaded', () => {
  // ... (autres initialisations et fonctions) ...

  // Fonction pour gérer le menu burger (animation de l'icône)
  function setupBurgerMenuAnimation() {
    const burgerBtn = document.querySelector('.navbar-toggler'); // C'est le bouton Bootstrap maintenant
    const navbarCollapse = document.getElementById('navbarNav');

    if (burgerBtn && navbarCollapse) {
      // Écouter l'événement 'show.bs.collapse' et 'hide.bs.collapse' de Bootstrap
      navbarCollapse.addEventListener('show.bs.collapse', () => {
        burgerBtn.classList.add('is-active'); // Ajoute la classe pour l'animation "croix"
      });

      navbarCollapse.addEventListener('hide.bs.collapse', () => {
        burgerBtn.classList.remove('is-active'); // Retire la classe pour revenir à l'icône "burger"
      });
    }
  }

  // Appeler la fonction d'initialisation du burger menu
  setupBurgerMenuAnimation();

  // ... (reste du code main.js) ...
});