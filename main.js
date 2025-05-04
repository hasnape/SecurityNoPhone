// Initialisation des animations AOS
AOS.init();

// Changement de langue dynamique
function switchLanguage() {
  const translations = window.translations;
  const lang = document.getElementById('langSwitcher').value;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      el.innerHTML = translations[lang][key];
    }
  });
}

// Appliquer la langue au chargement
window.addEventListener('DOMContentLoaded', switchLanguage);
