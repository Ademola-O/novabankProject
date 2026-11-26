// Tests for js/format.js
// Run all tests with:  npm test   (or: node --test)
// Uses Node's built-in test runner, so nothing needs installing.

import { test } from "node:test";
import assert from "node:assert/strict";
import { formatMoney, formatSignedAmount, parseAmountToCents } from "../js/format.js";

test("formatMoney shows dollars with commas and two decimals", () => {
    assert.equal(formatMoney(875000), "$8,750.00");
    assert.equal(formatMoney(1499), "$14.99");
    assert.equal(formatMoney(5), "$0.05");
    assert.equal(formatMoney(0), "$0.00");
});

test("formatSignedAmount adds + for deposits, - for withdrawals, nothing for transfers", () => {
    assert.equal(formatSignedAmount("deposit", 10000), "+$100.00");
    assert.equal(formatSignedAmount("withdraw", 10000), "-$100.00");
    assert.equal(formatSignedAmount("transfer", 10000), "$100.00");
});

test("parseAmountToCents accepts valid amounts", () => {
    assert.equal(parseAmountToCents("25"), 2500);
    assert.equal(parseAmountToCents("25.5"), 2550);
    assert.equal(parseAmountToCents("25.50"), 2550);
    assert.equal(parseAmountToCents("0.01"), 1);
    assert.equal(parseAmountToCents(".5"), 50);
    assert.equal(parseAmountToCents("  10  "), 1000);
});

test("parseAmountToCents avoids floating-point mistakes", () => {
    // 0.1 + 0.2 is 0.30000000000000004 as decimals, but exactly 30 as cents
    assert.equal(parseAmountToCents("0.1") + parseAmountToCents("0.2"), 30);
    // 0.29 * 100 is 28.999999999999996 in JavaScript
    assert.equal(parseAmountToCents("0.29"), 29);
    assert.equal(parseAmountToCents("1.15"), 115);
});

test("parseAmountToCents returns null for invalid text", () => {
    assert.equal(parseAmountToCents(""), null);
    assert.equal(parseAmountToCents("abc"), null);
    assert.equal(parseAmountToCents("-5"), null);
    assert.equal(parseAmountToCents("1.234"), null);   // more than 2 decimal places
    assert.equal(parseAmountToCents("1e3"), null);
    assert.equal(parseAmountToCents("12,50"), null);
    assert.equal(parseAmountToCents("5 0"), null);
});

test("parseAmountToCents returns null for absurdly large numbers", () => {
    assert.equal(parseAmountToCents("99999999999999999999"), null);
});
