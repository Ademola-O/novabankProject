// =====================================================================
// format.js: FORMATTING AND PARSING HELPERS
//
// Small functions that turn data into text for the screen, and turn what the
// user typed back into data. There is no DOM and no app state in here, so
// every function takes values in and gives a value out. That makes them
// easy to test (see tests/format.test.js).
//
// Reminder: all money in this app is stored as whole CENTS (875000 = $8,750.00).
// =====================================================================

// Intl.NumberFormat is the browser's built-in formatter. It adds the $ sign, the
// commas and exactly two decimal places. It's created once here and reused,
// because building a formatter is slower than using one.
const moneyFormat = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
});

// 875000 (cents) -> "$8,750.00"
export function formatMoney(cents) {
    return moneyFormat.format(cents / 100);
}

// Milliseconds since 1970 -> "May 13"
export function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
    });
}

// Deposits show "+", withdrawals show "-", transfers show no sign
// (a transfer moves money between your own accounts, so your total doesn't change).
export function formatSignedAmount(type, cents) {
    const sign = type === "deposit" ? "+" : type === "withdraw" ? "-" : "";
    return sign + formatMoney(cents);
}

// Turns what the user typed ("25", "25.5", "25.50") into whole cents (2550).
// Returns null if the text isn't a valid amount.
//
// It reads the digits directly instead of multiplying by 100,
// because decimal maths in JavaScript can drift (0.1 + 0.2 = 0.30000000000000004).
export function parseAmountToCents(text) {
    const clean = String(text).trim();

    // This pattern (a "regular expression") describes exactly what a valid amount looks like.
    // Reading it left to right:
    //   ^ and $            the WHOLE text must match, not just a part of it
    //   \d+                one or more digits (the dollars)
    //   (\.\d{0,2})?       optionally a "." followed by up to 2 digits (the cents)
    //   |\.\d{1,2}         OR just a "." and 1 or 2 digits, like ".5"
    // So "25", "25.5" and ".50" pass, while "-5", "1e3", "1.234", "12,50" and "abc" fail.
    if (!/^(\d+(\.\d{0,2})?|\.\d{1,2})$/.test(clean)) {
        return null;
    }

    // Split "25.5" into "25" and "5". If there is no ".", fraction defaults to "".
    const [dollars, fraction = ""] = clean.split(".");

    // "5".padEnd(2, "0") makes "50", so 25.5 means 25 dollars and 50 cents.
    // Then dollars * 100 + cents gives the total in whole cents (2550).
    const cents = Number(dollars || "0") * 100 + Number(fraction.padEnd(2, "0"));

    // Reject numbers too big for JavaScript to hold exactly
    return Number.isSafeInteger(cents) ? cents : null;
}
