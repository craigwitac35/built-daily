/**
 * dashboard.js – Dashboard summary helpers.
 *
 * Reads today's log and profile data from localStorage
 * (swap for a real API / Supabase query when ready).
 */

'use strict';

// ── Data Helpers ───────────────────────────────────────────────

/** Return today's date string in YYYY-MM-DD format. */
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/** Load the user profile stored by profile.js. */
function getProfile() {
  try {
    return JSON.parse(localStorage.getItem('bd_profile')) || {};
  } catch {
    return {};
  }
}

/** Load all log entries stored by log.js. */
function getAllLogs() {
  try {
    return JSON.parse(localStorage.getItem('bd_logs')) || {};
  } catch {
    return {};
  }
}

/** Return the log entry for a given date key, or empty defaults. */
function getLogForDate(dateKey) {
  const logs = getAllLogs();
  return logs[dateKey] || { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0 };
}

// ── Dashboard Render ───────────────────────────────────────────

/**
 * Populate all dashboard stat cards and progress bars.
 * Called automatically on DOMContentLoaded.
 */
function renderDashboard() {
  const profile   = getProfile();
  const todayLog  = getLogForDate(todayKey());
  const allLogs   = getAllLogs();
  const target    = profile.calorieTarget || 2000;

  // ── Welcome message
  updateText('dash-greeting', getGreeting());

  // ── Calorie stats
  updateText('dash-calories-consumed', todayLog.calories);
  updateText('dash-calories-target',   target);
  updateText('dash-calories-remaining', Math.max(0, target - todayLog.calories));
  setProgressBar('dash-calories-bar', todayLog.calories, target);

  // ── Macro stats
  updateText('dash-protein', todayLog.protein);
  updateText('dash-carbs',   todayLog.carbs);
  updateText('dash-fat',     todayLog.fat);

  // ── Water
  updateText('dash-water', todayLog.water);
  setProgressBar('dash-water-bar', todayLog.water, 8); // 8 glasses default goal

  // ── Streak
  updateText('dash-streak', calculateStreak(allLogs));

  // ── Recent logs list
  renderRecentLogs(allLogs);
}

// ── Helpers ────────────────────────────────────────────────────

function updateText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value !== undefined ? value : '–';
}

function setProgressBar(id, value, max) {
  const bar = document.getElementById(id);
  if (!bar || !max) return;
  const pct = Math.min(100, Math.round((value / max) * 100));
  bar.style.width = `${pct}%`;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning 👋';
  if (hour < 18) return 'Good afternoon 👋';
  return 'Good evening 👋';
}

/**
 * Count consecutive days (ending today) that have a log entry.
 * @param {Object} logs – { 'YYYY-MM-DD': { ... } }
 * @returns {number}
 */
function calculateStreak(logs) {
  let streak = 0;
  const date = new Date();

  while (true) {
    const key = date.toISOString().slice(0, 10);
    if (!logs[key]) break;
    streak++;
    date.setDate(date.getDate() - 1);
  }

  return streak;
}

/** Render the 7 most-recent log entries into #recent-logs-list. */
function renderRecentLogs(logs) {
  const list = document.getElementById('recent-logs-list');
  if (!list) return;

  const entries = Object.entries(logs)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 7);

  if (entries.length === 0) {
    list.innerHTML = '<li class="text-muted" style="padding:0.85rem 0">No logs yet – start logging today!</li>';
    return;
  }

  list.innerHTML = entries
    .map(([date, entry]) => `
      <li>
        <span class="date">${formatDate(date)}</span>
        <span>${entry.calories} kcal &nbsp;·&nbsp; P: ${entry.protein}g &nbsp;·&nbsp; C: ${entry.carbs}g &nbsp;·&nbsp; F: ${entry.fat}g</span>
      </li>
    `)
    .join('');
}

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Event Binding ──────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', renderDashboard);
