/**
 * log.js – Daily nutrition log with Supabase storage.
 *
 * Persists daily entries to Supabase `daily_logs` table,
 * keyed by (user_id, log_date) unique constraint.
 */

import { supabase } from './supabase.js';
import { requireAuth } from './auth.js';

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

async function handleLogSubmit(event, user) {
  event.preventDefault();

  const calories = parseFloat(document.getElementById('log-calories').value);
  const protein  = parseFloat(document.getElementById('log-protein').value);
  const carbs    = parseFloat(document.getElementById('log-carbs').value);
  const fat      = parseFloat(document.getElementById('log-fat').value);
  const water    = parseFloat(document.getElementById('log-water').value);

  // Validate
  if ([calories, protein, carbs, fat, water].some(isNaN)) {
    return showLogAlert('Please fill in all fields with valid numbers.');
  }
  if (calories < 0 || protein < 0 || carbs < 0 || fat < 0 || water < 0) {
    return showLogAlert('Values cannot be negative.');
  }

  // Upsert to Supabase (one entry per user per day)
  const { error } = await supabase
    .from('daily_logs')
    .upsert(
      {
        user_id:  user.id,
        log_date: todayKey(),
        calories: Math.round(calories),
        protein:  Math.round(protein),
        carbs:    Math.round(carbs),
        fat:      Math.round(fat),
        water:    Math.round(water),
      },
      { onConflict: 'user_id,log_date' }
    );

  if (error) {
    return showLogAlert(error.message);
  }

  showLogAlert('Daily log saved!', 'success');

  // Show remaining calories
  await updateCalorieRemaining(user, Math.round(calories));

  // Redirect to dashboard after short delay
  setTimeout(() => {
    window.location.href = 'dashboard.html';
  }, 1500);
}

// ── Calorie Remaining ──────────────────────────────────────────

async function updateCalorieRemaining(user, loggedCalories) {
  const remainingEl = document.getElementById('calories-remaining');
  if (!remainingEl) return;

  const { data: profile } = await supabase
    .from('profiles')
    .select('calorie_target')
    .eq('user_id', user.id)
    .single();

  if (profile && profile.calorie_target) {
    const remaining = Math.max(0, profile.calorie_target - loggedCalories);
    remainingEl.textContent = `${remaining} calories remaining today`;
    remainingEl.style.display = 'block';
  }
}

// ── Pre-fill Today's Log ───────────────────────────────────────

async function loadTodayLog(user) {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', user.id)
    .eq('log_date', todayKey())
    .single();

  if (error || !data) return;

  const fieldMap = {
    'log-calories': data.calories,
    'log-protein':  data.protein,
    'log-carbs':    data.carbs,
    'log-fat':      data.fat,
    'log-water':    data.water,
  };

  for (const [id, value] of Object.entries(fieldMap)) {
    const el = document.getElementById(id);
    if (el && value !== null && value !== undefined) {
      el.value = value;
    }
  }
}

// ── Show Calorie Target Info ───────────────────────────────────

async function showCalorieTarget(user) {
  const targetEl = document.getElementById('calorie-target-info');
  if (!targetEl) return;

  const { data: profile } = await supabase
    .from('profiles')
    .select('calorie_target')
    .eq('user_id', user.id)
    .single();

  if (profile && profile.calorie_target) {
    targetEl.textContent = `Daily target: ${profile.calorie_target} kcal`;
  }
}

// ── Init ───────────────────────────────────────────────────────

async function init() {
  const user = await requireAuth();
  if (!user) return;

  await showCalorieTarget(user);
  await loadTodayLog(user);

  const logForm = document.getElementById('log-form');
  if (logForm) {
    logForm.addEventListener('submit', (e) => handleLogSubmit(e, user));
  }
}

init();
