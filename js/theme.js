// =====================================================================
// theme.js: THE LIGHT / DARK BUTTON
//
// The theme is stored as data-theme="light" or data-theme="dark" on the
// <html> element. The CSS reads that attribute (see :root[data-theme="light"]
// in style.css) and swaps the colours.
//
// theme-init.js has already set the starting theme before the page was drawn.
// This file only handles clicks and remembering the choice.
// =====================================================================

const STORAGE_KEY = "novabank:theme";

function saveTheme(theme) {
    try {
        localStorage.setItem(STORAGE_KEY, theme);
    } catch (error) {
        // Storage is blocked. The theme still changes, it just isn't remembered.
    }
}

// Sets up the toggle button.
// `onChange` is a function from main.js that runs after each switch,
// so the chart can update its text colour to match.
export function initTheme(button, onChange) {
    const root = document.documentElement;

    // Applies a theme to the page and updates the button to match
    function applyTheme(theme) {
        root.dataset.theme = theme;

        // The button shows the theme you would switch TO
        button.textContent = theme === "light" ? "🌙" : "☀";

        // A clear text label for screen readers (an emoji alone isn't helpful)
        button.setAttribute(
            "aria-label",
            theme === "light" ? "Switch to dark theme" : "Switch to light theme"
        );
    }

    // Start with whatever theme-init.js chose
    applyTheme(root.dataset.theme === "light" ? "light" : "dark");

    button.addEventListener("click", function () {
        const next = root.dataset.theme === "light" ? "dark" : "light";
        applyTheme(next);
        saveTheme(next);
        onChange();
    });
}
