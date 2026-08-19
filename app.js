const ACTS_KEY = "routine-activities-v1";
const {
  pad, ymd, activityWindow, boxMode, reminderMinutes, escapeHtml, buildCalendar,
} = window.RoutineLogic;

const DEFAULT_ACTIVITIES = [
  { id: "sleep", name: "Sleep", time: "01:00–08:00", startH: 1, startM: 0, endH: 8, endM: 0, endNextDay: false, kind: "sleep" },
  { id: "free1", name: "Free Time", time: "08:00–10:00", startH: 8, startM: 0, endH: 10, endM: 0, endNextDay: false, kind: "free" },
  { id: "meal1", name: "Meal 1", time: "10:00–11:00", startH: 10, startM: 0, endH: 11, endM: 0, endNextDay: false, kind: "meal" },
  { id: "study1", name: "Study 1", time: "11:00–14:00", startH: 11, startM: 0, endH: 14, endM: 0, endNextDay: false, kind: "study" },
  { id: "meal2", name: "Meal 2", time: "14:00–15:00", startH: 14, startM: 0, endH: 15, endM: 0, endNextDay: false, kind: "meal" },
  { id: "free2", name: "Free Time", time: "15:00–16:00", startH: 15, startM: 0, endH: 16, endM: 0, endNextDay: false, kind: "free" },
  { id: "study2", name: "Study 2", time: "16:00–18:00", startH: 16, startM: 0, endH: 18, endM: 0, endNextDay: false, kind: "study" },
  { id: "job", name: "Job Applications", time: "18:00–19:00", startH: 18, startM: 0, endH: 19, endM: 0, endNextDay: false, kind: "job" },
  { id: "free3", name: "Free Time", time: "19:00–19:30", startH: 19, startM: 0, endH: 19, endM: 30, endNextDay: false, kind: "free" },
  { id: "exercise", name: "Exercise", time: "19:30–20:30", startH: 19, startM: 30, endH: 20, endM: 30, endNextDay: false, kind: "exercise" },
  { id: "meal3", name: "Meal 3", time: "20:00–21:00", startH: 20, startM: 0, endH: 21, endM: 0, endNextDay: false, kind: "meal" },
  { id: "free4", name: "Free Time", time: "21:00–22:00", startH: 21, startM: 0, endH: 22, endM: 0, endNextDay: false, kind: "free" },
  { id: "walk", name: "Walk", time: "22:00–23:00", startH: 22, startM: 0, endH: 23, endM: 0, endNextDay: false, kind: "walk" },
  { id: "study3", name: "Study 3", time: "23:00–01:00", startH: 23, startM: 0, endH: 1, endM: 0, endNextDay: true, kind: "study" },
];

function normalizeAct(a) {
  const startH = Number(a.startH), startM = Number(a.startM);
  const endH = Number(a.endH), endM = Number(a.endM);
  const endNextDay = !!a.endNextDay || endH * 60 + endM <= startH * 60 + startM;
  return {
    id: a.id || `act-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    name: a.name || "Activity",
    time: `${pad(startH)}:${pad(startM)}–${pad(endH)}:${pad(endM)}`,
    startH, startM, endH, endM, endNextDay,
    kind: a.kind || "free",
  };
}

function loadActs() {
  try {
    const raw = JSON.parse(localStorage.getItem(ACTS_KEY));
    if (Array.isArray(raw) && raw.length) return raw.map(normalizeAct);
  } catch (_) {}
  return DEFAULT_ACTIVITIES.map((a) => ({ ...a }));
}

let ACTIVITIES = loadActs();

const STORAGE_KEY = "routine-tracker-v1";
const FIRED_KEY = "routine-fired-v1";
const REMIND_KEY = "routine-reminder-lead-v1";

let view = new Date();
let data = load(STORAGE_KEY, {});
let fired = load(FIRED_KEY, {});
let reminderLead = Number(localStorage.getItem(REMIND_KEY)) || 15;

const els = {
  thead: document.querySelector("#tracker thead"),
  tbody: document.querySelector("#tracker tbody"),
  monthTitle: document.getElementById("monthTitle"),
  clock: document.getElementById("clock"),
  todayLabel: document.getElementById("todayLabel"),
  notifyBtn: document.getElementById("notifyBtn"),
  statusBar: document.getElementById("statusBar"),
  statusText: document.getElementById("statusText"),
  toast: document.getElementById("toast"),
  timetableList: document.getElementById("timetableList"),
  todayList: document.getElementById("todayList"),
  installBtn: document.getElementById("installBtn"),
  saveBtn: document.getElementById("saveBtn"),
  settingsBtn: document.getElementById("settingsBtn"),
  settingsModal: document.getElementById("settingsModal"),
  closeSettings: document.getElementById("closeSettings"),
  notifyBtnSettings: document.getElementById("notifyBtnSettings"),
  installBtnSettings: document.getElementById("installBtnSettings"),
  editorList: document.getElementById("editorList"),
  addActivityBtn: document.getElementById("addActivityBtn"),
  saveTimetableBtn: document.getElementById("saveTimetableBtn"),
  resetTimetableBtn: document.getElementById("resetTimetableBtn"),
  openEditBtn: document.getElementById("openEditBtn"),
};

let deferredInstall = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstall = e;
  if (els.installBtn) els.installBtn.hidden = false;
  if (els.installBtnSettings) els.installBtnSettings.hidden = false;
});
async function runInstall() {
  if (!deferredInstall) return;
  deferredInstall.prompt();
  await deferredInstall.userChoice;
  deferredInstall = null;
  if (els.installBtn) els.installBtn.hidden = true;
  if (els.installBtnSettings) els.installBtnSettings.hidden = true;
}
if (els.installBtn) els.installBtn.addEventListener("click", runInstall);
if (els.installBtnSettings) els.installBtnSettings.addEventListener("click", runInstall);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("on", t === tab));
    ["today", "month", "edit", "setup"].forEach((id) => {
      document.getElementById(`panel-${id}`).hidden = tab.dataset.tab !== id;
    });
    els.saveBtn.hidden = tab.dataset.tab === "month" || tab.dataset.tab === "edit";
    if (tab.dataset.tab === "edit") renderEditor();
  });
});

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}
function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function isCurrent(id, now = new Date()) {
  const act = ACTIVITIES.find((a) => a.id === id);
  if (!act) return false;
  const today = ymd(now);
  const w = activityWindow(today, act);
  if (now >= w.start && now < w.end) return true;
  const yest = new Date(now);
  yest.setDate(yest.getDate() - 1);
  const w2 = activityWindow(ymd(yest), act);
  return now >= w2.start && now < w2.end;
}

function renderTimetable() {
  const now = new Date();
  const key = ymd(now);
  els.timetableList.innerHTML = ACTIVITIES.map((a, i) => {
    const storeKey = `${key}:${a.id}`;
    const mode = boxMode(key, a, now);
    const checked = data[storeKey] ? "checked" : "";
    const locked = mode !== "open";
    return `<label class="tt-item ${mode}">
      <span class="n">${i + 1}.</span>
      <span class="copy"><strong>${escapeHtml(a.time)}</strong><span class="nm">${escapeHtml(a.name)}</span></span>
      <input type="checkbox" data-key="${storeKey}" ${checked} ${locked ? "disabled" : ""} />
    </label>`;
  }).join("");
}

function renderToday() {
  const now = new Date();
  const key = ymd(now);
  els.todayList.innerHTML = ACTIVITIES.map((a) => {
    const storeKey = `${key}:${a.id}`;
    const mode = boxMode(key, a, now);
    const checked = data[storeKey] ? "checked" : "";
    const locked = mode !== "open";
    const state =
      mode === "open" ? "Open now — 2 hours after it ends" :
      mode === "future" ? "Not started yet" :
      data[storeKey] ? "Frozen — completed" : "Frozen — blank";
    return `<label class="today-item ${mode}">
      <div class="meta">
        <span class="name">${escapeHtml(a.name)}</span>
        <span class="time">${escapeHtml(a.time)}</span>
        <span class="state">${state}</span>
      </div>
      <input type="checkbox" data-key="${storeKey}" ${checked} ${locked ? "disabled" : ""} />
    </label>`;
  }).join("");
}

function render() {
  const year = view.getFullYear();
  const month = view.getMonth();
  const days = daysInMonth(year, month);
  const now = new Date();
  const today = ymd(now);

  renderToday();
  renderTimetable();
  els.monthTitle.textContent = view.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  let head = `<tr><th class="act">Activity</th>`;
  for (let d = 1; d <= days; d++) {
    const key = `${year}-${pad(month + 1)}-${pad(d)}`;
    head += `<th class="${key === today ? "today" : ""}">${d}</th>`;
  }
  head += `</tr>`;
  els.thead.innerHTML = head;

  els.tbody.innerHTML = ACTIVITIES.map((a) => {
    const current = isCurrent(a.id, now) ? "current" : "";
    let row = `<tr class="${current}"><td class="act"><div class="activity ${a.kind}"><span class="name">${escapeHtml(a.name)}</span><span class="time">${escapeHtml(a.time)}</span></div></td>`;
    for (let d = 1; d <= days; d++) {
      const key = `${year}-${pad(month + 1)}-${pad(d)}`;
      const storeKey = `${key}:${a.id}`;
      const checked = data[storeKey] ? "checked" : "";
      const mode = boxMode(key, a, now);
      const locked = mode !== "open";
      const cellClass = [
        key === today ? "today" : "",
        mode === "frozen" ? "frozen" : "",
        mode === "future" ? "future" : "",
        mode === "open" ? "open" : "",
      ].filter(Boolean).join(" ");
      row += `<td class="${cellClass}"><input type="checkbox" data-key="${storeKey}" data-mode="${mode}" ${checked} ${locked ? "disabled" : ""} title="${mode === "open" ? "Open for 2 hours after this block ends" : mode === "future" ? "Not started yet" : "Frozen for the month"}" /></td>`;
    }
    row += `</tr>`;
    return row;
  }).join("");
}

function tickClock() {
  const now = new Date();
  els.clock.textContent = now.toLocaleTimeString(undefined, { hour12: false });
  els.todayLabel.textContent = now.toLocaleDateString(undefined, {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function showToast(msg) {
  els.toast.hidden = false;
  els.toast.textContent = msg;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { els.toast.hidden = true; }, 12000);
}

function notify(title, body) {
  showToast(`${title} — ${body}`);
  if ("Notification" in window && Notification.permission === "granted") {
    try { new Notification(title, { body, tag: title + body }); } catch (_) {}
  }
}

function checkReminders() {
  if (reminderLead === 0) return;
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const day = ymd(now);

  ACTIVITIES.forEach((a) => {
    const target = reminderMinutes(a, reminderLead);
    const diff = (mins - target + 24 * 60) % (24 * 60);
    if (diff <= 2) {
      const fid = `${day}:${a.id}`;
      if (fired[fid]) return;
      fired[fid] = true;
      save(FIRED_KEY, fired);
      notify(`Starts in ${reminderLead} min`, `${a.name} (${a.time})`);
    }
  });
}

function updateNotifyButton() {
  const on = "Notification" in window && Notification.permission === "granted";
  els.notifyBtn.textContent = on ? "Reminders on" : "Enable reminders";
  els.notifyBtn.classList.toggle("on", on);
  if (els.notifyBtnSettings) {
    els.notifyBtnSettings.textContent = on ? "Reminders on" : "Enable reminders";
    els.notifyBtnSettings.classList.toggle("on", on);
  }
  els.statusText.textContent = on
    ? `Browser notifications are enabled. Reminders fire ${reminderLead} min before each activity.`
    : "Click Enable reminders and keep this tab open so alerts can fire before each activity.";
}

async function enableNotify() {
  if (!("Notification" in window)) {
    els.statusBar.hidden = false;
    els.statusText.textContent = "This browser does not support notifications. On-screen toasts will still appear.";
    return;
  }
  const p = await Notification.requestPermission();
  updateNotifyButton();
  if (p === "granted") notify("Reminders enabled", "You will be alerted 15 minutes before each activity.");
}

document.getElementById("prevMonth").addEventListener("click", () => {
  view = new Date(view.getFullYear(), view.getMonth() - 1, 1);
  render();
});
document.getElementById("nextMonth").addEventListener("click", () => {
  view = new Date(view.getFullYear(), view.getMonth() + 1, 1);
  render();
});
function persist() {
  save(STORAGE_KEY, data);
}

function persistAndConfirm() {
  persist();
  showToast("Saved");
}

function onBoxChange(e) {
  const box = e.target.closest("input[type=checkbox]");
  if (!box || !box.dataset.key) return;
  const [dateKey, actId] = box.dataset.key.split(":");
  const act = ACTIVITIES.find((a) => a.id === actId);
  if (!act || boxMode(dateKey, act) !== "open") {
    box.checked = !!data[box.dataset.key];
    return;
  }
  if (box.checked) data[box.dataset.key] = true;
  else delete data[box.dataset.key];
  persist();
}

els.tbody.addEventListener("change", onBoxChange);
els.todayList.addEventListener("change", onBoxChange);
els.timetableList.addEventListener("change", onBoxChange);
els.saveBtn.addEventListener("click", persistAndConfirm);
els.settingsBtn.addEventListener("click", () => { els.settingsModal.hidden = false; });
els.closeSettings.addEventListener("click", () => { els.settingsModal.hidden = true; });
els.settingsModal.addEventListener("click", (e) => {
  if (e.target === els.settingsModal) els.settingsModal.hidden = true;
});
els.notifyBtn.addEventListener("click", enableNotify);
els.notifyBtnSettings.addEventListener("click", enableNotify);
const leadSelect = document.getElementById("reminderLeadTime");
leadSelect.value = String(reminderLead);
leadSelect.addEventListener("change", () => {
  reminderLead = Number(leadSelect.value);
  localStorage.setItem(REMIND_KEY, reminderLead);
  fired = {};
  save(FIRED_KEY, fired);
  showToast(reminderLead ? `Reminders set to ${reminderLead} min before` : "Reminders turned off");
});
els.statusBar.hidden = false;

const TYPES_KEY = "routine-types-v1";
const BASE_KINDS = ["sleep", "meal", "study", "free", "job", "exercise", "walk"];

function loadTypes() {
  try {
    const extra = JSON.parse(localStorage.getItem(TYPES_KEY));
    if (Array.isArray(extra)) {
      return [...BASE_KINDS, ...extra.filter((t) => t && !BASE_KINDS.includes(t))];
    }
  } catch (_) {}
  return [...BASE_KINDS];
}

let KINDS = loadTypes();

function slugType(name) {
  return name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "custom";
}

function addType() {
  const input = document.getElementById("newTypeInput");
  const raw = (input.value || "").trim();
  if (!raw) {
    showToast("Enter a type name");
    return;
  }
  const id = slugType(raw);
  if (KINDS.includes(id)) {
    showToast("Type already exists");
    return;
  }
  KINDS.push(id);
  const extra = KINDS.filter((k) => !BASE_KINDS.includes(k));
  localStorage.setItem(TYPES_KEY, JSON.stringify(extra));
  input.value = "";
  ACTIVITIES = readEditor();
  renderEditor();
  showToast("Saved");
}

function hmValue(h, m) {
  return `${pad(h)}:${pad(m)}`;
}

function parseHM(v) {
  const [h, m] = (v || "00:00").split(":").map(Number);
  return { h: h || 0, m: m || 0 };
}

function renderEditor() {
  if (!els.editorList) return;
  els.editorList.innerHTML = ACTIVITIES.map((a, i) => `
    <div class="ed-row" data-id="${a.id}">
      <label>Name<input type="text" data-f="name" value="${escapeHtml(a.name)}"></label>
      <label>Start<input type="time" data-f="start" value="${hmValue(a.startH, a.startM)}"></label>
      <label>End<input type="time" data-f="end" value="${hmValue(a.endH, a.endM)}"></label>
      <label>Type
        <select data-f="kind">
          ${KINDS.map((k) => `<option value="${escapeHtml(k)}" ${k === a.kind ? "selected" : ""}>${escapeHtml(k)}</option>`).join("")}
        </select>
      </label>
      <button type="button" class="ed-del" data-del="${i}" aria-label="Delete">✕</button>
    </div>
  `).join("");
}

function readEditor() {
  return [...els.editorList.querySelectorAll(".ed-row")].map((row) => {
    const start = parseHM(row.querySelector('[data-f="start"]').value);
    const end = parseHM(row.querySelector('[data-f="end"]').value);
    return normalizeAct({
      id: row.dataset.id,
      name: row.querySelector('[data-f="name"]').value.trim() || "Activity",
      startH: start.h, startM: start.m,
      endH: end.h, endM: end.m,
      kind: row.querySelector('[data-f="kind"]').value,
    });
  });
}

function saveTimetable() {
  const next = readEditor();
  if (!next.length) {
    showToast("Add at least one activity");
    return;
  }
  ACTIVITIES = next;
  localStorage.setItem(ACTS_KEY, JSON.stringify(ACTIVITIES));
  render();
  renderEditor();
  showToast("Saved");
}

function resetTimetable() {
  ACTIVITIES = DEFAULT_ACTIVITIES.map((a) => ({ ...a }));
  KINDS = [...BASE_KINDS];
  localStorage.removeItem(TYPES_KEY);
  localStorage.setItem(ACTS_KEY, JSON.stringify(ACTIVITIES));
  render();
  renderEditor();
  showToast("Saved");
}

function addActivity() {
  ACTIVITIES = readEditor();
  ACTIVITIES.push(normalizeAct({
    name: "New activity",
    startH: 12, startM: 0, endH: 13, endM: 0,
    kind: "free",
  }));
  renderEditor();
}

function openEditTab() {
  els.settingsModal.hidden = true;
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("on", t.dataset.tab === "edit"));
  ["today", "month", "edit", "setup"].forEach((id) => {
    document.getElementById(`panel-${id}`).hidden = id !== "edit";
  });
  els.saveBtn.hidden = true;
  renderEditor();
}

function buildIcs() {
  return buildCalendar(ACTIVITIES);
}

document.querySelectorAll(".ics-dl").forEach((a) => {
  a.addEventListener("click", (e) => {
    e.preventDefault();
    const blob = new Blob([buildIcs()], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const tmp = document.createElement("a");
    tmp.href = url;
    tmp.download = "routine.ics";
    tmp.click();
    URL.revokeObjectURL(url);
  });
});

if (els.addActivityBtn) els.addActivityBtn.addEventListener("click", addActivity);
document.getElementById("addTypeBtn").addEventListener("click", addType);
document.getElementById("newTypeInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") addType();
});
if (els.saveTimetableBtn) els.saveTimetableBtn.addEventListener("click", saveTimetable);
if (els.resetTimetableBtn) els.resetTimetableBtn.addEventListener("click", resetTimetable);
if (els.openEditBtn) els.openEditBtn.addEventListener("click", openEditTab);
els.editorList.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-del]");
  if (!btn) return;
  ACTIVITIES = readEditor();
  ACTIVITIES.splice(Number(btn.dataset.del), 1);
  renderEditor();
});

renderTimetable();
render();
renderEditor();
tickClock();
updateNotifyButton();
setInterval(() => {
  tickClock();
  checkReminders();
}, 1000);
setInterval(render, 30000);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) { checkReminders(); render(); }
});
