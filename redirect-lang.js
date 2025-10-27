(function () {
    const defaultPage = location.pathname.endsWith("index.html") || location.pathname === "/";
    const alreadyRedirected = sessionStorage.getItem("langRedirected");

    if (defaultPage && !alreadyRedirected) {
        const lang = navigator.language.slice(0, 2).toLowerCase();
        const supported = {
            fr: "https://www.securitynophone.com/index.html",
            en: "https://www.securitynophone.com/en/index.html",
            ar: "https://www.securitynophone.com/ar/index.html",
        };

        if (supported[lang]) {
            sessionStorage.setItem("langRedirected", "true");
            location.href = supported[lang];
        }
    }
})();
  