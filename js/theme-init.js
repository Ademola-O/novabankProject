// Runs in the <head> BEFORE the page is drawn, so there is no flash of the wrong theme.
// It is a plain script (not a module) because modules wait until the page has loaded.
// The toggle button itself lives in theme.js.
(function () {
    var theme = null;

    // 1. Use the theme the visitor chose last time, if any
    try {
        var saved = localStorage.getItem("novabank:theme");
        if (saved === "light" || saved === "dark") {
            theme = saved;
        }
    } catch (error) {
        // Storage can be blocked (private browsing, strict settings). Carry on.
    }

    // 2. Otherwise follow the visitor's system setting
    if (theme === null) {
        var prefersLight = window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: light)").matches;
        theme = prefersLight ? "light" : "dark";
    }

    document.documentElement.dataset.theme = theme;
})();
