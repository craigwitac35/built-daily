/**
 * weight.js – Weight tracking with Supabase storage.
 *
 * Logs weight entries to `weights` table (one per user per day).
 * Displays weight history with change indicators.
 * Weight is stored and displayed in lbs.
 */

import { supabase } from './supabase.js';
import { requireAuth } from './auth.js';

// ── Helpers ────────────────────────────────────────────────────

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function showWeightAlert(message, type = 'error') {
  const el = document.getElementById('weight-alert');
  if (!el) return;
  el.textContent = message;
  el.className = `alert alert-${type} show`;
}

// ── Submit Weight ──────────────────────────────────────────────

async function handleWeightSubmit(event, user) {
  event.preventDefault();

  const weightLbs = parseFloat(document.getElementById('weight-input').value);

  if (isNaN(weightLbs) || weightLbs <= 0) {
    return showWeightAlert('Please enter a valid weight.');
  }
  if (weightLbs < 66 || weightLbs > 660) {
    return showWeightAlert('Please enter a realistic weight (66–660 lbs).');
  }

  const today = todayKey();

  // Check if an entry already exists for today
  const { data: existing } = await supabase
    .from('weights')
    .select('id')
    .eq('user_id', user.id)
    .eq('logged_at', today)
    .maybeSingle();

  let error;
  if (existing) {
    ({ error } = await supabase
      .from('weights')
      .update({ weight: weightLbs })
      .eq('id', existing.id));
  } else {
    ({ error } = await supabase
      .from('weights')
      .insert({
        user_id:   user.id,
        weight:    weightLbs,
        logged_at: today,
      }));
  }

  if (error) {
    return showWeightAlert(error.message);
  }

  showWeightAlert('Weight logged!', 'success');

  // Also update current_weight in profiles (stored in lbs)
  await supabase
    .from('profiles')
    .update({ current_weight: weightLbs })
    .eq('user_id', user.id);

  // Refresh history
  await loadWeightHistory(user);

  // Reset form
  event.target.reset();
}

// ── Load Weight History ────────────────────────────────────────

async function loadWeightHistory(user) {
  const { data, error } = await supabase
    .from('weights')
    .select('*')
    .eq('user_id', user.id)
    .order('logged_at', { ascending: false })
    .limit(30);

  if (error || !data) return;

  renderWeightHistory(data);
  renderWeightSummary(data, user);
}

// ── Render History List ────────────────────────────────────────

function renderWeightHistory(entries) {
  const list = document.getElementById('weight-history-list');
  if (!list) return;

  if (!entries || entries.length === 0) {
    list.innerHTML = `
      <li style="padding: var(--space-lg) 0; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; text-align: center;">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-muted);"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
        <span class="text-muted">No weight entries yet — log your first weigh-in above</span>
      </li>`;
    return;
  }

  list.innerHTML = entries
    .map((entry, i) => {
      const prev = entries[i + 1]; // Previous entry (older)
      let changeHtml = '';

      if (prev) {
        const diff = (entry.weight - prev.weight).toFixed(1);
        const sign = diff > 0 ? '+' : '';
        const cls  = diff < 0 ? 'change-down' : diff > 0 ? 'change-up' : 'change-flat';
        changeHtml = `<span class="weight-change ${cls}">${sign}${diff} lbs</span>`;
      }

      return `
        <li>
          <span class="date">${formatDate(entry.logged_at)}</span>
          <span class="weight-entry-value">
            <strong>${parseFloat(entry.weight).toFixed(1)} lbs</strong>
            ${changeHtml}
          </span>
        </li>
      `;
    })
    .join('');
}

// ── Render Weight Summary ──────────────────────────────────────

async function renderWeightSummary(entries, user) {
  if (!entries || entries.length === 0) return;

  // Current weight (most recent entry, in lbs)
  const current = parseFloat(entries[0].weight);
  const currentEl = document.getElementById('weight-current');
  if (currentEl) currentEl.textContent = current.toFixed(1);

  // Goal weight from profile (stored in lbs)
  const { data: profile } = await supabase
    .from('profiles')
    .select('goal_weight')
    .eq('user_id', user.id)
    .single();

  if (profile && profile.goal_weight) {
    const goal = parseFloat(profile.goal_weight);
    const goalEl = document.getElementById('weight-goal');
    if (goalEl) goalEl.textContent = goal.toFixed(1);

    const remainingEl = document.getElementById('weight-remaining');
    if (remainingEl) {
      const diff = Math.abs(current - goal).toFixed(1);
      remainingEl.textContent = diff;
    }
  }

  // Total change (first entry vs most recent)
  if (entries.length >= 2) {
    const oldest = parseFloat(entries[entries.length - 1].weight);
    const totalChange = (current - oldest).toFixed(1);
    const sign = totalChange > 0 ? '+' : '';
    const totalEl = document.getElementById('weight-total-change');
    if (totalEl) totalEl.textContent = `${sign}${totalChange} lbs`;
  }

  // Pre-fill today's weight if it exists
  const todayEntry = entries.find(e => e.logged_at === todayKey());
  if (todayEntry) {
    const input = document.getElementById('weight-input');
    if (input) input.value = parseFloat(todayEntry.weight).toFixed(1);
  }
}

// ── Init ───────────────────────────────────────────────────────

async function init() {
  const user = await requireAuth();
  if (!user) return;

  await loadWeightHistory(user);

  const weightForm = document.getElementById('weight-form');
  if (weightForm) {
    weightForm.addEventListener('submit', (e) => handleWeightSubmit(e, user));
  }
}

init();
