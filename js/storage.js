// =====================================================================
// storage.js: SAVING AND LOADING
//
// localStorage lets the browser remember the app's data after the page is
// closed. It only stores TEXT, so we convert with:
//   JSON.stringify(object)  ->  text   (when saving)
//   JSON.parse(text)        ->  object (when loading)
//
// Two best practices are used here:
//   1. Every storage call is wrapped in try/catch. Storage can be blocked
//      (private browsing, strict privacy settings) or full. If that happens
//      the app should keep working, it just won't remember anything.
//   2. Loaded data is checked with isValidState() before it is used.
//      Stored data can be edited by the user or left over from an old version.
// =====================================================================

import { isValidState } from "./bank.js";

// The name the data is saved under. "v1" is the version of the data format.
// If the shape of the data ever changes, bump it to "v2" so old saved data
// is ignored instead of crashing the new code.
const STORAGE_KEY = "novabank:v1";

// Returns the saved state, or null if there is nothing usable saved.
export function loadState() {
    try {
        const text = localStorage.getItem(STORAGE_KEY);
        if (text === null) return null;           // nothing saved yet

        const state = JSON.parse(text);           // can throw if the text is damaged
        return isValidState(state) ? state : null;

    } catch (error) {
        return null;                              // blocked or unreadable: start fresh
    }
}

// Saves the state. If saving fails, we quietly carry on.
export function saveState(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        // Storage is full or blocked. The app still works for this visit.
    }
}

// Deletes the saved data (used by "Reset demo data")
export function clearState() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        // Nothing we can do, and nothing that needs doing.
    }
}
