/**
 * weight.js – Weight tracking with Supabase storage.
 *
 * Logs weight entries to `weights` table (one per user per day).
 * Displays weight history with change indicators.
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

  const weight = parseFloat(document.getElementById('weight-input').value);

  if (isNaN(weight) || weight <= 0) {
    return showWeightAlert('Please enter a valid weight.');
  }
  if (weight < 30 || weight > 300) {
    return showWeightAlert('Please enter a realistic weight (30–300 kg).');
  }

  const { error } = await supabase
    .from('weights')
    .upsert(
      {
        user_id: user.id,
        weight:  weight,
        date:    todayKey(),
      },
      { onConflict: 'user_id,date' }
    );

  if (error) {
    return showWeightAlert(error.message);
  }

  showWeightAlert('Weight logged!', 'success');

  // Also update current_weight in profiles
  await supabase
    .from('profiles')
    .update({ current_weight: weight })
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
    .order('date', { ascending: false })
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
    list.innerHTML = '<li class="text-muted" style="padding:0.85rem 0">No weight entries yet. Start logging today.</li>';
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
        changeHtml = `<span class="weight-change ${cls}">${sign}${diff} kg</span>`;
      }

      return `
        <li>
          <span class="date">${formatDate(entry.date)}</span>
          <span class="weight-entry-value">
            <strong>${parseFloat(entry.weight).toFixed(1)} kg</strong>
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

  // Current weight (most recent entry)
  const current = parseFloat(entries[0].weight);
  const currentEl = document.getElementById('weight-current');
  if (currentEl) currentEl.textContent = current.toFixed(1);

  // Goal weight from profile
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
    if (totalEl) totalEl.textContent = `${sign}${totalChange} kg`;
  }

  // Pre-fill today's weight if it exists
  const todayEntry = entries.find(e => e.date === todayKey());
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
