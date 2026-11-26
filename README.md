# NovaBank Pro

A banking dashboard built with plain HTML, CSS and JavaScript (no frameworks). Deposit, withdraw and transfer money between three accounts, see where your money is split in a chart, and search or filter your transactions. Your data is saved in your browser.


**Live demo:** <!-- paste your GitHub Pages link here -->

## Features

- **Deposit, withdraw and transfer** between Checking, Savings and Investments
- **One transfer is one transfer:** money leaves one account and arrives in another, and the total never changes
- **Validation:** rejects empty, zero, negative and over-precise amounts, anything over $1,000,000, and withdrawals or transfers bigger than the balance
- **Doughnut chart** of how your money is split (Chart.js), updating after every action
- **Search and filter** transactions by text and by type
- **Saved between visits** with `localStorage`, plus a "Reset demo data" button
- **Light and dark theme,** following your system setting and remembering your choice
- **Responsive** layout for desktop, tablet and phone
- **Accessible:** semantic HTML, labelled controls, keyboard focus outlines, a skip link, screen-reader announcements for messages, and reduced-motion support

## Project structure

```
novabank/
├── index.html              The page (structure only)
├── css/
│   └── style.css           All styling, with light and dark themes
├── js/
│   ├── main.js             Entry point: connects everything together
│   ├── bank.js             The banking rules (no DOM, fully tested)
│   ├── format.js           Money and date formatting, amount parsing
│   ├── storage.js          Saving and loading (localStorage)
│   ├── ui.js               Everything that reads or writes the page
│   ├── balanceChart.js     The doughnut chart
│   ├── theme.js            The light/dark toggle
│   └── theme-init.js       Sets the theme before the page draws
├── tests/
│   ├── bank.test.js        Tests for the banking rules
│   └── format.test.js      Tests for formatting and parsing
├── package.json
└── README.md
```

## Running it

The code uses JavaScript modules (`import` / `export`), and browsers block modules when you open a file by double-clicking it. Run it from a small local server instead:

- **VS Code:** install the *Live Server* extension, right-click `index.html` and choose *Open with Live Server*
- **Or in a terminal** (needs Python): `npm start`, or `python3 -m http.server 8000`, then open <http://localhost:8000>

It also works on GitHub Pages with no changes.

## Running the tests

Needs [Node.js](https://nodejs.org) 18 or newer. Nothing to install.

```
npm test
```

## Design decisions

- **Money is stored in cents** (whole numbers). Decimals drift in JavaScript (`0.1 + 0.2` gives `0.30000000000000004`), but whole numbers don't.
- **Rules are separate from the page.** `bank.js` never touches the DOM, so it can be tested on its own and the page can change without breaking the rules.
- **Every action returns `{ ok, message }` or `{ ok, error }`** instead of throwing for normal mistakes like "not enough money". A failed action changes nothing.
- **User text is added with `textContent`, never `innerHTML`,** so a description like `<img onerror=...>` is shown as plain text and can't run as code.
- **Saved data is validated before use.** Stored data can be edited or left over from an old version, so it is checked for the right shape first.
- **Graceful failure:** if storage is blocked or the chart library doesn't load, the rest of the app keeps working.
- **Chart.js is pinned to an exact version with an integrity hash,** so a changed or tampered file is refused by the browser.

## Known limitations

- It's a demo: data lives only in your browser, with no accounts, server or real money.
- Pay Bills, Upgrade Premium, the navigation links and the insight cards are placeholders.

## Ideas for next steps

- [ ] Edit or delete transactions
- [ ] A real balance-over-time chart
- [ ] Export transactions to CSV
- [ ] A backend with logins and a database

## Author

Ademola Okesanjo ([GitHub](https://github.com/Ademola-O) · [LinkedIn](https://www.linkedin.com/in/ademola-o-400802130/))
