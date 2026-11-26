// =====================================================================
// bank.js: THE BANKING RULES
//
// This file knows how banking works (deposit, withdraw, transfer) but
// knows NOTHING about the web page. There is no document.getElementById
// in here. That separation is a best practice because:
//   1. The rules can be tested on their own (see tests/bank.test.js).
//   2. If you change how the page looks, the rules can't break.
//   3. The same rules could power a different page, or an app.
//
// "State" is all the data the app remembers. It is one object:
//   {
//     accounts:     { checking: 875000, savings: 1240000, investment: 430000 },
//     transactions: [ { date, description, category, type, cents }, ... ]
//   }
//
// MONEY IS STORED IN CENTS (whole numbers), never dollars with decimals.
// JavaScript decimals drift: 0.1 + 0.2 gives 0.30000000000000004.
// Whole numbers never drift, so 10 + 20 is always exactly 30.
// We only turn cents into "$12.34" when showing them on screen.
// =====================================================================

import { formatMoney, formatDate } from "./format.js";

// ---------------------------------------------------------------------
// CONSTANTS
// Values that never change are named once here instead of being typed
// ("hard-coded") all over the code. Change a limit here and it changes everywhere.
// ---------------------------------------------------------------------

// The keys used for each account inside state.accounts
export const ACCOUNT_KEYS = ["checking", "savings", "investment"];

// The friendly names shown to the user
export const ACCOUNT_NAMES = {
    checking: "Checking",
    savings: "Savings",
    investment: "Investments"
};

export const MAX_AMOUNT_CENTS = 100000000;   // $1,000,000.00 per transaction
export const MAX_DESCRIPTION_LENGTH = 60;    // characters
export const MAX_TRANSACTIONS = 50;          // oldest ones are dropped after this

// The only transaction types that are allowed
const TRANSACTION_TYPES = ["deposit", "withdraw", "transfer"];


// ---------------------------------------------------------------------
// STARTING DATA
// ---------------------------------------------------------------------

// Builds a fresh state with the demo balances and four sample transactions.
// It's a function (not a plain object) so every call returns a NEW copy,
// which is what lets "Reset demo data" work.
export function createInitialState() {
    return {
        accounts: {
            checking: 875000,      // $8,750.00
            savings: 1240000,      // $12,400.00
            investment: 430000     // $4,300.00
        },
        // Newest first. Dates are timestamps (milliseconds since 1970).
        // Months in JavaScript dates start at 0, so 4 means May.
        transactions: [
            { date: new Date(2026, 4, 13).getTime(), description: "Salary Deposit",       category: "Income",        type: "deposit",  cents: 320000 },
            { date: new Date(2026, 4, 12).getTime(), description: "ATM Withdrawal",       category: "Cash",          type: "withdraw", cents: 20000 },
            { date: new Date(2026, 4, 11).getTime(), description: "Netflix Subscription", category: "Entertainment", type: "withdraw", cents: 1499 },
            { date: new Date(2026, 4, 10).getTime(), description: "Freelance Payment",    category: "Income",        type: "deposit",  cents: 125000 }
        ]
    };
}


// ---------------------------------------------------------------------
// SMALL HELPERS
// ---------------------------------------------------------------------

// Every action returns one of these two shapes, so the caller can always do:
//     if (!result.ok) { show result.error }
// This is easier to follow (and test) than throwing errors for normal mistakes
// like "not enough money".
const succeed = (message) => ({ ok: true, message });
const fail = (error) => ({ ok: false, error });

// Adds up every account
export function getTotal(accounts) {
    return ACCOUNT_KEYS.reduce(function (sum, key) {
        return sum + accounts[key];
    }, 0);
}

// Is this a real account key? Guards against typos or tampered form values.
function isAccount(key) {
    return ACCOUNT_KEYS.includes(key);
}

// Checks an amount. Returns an error message, or null if the amount is fine.
// Number.isSafeInteger is false for decimals (12.5), NaN, Infinity and huge numbers.
function checkAmount(cents) {
    if (!Number.isSafeInteger(cents) || cents <= 0) {
        return "Amount must be greater than $0.00.";
    }
    if (cents > MAX_AMOUNT_CENTS) {
        return "Amount is too large. The limit is " + formatMoney(MAX_AMOUNT_CENTS) + " per transaction.";
    }
    return null;
}

// Uses what the user typed, or a default description if they left it blank.
// Also cuts it to the maximum length.
function cleanDescription(typed, fallback) {
    const text = String(typed || "").trim().slice(0, MAX_DESCRIPTION_LENGTH);
    return text === "" ? fallback : text;
}

// Puts a new transaction at the START of the list (newest first)
// and drops the oldest ones if the list gets too long.
function recordTransaction(state, transaction) {
    state.transactions.unshift(transaction);
    if (state.transactions.length > MAX_TRANSACTIONS) {
        state.transactions.length = MAX_TRANSACTIONS;
    }
}


// ---------------------------------------------------------------------
// THE THREE ACTIONS
// Each one: 1) checks the input, 2) changes the balances, 3) records the
// transaction. If a check fails, NOTHING is changed.
// `now` is a parameter so tests can pass in a fixed date.
// ---------------------------------------------------------------------

export function deposit(state, account, cents, description = "", now = Date.now()) {
    if (!isAccount(account)) return fail("Please choose a valid account.");

    const problem = checkAmount(cents);
    if (problem) return fail(problem);

    state.accounts[account] += cents;

    recordTransaction(state, {
        date: now,
        description: cleanDescription(description, "Deposit to " + ACCOUNT_NAMES[account]),
        category: "Income",
        type: "deposit",
        cents: cents
    });

    return succeed("Deposited " + formatMoney(cents) + " into " + ACCOUNT_NAMES[account] + ".");
}

export function withdraw(state, account, cents, description = "", now = Date.now()) {
    if (!isAccount(account)) return fail("Please choose a valid account.");

    const problem = checkAmount(cents);
    if (problem) return fail(problem);

    // You can't take out more than the account holds
    if (cents > state.accounts[account]) {
        return fail(
            "Insufficient funds. " + ACCOUNT_NAMES[account] + " has " +
            formatMoney(state.accounts[account]) + "."
        );
    }

    state.accounts[account] -= cents;

    recordTransaction(state, {
        date: now,
        description: cleanDescription(description, "Withdrawal from " + ACCOUNT_NAMES[account]),
        category: "Cash",
        type: "withdraw",
        cents: cents
    });

    return succeed("Withdrew " + formatMoney(cents) + " from " + ACCOUNT_NAMES[account] + ".");
}

// ONE transfer: money leaves `from` and arrives in `to`.
// The total across all accounts stays exactly the same.
export function transfer(state, from, to, cents, description = "", now = Date.now()) {
    if (!isAccount(from) || !isAccount(to)) return fail("Please choose a valid account.");
    if (from === to) return fail("Please choose two different accounts.");

    const problem = checkAmount(cents);
    if (problem) return fail(problem);

    if (cents > state.accounts[from]) {
        return fail(
            "Insufficient funds. " + ACCOUNT_NAMES[from] + " has " +
            formatMoney(state.accounts[from]) + "."
        );
    }

    state.accounts[from] -= cents;
    state.accounts[to] += cents;

    recordTransaction(state, {
        date: now,
        description: cleanDescription(
            description,
            "Transfer: " + ACCOUNT_NAMES[from] + " to " + ACCOUNT_NAMES[to]
        ),
        category: "Transfer",
        type: "transfer",
        cents: cents
    });

    return succeed(
        "Transferred " + formatMoney(cents) + " from " +
        ACCOUNT_NAMES[from] + " to " + ACCOUNT_NAMES[to] + "."
    );
}


// ---------------------------------------------------------------------
// SEARCH AND FILTER
// ---------------------------------------------------------------------

// Returns only the transactions that match the search text and the type.
// `type` is "all", "deposit", "withdraw" or "transfer".
// It returns a NEW list and leaves the original untouched.
export function filterTransactions(transactions, filters = {}) {
    const type = filters.type || "all";
    const needle = String(filters.text || "").trim().toLowerCase();

    return transactions.filter(function (tx) {
        const matchesType = type === "all" || tx.type === type;

        // Search the description, category, date and amount text
        const haystack = [
            tx.description,
            tx.category,
            formatDate(tx.date),
            formatMoney(tx.cents)
        ].join(" ").toLowerCase();

        const matchesText = needle === "" || haystack.includes(needle);

        return matchesType && matchesText;
    });
}


// ---------------------------------------------------------------------
// VALIDATING SAVED DATA
// Anything read back from the browser's storage could have been edited,
// corrupted, or saved by an older version of the app. So we never trust it:
// this function checks the whole shape before the app is allowed to use it.
// ---------------------------------------------------------------------

export function isValidState(state) {
    if (!state || typeof state !== "object") return false;

    // The three balances must be whole numbers that are not negative
    const accounts = state.accounts;
    if (!accounts || typeof accounts !== "object") return false;
    for (const key of ACCOUNT_KEYS) {
        if (!Number.isSafeInteger(accounts[key]) || accounts[key] < 0) return false;
    }

    // The transactions must be a list of correctly-shaped objects
    if (!Array.isArray(state.transactions)) return false;
    if (state.transactions.length > MAX_TRANSACTIONS) return false;

    return state.transactions.every(function (tx) {
        return tx !== null &&
            typeof tx === "object" &&
            Number.isFinite(tx.date) &&
            typeof tx.description === "string" &&
            typeof tx.category === "string" &&
            TRANSACTION_TYPES.includes(tx.type) &&
            Number.isSafeInteger(tx.cents) &&
            tx.cents > 0;
    });
}
