// Initialisation des animations AOS
AOS.init();

// Fonction de traduction
function switchLanguage() {
  const translations = window.translations;
  const lang = document.getElementById('langSwitcher') ?.value || 'fr';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key && translations[lang] && typeof translations[lang][key] !== 'undefined') {
      el.innerHTML = translations[lang][key];
    } else {
      console.warn(`Clé introuvable ou invalide : [${lang}][${key}]`);
    }
  });
  localStorage.setItem('lang', lang);
}

// Appliquer la langue au chargement
window.addEventListener('DOMContentLoaded', () => {
  const savedLang = localStorage.getItem('lang') || 'fr';
  const langSwitcher = document.getElementById('langSwitcher');
  if (langSwitcher) {
    langSwitcher.value = savedLang;
    langSwitcher.addEventListener('change', switchLanguage);
  }
  switchLanguage();
});
