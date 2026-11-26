// =====================================================================
// ui.js: EVERYTHING THAT TOUCHES THE PAGE
//
// This is the only file (besides main.js and the chart/theme files) that
// reads from or writes to the HTML. It takes data in and draws it.
// It never decides what a deposit does. That's bank.js's job.
//
// SECURITY: text from the user (like a transaction description) is only ever
// added with textContent. textContent treats text as plain text, so
// something like <img src=x onerror=alert(1)> is shown as those exact
// characters instead of being run as code. (innerHTML would run it.)
// =====================================================================

import { ACCOUNT_KEYS, ACCOUNT_NAMES, getTotal, filterTransactions } from "./bank.js";
import { formatMoney, formatDate, formatSignedAmount } from "./format.js";

// Finds an element by its id. If the id is missing from the HTML we throw
// a clear error straight away, instead of getting a confusing
// "cannot read properties of null" much later.
function byId(id) {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error('Missing element in index.html: id="' + id + '"');
    }
    return element;
}

// All the elements the app needs, found once and reused.
// Module scripts run after the page has loaded, so these all exist by now.
export const elements = {
    // Balances
    total: byId("balance"),
    updatedAt: byId("updatedAt"),
    balances: {
        checking: byId("checkingBalance"),
        savings: byId("savingsBalance"),
        investment: byId("investmentBalance")
    },
    chartCanvas: byId("balanceChart"),

    // Banking form
    bankPanel: byId("bankPanel"),
    accountType: byId("accountType"),
    transferTo: byId("transferTo"),
    amount: byId("amount"),
    description: byId("description"),
    depositBtn: byId("depositBtn"),
    withdrawBtn: byId("withdrawBtn"),
    transferBtn: byId("transferBtn"),
    resetBtn: byId("resetBtn"),
    message: byId("message"),

    // Transactions
    globalSearch: byId("globalSearch"),
    txSearch: byId("txSearch"),
    typeFilter: byId("typeFilter"),
    tableBody: byId("transactionTable"),

    // Top bar
    topTransferBtn: byId("topTransferBtn"),
    themeBtn: byId("themeBtn")
};


// ---------------------------------------------------------------------
// BALANCES
// ---------------------------------------------------------------------

// Writes the total and each account's balance onto the page
export function renderBalances(accounts) {
    elements.total.textContent = formatMoney(getTotal(accounts));

    for (const key of ACCOUNT_KEYS) {
        elements.balances[key].textContent = formatMoney(accounts[key]);
    }

    // Show when the numbers were last refreshed (instead of a fixed "just now")
    elements.updatedAt.textContent = "Updated at " + new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit"
    });
}


// ---------------------------------------------------------------------
// TRANSACTION TABLE
// ---------------------------------------------------------------------

// Builds one <td> cell with plain text inside it
function createCell(text, className) {
    const cell = document.createElement("td");
    cell.textContent = text;
    if (className) cell.className = className;
    return cell;
}

// Draws the transactions that match the current search and filter.
// It clears the table and rebuilds it from the data every time, so the table
// can never drift out of step with the saved transactions.
export function renderTransactions(transactions, filters) {
    const matching = filterTransactions(transactions, filters);

    // A DocumentFragment is an off-screen holder. We build every row in it,
    // then add it to the page in one go, which is faster than adding rows one by one.
    const fragment = document.createDocumentFragment();

    if (matching.length === 0) {
        // Tell the user why the table is empty instead of leaving a blank gap
        const row = document.createElement("tr");
        const cell = createCell("No transactions found.", "empty-row");
        cell.colSpan = 5;   // stretch across all five columns
        row.appendChild(cell);
        fragment.appendChild(row);
    }

    for (const tx of matching) {
        const row = document.createElement("tr");

        row.appendChild(createCell(formatDate(tx.date)));
        row.appendChild(createCell(tx.description));
        row.appendChild(createCell(tx.category));
        row.appendChild(createCell("Completed"));
        // The class (amount-deposit, amount-withdraw, amount-transfer) sets the colour
        row.appendChild(createCell(formatSignedAmount(tx.type, tx.cents), "amount-" + tx.type));

        fragment.appendChild(row);
    }

    // replaceChildren removes everything currently in the table body
    // and puts the new rows in, in a single step
    elements.tableBody.replaceChildren(fragment);
}


// ---------------------------------------------------------------------
// THE FORM
// ---------------------------------------------------------------------

// Reads whatever the user has entered or selected
export function readForm() {
    return {
        account: elements.accountType.value,
        transferTo: elements.transferTo.value,
        amountText: elements.amount.value,
        description: elements.description.value
    };
}

// Empties the amount and description, and puts the cursor back in the amount box
export function clearForm() {
    elements.amount.value = "";
    elements.description.value = "";
    elements.amount.focus();
}

// Reads the current search text and type dropdown
export function readFilters() {
    return {
        text: elements.txSearch.value,
        type: elements.typeFilter.value
    };
}

// Shows a green (success) or red (error) message under the buttons.
// The message box has aria-live="polite" in the HTML, so screen readers
// announce the new text automatically.
export function showMessage(text, isError) {
    elements.message.textContent = text;
    elements.message.className = "message " + (isError ? "error" : "success");
}

// Short text for screen readers describing the chart, e.g.
// "Balance split: Checking $8,750.00, Savings $12,400.00, Investments $4,300.00"
export function describeBalances(accounts) {
    const parts = ACCOUNT_KEYS.map(function (key) {
        return ACCOUNT_NAMES[key] + " " + formatMoney(accounts[key]);
    });
    return "Balance split: " + parts.join(", ");
}
