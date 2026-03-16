/**
 * log.js – Daily nutrition log helpers.
 *
 * Persists daily entries to localStorage keyed by date
 * (swap for a real API / Supabase insert when ready).
 */

'use strict';

// ── Helpers ────────────────────────────────────────────────────

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function showLogAlert(message, type = 'error') {
  const el = document.getElementById('log-alert');
  if (!el) return;
  el.textContent = message;
  el.className = `alert alert-${type} show`;
}

// ── Submit Log ─────────────────────────────────────────────────

/**
 * Validate and save today's nutrition log entry.
 * @param {Event} event – form submit event
 */
function handleLogSubmit(event) {
  event.preventDefault();

  const calories = parseFloat(document.getElementById('log-calories').value);
  const protein  = parseFloat(document.getElementById('log-protein').value);
  const carbs    = parseFloat(document.getElementById('log-carbs').value);
  const fat      = parseFloat(document.getElementById('log-fat').value);
  const water    = parseFloat(document.getElementById('log-water').value);

  // Validate
  if ([calories, protein, carbs, fat, water].some(isNaN)) {
    showLogAlert('Please fill in all fields with valid numbers.');
    return;
  }
  if (calories < 0 || protein < 0 || carbs < 0 || fat < 0 || water < 0) {
    showLogAlert('Values cannot be negative.');
    return;
  }

  const entry = { calories, protein, carbs, fat, water, loggedAt: new Date().toISOString() };

  // TODO: insert into backend, e.g. Supabase `daily_logs` table
  saveLogEntry(todayKey(), entry);
  console.log('Log saved:', entry);

  showLogAlert('Daily log saved! 🎉', 'success');

  // Update live calorie remaining display (if present)
  updateCalorieRemaining(calories);

  // Reset form
  event.target.reset();

  setTimeout(() => {
    window.location.href = 'dashboard.html';
  }, 1500);
}

// ── Persistence ────────────────────────────────────────────────

/**
 * Save (or overwrite) the log entry for the given date key.
 * @param {string} dateKey – 'YYYY-MM-DD'
 * @param {Object} entry
 */
function saveLogEntry(dateKey, entry) {
  let logs = {};
  try {
    logs = JSON.parse(localStorage.getItem('bd_logs')) || {};
  } catch {
    logs = {};
  }
  logs[dateKey] = entry;
  localStorage.setItem('bd_logs', JSON.stringify(logs));
}

// ── Live Preview ───────────────────────────────────────────────

/** Update a "calories remaining" badge on the log page. */
function updateCalorieRemaining(loggedCalories) {
  const remainingEl = document.getElementById('calories-remaining');
  if (!remainingEl) return;

  try {
    const profile = JSON.parse(localStorage.getItem('bd_profile')) || {};
    const target  = profile.calorieTarget || 2000;
    remainingEl.textContent = Math.max(0, target - loggedCalories);
  } catch {
    // Silently ignore
  }
}

/** Pre-fill today's form if an entry already exists. */
function loadTodayLog() {
  let logs = {};
  try {
    logs = JSON.parse(localStorage.getItem('bd_logs')) || {};
  } catch {
    logs = {};
  }
  const entry = logs[todayKey()];
  if (!entry) return;

  const fields = ['calories', 'protein', 'carbs', 'fat', 'water'];
  fields.forEach(field => {
    const el = document.getElementById(`log-${field}`);
    if (el && entry[field] !== undefined) el.value = entry[field];
  });
}

/** Show the user's calorie target on the log page. */
function showCalorieTarget() {
  const targetEl = document.getElementById('calorie-target-info');
  if (!targetEl) return;
  try {
    const profile = JSON.parse(localStorage.getItem('bd_profile')) || {};
    if (profile.calorieTarget) targetEl.textContent = `Daily target: ${profile.calorieTarget} kcal`;
  } catch {
    // Silently ignore
  }
}

// ── Event Binding ──────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  showCalorieTarget();
  loadTodayLog();

  const logForm = document.getElementById('log-form');
  if (logForm) logForm.addEventListener('submit', handleLogSubmit);
});
