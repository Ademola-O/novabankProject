// =====================================================================
// main.js: THE ENTRY POINT
//
// This is the only script index.html loads. It imports the other files and
// connects them:
//
//   bank.js          the banking rules (deposit, withdraw, transfer)
//   storage.js       saving and loading
//   ui.js            drawing things on the page
//   balanceChart.js  the doughnut chart
//   theme.js         the light / dark button
//   format.js        money and date formatting
//
// The pattern for every action is:
//   read the form  ->  run the rule  ->  save  ->  redraw the page
// =====================================================================

import { createInitialState, deposit, withdraw, transfer } from "./bank.js";
import { parseAmountToCents } from "./format.js";
import { loadState, saveState, clearState } from "./storage.js";
import {
    elements,
    renderBalances,
    renderTransactions,
    readForm,
    clearForm,
    readFilters,
    showMessage,
    describeBalances
} from "./ui.js";
import { createBalanceChart, updateBalanceChart } from "./balanceChart.js";
import { initTheme } from "./theme.js";


// ---------------------------------------------------------------------
// STATE
// Use what was saved last time if it's valid, otherwise start with the demo data.
// (The ?? operator means "use the left side, unless it is null".)
// ---------------------------------------------------------------------

let state = loadState() ?? createInitialState();

// The chart is created once, then updated. It is null if Chart.js didn't load.
const chart = createBalanceChart(elements.chartCanvas, state.accounts);


// ---------------------------------------------------------------------
// DRAWING THE PAGE
// ---------------------------------------------------------------------

// Redraws everything that depends on the state
function render() {
    renderBalances(state.accounts);
    renderTransactions(state.transactions, readFilters());
    updateBalanceChart(chart, state.accounts);

    // Keep the chart's text description for screen readers up to date
    elements.chartCanvas.setAttribute("aria-label", describeBalances(state.accounts));
}


// ---------------------------------------------------------------------
// RUNNING AN ACTION
// Deposit, withdraw and transfer all follow the same steps, so the shared
// steps live here once instead of being copied three times.
// `runRule` is a function that receives the form values and the amount in cents,
// and returns the result of the matching rule from bank.js.
// ---------------------------------------------------------------------

function handleAction(runRule) {
    const form = readForm();

    // Turn the typed text into whole cents. null means "not a valid amount".
    const cents = parseAmountToCents(form.amountText);
    if (cents === null) {
        showMessage("Please enter a valid amount, for example 25 or 25.50.", true);
        return;
    }

    // Ask the banking rules to do it. They return { ok: true, message }
    // or { ok: false, error }.
    const result = runRule(form, cents);

    if (!result.ok) {
        showMessage(result.error, true);   // nothing was changed
        return;
    }

    saveState(state);                      // remember it for next visit
    render();                              // redraw the page
    showMessage(result.message, false);
    clearForm();
}


// ---------------------------------------------------------------------
// EVENT LISTENERS
// "When this happens, run this function."
// ---------------------------------------------------------------------

elements.depositBtn.addEventListener("click", function () {
    handleAction(function (form, cents) {
        return deposit(state, form.account, cents, form.description);
    });
});

elements.withdrawBtn.addEventListener("click", function () {
    handleAction(function (form, cents) {
        return withdraw(state, form.account, cents, form.description);
    });
});

elements.transferBtn.addEventListener("click", function () {
    handleAction(function (form, cents) {
        return transfer(state, form.account, form.transferTo, cents, form.description);
    });
});

// The two search boxes stay in sync, and both filter the table
elements.globalSearch.addEventListener("input", function () {
    elements.txSearch.value = elements.globalSearch.value;
    renderTransactions(state.transactions, readFilters());
});

elements.txSearch.addEventListener("input", function () {
    elements.globalSearch.value = elements.txSearch.value;
    renderTransactions(state.transactions, readFilters());
});

elements.typeFilter.addEventListener("change", function () {
    renderTransactions(state.transactions, readFilters());
});

// "Transfer" in the top bar jumps to the banking panel
elements.topTransferBtn.addEventListener("click", function () {
    // Don't animate the scroll for people who asked their device to reduce motion
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    elements.bankPanel.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    elements.amount.focus();
});

// Reset the demo back to its starting balances and sample transactions
elements.resetBtn.addEventListener("click", function () {
    if (!confirm("Reset all balances and transactions to the demo data?")) return;

    state = createInitialState();
    clearState();
    render();
    clearForm();
    showMessage("Demo data has been reset.", false);
});

// Links that don't go anywhere yet (href="#") would jump the page to the top.
// This stops that. The skip link (href="#main-content") is not affected.
document.querySelectorAll('a[href="#"]').forEach(function (link) {
    link.addEventListener("click", function (event) {
        event.preventDefault();
    });
});

// The theme button. When the theme changes, the chart's text colour must change too.
initTheme(elements.themeBtn, function () {
    updateBalanceChart(chart, state.accounts);
});


// ---------------------------------------------------------------------
// START UP: draw the page for the first time
// ---------------------------------------------------------------------

render();
