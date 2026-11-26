// =====================================================================
// balanceChart.js: THE DOUGHNUT CHART
//
// Chart.js (a free chart library) is loaded from a CDN by a <script> tag in
// index.html. That tag creates a global variable called Chart, which we use here.
//
// If the library fails to load (no internet, or a blocker), Chart will not
// exist. We check for that, so the chart disappears but the rest of the app
// keeps working. This is called "graceful degradation".
// =====================================================================

/* global Chart */

import { ACCOUNT_KEYS, ACCOUNT_NAMES } from "./bank.js";

// One colour per slice, in the same order as ACCOUNT_KEYS
const COLOURS = ["#3b82f6", "#22c55e", "#8b5cf6"];

// Chart.js wants plain numbers in dollars, so we divide the cents by 100
function toChartData(accounts) {
    return ACCOUNT_KEYS.map(function (key) {
        return accounts[key] / 100;
    });
}

// The legend text should match the current theme (light or dark).
// We read it from the CSS variable --muted so the colours stay defined in one place.
function legendColour() {
    return getComputedStyle(document.documentElement).getPropertyValue("--muted").trim();
}

// People who have asked their device to reduce motion shouldn't get animations
function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Creates the chart. Returns the chart object, or null if Chart.js didn't load.
export function createBalanceChart(canvas, accounts) {
    if (typeof Chart === "undefined") return null;

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "bottom",
                labels: { color: legendColour() }
            }
        }
    };

    // Turning animation off is done with `animation: false`
    if (prefersReducedMotion()) {
        options.animation = false;
    }

    return new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: ACCOUNT_KEYS.map(function (key) { return ACCOUNT_NAMES[key]; }),
            datasets: [{
                data: toChartData(accounts),
                backgroundColor: COLOURS,
                borderWidth: 0
            }]
        },
        options: options
    });
}

// Refreshes the chart after the balances (or the theme) change.
// Does nothing if there is no chart.
export function updateBalanceChart(chart, accounts) {
    if (!chart) return;

    chart.data.datasets[0].data = toChartData(accounts);
    chart.options.plugins.legend.labels.color = legendColour();
    chart.update();
}
