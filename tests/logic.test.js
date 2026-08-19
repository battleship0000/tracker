const assert = require("node:assert/strict");

global.window = global;
require("../logic.js");

const { activityWindow, boxMode, reminderMinutes, ymd, escapeHtml, icsText, buildCalendar } = global.RoutineLogic;
const normal = { startH: 10, startM: 0, endH: 11, endM: 0, endNextDay: false };
const overnight = { startH: 23, startM: 0, endH: 1, endM: 0, endNextDay: true };

assert.equal(ymd(new Date(2026, 7, 18)), "2026-08-18");
assert.equal(boxMode("2026-08-18", normal, new Date(2026, 7, 18, 9, 59)), "future");
assert.equal(boxMode("2026-08-18", normal, new Date(2026, 7, 18, 10, 0)), "open");
assert.equal(boxMode("2026-08-18", normal, new Date(2026, 7, 18, 12, 59)), "open");
assert.equal(boxMode("2026-08-18", normal, new Date(2026, 7, 18, 13, 0)), "frozen");

const overnightWindow = activityWindow("2026-08-18", overnight);
assert.equal(overnightWindow.end.getDate(), 19);
assert.equal(boxMode("2026-08-18", overnight, new Date(2026, 7, 19, 2, 59)), "open");
assert.equal(boxMode("2026-08-18", overnight, new Date(2026, 7, 19, 3, 0)), "frozen");
assert.equal(reminderMinutes({ startH: 0, startM: 5 }), 23 * 60 + 50);
assert.equal(escapeHtml('<img src=x onerror=alert(1)>'), "&lt;img src=x onerror=alert(1)&gt;");
assert.equal(icsText("Plan, review; notes\\next"), "Plan\\, review\\; notes\\\\next");
const calendar = buildCalendar([{ id: "night", name: "Night, review", ...overnight }], new Date(2026, 7, 18));
assert.match(calendar, /DTSTART:20260818T230000/);
assert.match(calendar, /DTEND:20260819T010000/);
assert.match(calendar, /SUMMARY:Night\\, review/);
assert.match(calendar, /TRIGGER:-PT15M/);

console.log("All routine logic tests passed.");
