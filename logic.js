(function (root) {
  "use strict";

  const GRACE_HOURS = 2;

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function ymd(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function parseKeyDate(key) {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }

  function activityWindow(dateKey, activity) {
    const day = parseKeyDate(dateKey);
    const start = new Date(day);
    start.setHours(activity.startH, activity.startM, 0, 0);
    const end = new Date(day);
    if (activity.endNextDay) end.setDate(end.getDate() + 1);
    end.setHours(activity.endH, activity.endM, 0, 0);
    return { start, end, freezeAt: new Date(end.getTime() + GRACE_HOURS * 60 * 60 * 1000) };
  }

  function boxMode(dateKey, activity, now = new Date()) {
    const { start, freezeAt } = activityWindow(dateKey, activity);
    if (now < start) return "future";
    if (now >= freezeAt) return "frozen";
    return "open";
  }

  function reminderMinutes(activity) {
    return (activity.startH * 60 + activity.startM - 15 + 24 * 60) % (24 * 60);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
    }[character]));
  }

  function icsText(value) {
    return String(value).replace(/([,;\\])/g, "\\$1").replace(/\r?\n/g, "\\n");
  }

  function buildCalendar(activities, startDate = new Date()) {
    const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const day = `${startDate.getFullYear()}${pad(startDate.getMonth() + 1)}${pad(startDate.getDate())}`;
    const nextDate = new Date(startDate);
    nextDate.setDate(nextDate.getDate() + 1);
    const nextDay = `${nextDate.getFullYear()}${pad(nextDate.getMonth() + 1)}${pad(nextDate.getDate())}`;
    const lines = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Routine Tracker//EN", "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH", "X-WR-CALNAME:Daily Routine",
    ];
    activities.forEach((activity) => {
      const start = `${day}T${pad(activity.startH)}${pad(activity.startM)}00`;
      const end = `${activity.endNextDay ? nextDay : day}T${pad(activity.endH)}${pad(activity.endM)}00`;
      lines.push(
        "BEGIN:VEVENT", `UID:${activity.id}@routine-tracker`, `DTSTAMP:${stamp}`,
        `DTSTART:${start}`, `DTEND:${end}`, "RRULE:FREQ=DAILY", `SUMMARY:${icsText(activity.name)}`,
        "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${icsText(activity.name)} starts in 15 minutes`,
        "TRIGGER:-PT15M", "END:VALARM", "END:VEVENT"
      );
    });
    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
  }

  root.RoutineLogic = { GRACE_HOURS, pad, ymd, parseKeyDate, activityWindow, boxMode, reminderMinutes, escapeHtml, icsText, buildCalendar };
}(window));
