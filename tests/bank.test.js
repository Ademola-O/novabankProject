// Tests for js/bank.js (the banking rules)
// Run all tests with:  npm test   (or: node --test)

import { test } from "node:test";
import assert from "node:assert/strict";
import {
    createInitialState,
    getTotal,
    deposit,
    withdraw,
    transfer,
    filterTransactions,
    isValidState,
    MAX_AMOUNT_CENTS,
    MAX_DESCRIPTION_LENGTH,
    MAX_TRANSACTIONS
} from "../js/bank.js";

const FIXED_DATE = new Date(2026, 10, 25).getTime();

test("starting state has the demo balances", () => {
    const state = createInitialState();
    assert.equal(state.accounts.checking, 875000);
    assert.equal(state.accounts.savings, 1240000);
    assert.equal(state.accounts.investment, 430000);
    assert.equal(getTotal(state.accounts), 2545000);
    assert.equal(state.transactions.length, 4);
});

test("each call to createInitialState gives an independent copy", () => {
    const a = createInitialState();
    const b = createInitialState();
    deposit(a, "checking", 100);
    assert.equal(b.accounts.checking, 875000);
});

// ---------- deposit ----------

test("deposit adds money to the chosen account and records one transaction", () => {
    const state = createInitialState();
    const result = deposit(state, "savings", 5000, "Birthday money", FIXED_DATE);

    assert.equal(result.ok, true);
    assert.equal(state.accounts.savings, 1245000);
    assert.equal(state.accounts.checking, 875000);       // untouched
    assert.equal(state.transactions.length, 5);
    assert.deepEqual(state.transactions[0], {
        date: FIXED_DATE,
        description: "Birthday money",
        category: "Income",
        type: "deposit",
        cents: 5000
    });
});

test("deposit uses a default description when none is typed", () => {
    const state = createInitialState();
    deposit(state, "checking", 100, "   ");
    assert.equal(state.transactions[0].description, "Deposit to Checking");
});

test("deposit cuts a description that is too long", () => {
    const state = createInitialState();
    deposit(state, "checking", 100, "x".repeat(500));
    assert.equal(state.transactions[0].description.length, MAX_DESCRIPTION_LENGTH);
});

test("deposit rejects zero, negative, decimal and non-number amounts", () => {
    for (const bad of [0, -100, 12.5, NaN, Infinity, "100", null, undefined]) {
        const state = createInitialState();
        const result = deposit(state, "checking", bad);
        assert.equal(result.ok, false, "should reject " + String(bad));
        assert.equal(state.accounts.checking, 875000);
        assert.equal(state.transactions.length, 4);
    }
});

test("deposit rejects amounts over the limit", () => {
    const state = createInitialState();
    const result = deposit(state, "checking", MAX_AMOUNT_CENTS + 1);
    assert.equal(result.ok, false);
    assert.match(result.error, /too large/);
    assert.equal(deposit(state, "checking", MAX_AMOUNT_CENTS).ok, true);
});

test("deposit rejects an unknown account", () => {
    const state = createInitialState();
    assert.equal(deposit(state, "offshore", 100).ok, false);
    assert.equal(deposit(state, "__proto__", 100).ok, false);
});

// ---------- withdraw ----------

test("withdraw takes money out and records one transaction", () => {
    const state = createInitialState();
    const result = withdraw(state, "checking", 25000, "Rent", FIXED_DATE);

    assert.equal(result.ok, true);
    assert.equal(state.accounts.checking, 850000);
    assert.equal(state.transactions[0].type, "withdraw");
    assert.equal(state.transactions[0].description, "Rent");
});

test("withdraw refuses to go below zero and changes nothing", () => {
    const state = createInitialState();
    const result = withdraw(state, "checking", 875001);

    assert.equal(result.ok, false);
    assert.match(result.error, /Insufficient funds/);
    assert.equal(state.accounts.checking, 875000);
    assert.equal(state.transactions.length, 4);
});

test("withdraw can take out exactly the whole balance", () => {
    const state = createInitialState();
    assert.equal(withdraw(state, "checking", 875000).ok, true);
    assert.equal(state.accounts.checking, 0);
});

// ---------- transfer ----------

test("transfer moves money ONCE and keeps the total the same", () => {
    const state = createInitialState();
    const totalBefore = getTotal(state.accounts);

    const result = transfer(state, "checking", "savings", 20000, "", FIXED_DATE);

    assert.equal(result.ok, true);
    assert.equal(state.accounts.checking, 855000);
    assert.equal(state.accounts.savings, 1260000);
    assert.equal(state.accounts.investment, 430000);     // not touched
    assert.equal(getTotal(state.accounts), totalBefore);
    assert.equal(state.transactions.length, 5);          // one transaction, not two
    assert.equal(state.transactions[0].description, "Transfer: Checking to Savings");
    assert.equal(state.transactions[0].type, "transfer");
});

test("transfer refuses the same account", () => {
    const state = createInitialState();
    const result = transfer(state, "savings", "savings", 100);
    assert.equal(result.ok, false);
    assert.equal(state.accounts.savings, 1240000);
});

test("transfer refuses when there isn't enough money and changes nothing", () => {
    const state = createInitialState();
    const result = transfer(state, "investment", "checking", 430001);

    assert.equal(result.ok, false);
    assert.equal(state.accounts.investment, 430000);
    assert.equal(state.accounts.checking, 875000);
    assert.equal(state.transactions.length, 4);
});

test("transfer refuses an unknown account", () => {
    const state = createInitialState();
    assert.equal(transfer(state, "checking", "nowhere", 100).ok, false);
    assert.equal(transfer(state, "nowhere", "checking", 100).ok, false);
});

// ---------- general ----------

test("many small amounts add up exactly (no floating-point drift)", () => {
    const state = createInitialState();
    state.accounts.checking = 0;
    for (let i = 0; i < 100; i++) {
        deposit(state, "checking", 10);   // ten cents, one hundred times
    }
    assert.equal(state.accounts.checking, 1000);          // exactly $10.00
});

test("only the newest transactions are kept", () => {
    const state = createInitialState();
    for (let i = 0; i < MAX_TRANSACTIONS + 20; i++) {
        deposit(state, "checking", 1, "Deposit " + i);
    }
    assert.equal(state.transactions.length, MAX_TRANSACTIONS);
    assert.equal(state.transactions[0].description, "Deposit " + (MAX_TRANSACTIONS + 19));
});

// ---------- filtering ----------

test("filterTransactions filters by type", () => {
    const { transactions } = createInitialState();
    assert.equal(filterTransactions(transactions, { type: "all" }).length, 4);
    assert.equal(filterTransactions(transactions, { type: "deposit" }).length, 2);
    assert.equal(filterTransactions(transactions, { type: "withdraw" }).length, 2);
    assert.equal(filterTransactions(transactions, { type: "transfer" }).length, 0);
});

test("filterTransactions searches text, ignoring capitals", () => {
    const { transactions } = createInitialState();
    assert.equal(filterTransactions(transactions, { text: "NETFLIX" }).length, 1);
    assert.equal(filterTransactions(transactions, { text: "income" }).length, 2);
    assert.equal(filterTransactions(transactions, { text: "zzz" }).length, 0);
});

test("filterTransactions combines text and type, and leaves the original list alone", () => {
    const { transactions } = createInitialState();
    const result = filterTransactions(transactions, { text: "income", type: "withdraw" });
    assert.equal(result.length, 0);
    assert.equal(transactions.length, 4);
});

// ---------- validating saved data ----------

test("isValidState accepts real state", () => {
    assert.equal(isValidState(createInitialState()), true);
});

test("isValidState rejects damaged or tampered data", () => {
    const good = () => createInitialState();

    assert.equal(isValidState(null), false);
    assert.equal(isValidState("text"), false);
    assert.equal(isValidState({}), false);

    let s = good(); s.accounts.checking = -1;
    assert.equal(isValidState(s), false);

    s = good(); s.accounts.savings = 12.5;
    assert.equal(isValidState(s), false);

    s = good(); s.accounts.savings = "12";
    assert.equal(isValidState(s), false);

    s = good(); delete s.accounts.investment;
    assert.equal(isValidState(s), false);

    s = good(); s.transactions = "nope";
    assert.equal(isValidState(s), false);

    s = good(); s.transactions[0].type = "steal";
    assert.equal(isValidState(s), false);

    s = good(); s.transactions[0].description = 123;
    assert.equal(isValidState(s), false);

    s = good(); s.transactions[0].cents = 0;
    assert.equal(isValidState(s), false);

    s = good(); s.transactions.push(null);
    assert.equal(isValidState(s), false);
});
