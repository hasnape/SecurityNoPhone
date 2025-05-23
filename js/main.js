function switchLanguage() {
  const lang = localStorage.getItem('lang') || 'fr';
  const translations = window.translations && window.translations[lang];
  if (!translations) return;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key && translations[key] !== undefined) {
      el.innerHTML = translations[key];
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const selector = document.getElementById('langSwitcher');
  const userLang = navigator.language.slice(0, 2);
  const available = Object.keys(window.translations || {});
  const fallback = 'en';
  const initialLang = available.includes(userLang) ? userLang : fallback;

  const savedLang = localStorage.getItem('lang') || initialLang;
  localStorage.setItem('lang', savedLang);

  if (selector) {
    selector.value = savedLang;
    selector.addEventListener('change', () => {
      localStorage.setItem('lang', selector.value);
      switchLanguage();
    });
  }

  switchLanguage();
});