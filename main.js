function switchLanguage() {
  const translations = {
    fr: { /* ...French keys...*/ },
    en: { /* ...English keys...*/ },
    de: { /* ...German keys...*/ }
  };
  const lang = document.getElementById('langSwitcher').value;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if(translations[lang][key]) el.innerHTML = translations[lang][key];
  });
}
window.addEventListener('DOMContentLoaded', switchLanguage);