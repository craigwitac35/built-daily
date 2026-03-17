/**
 * dashboard.js – Dashboard with Supabase data.
 *
 * Phase 2: Adds weight progress, weekly summary,
 * consistency score, and best streak tracking.
 */

import { supabase } from './supabase.js';
import { requireAuth } from './auth.js';

// ── Helpers ────────────────────────────────────────────────────

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysAgoKey(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

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

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Data Fetching ──────────────────────────────────────────────

async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) return null;
  return data;
}

async function getTodayLog(userId) {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('log_date', todayKey())
    .single();

  if (error) return { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0 };
  return data;
}

async function getRecentLogs(userId, limit = 30) {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .order('log_date', { ascending: false })
    .limit(limit);

  if (error) return [];
  return data;
}

async function getRecentWeights(userId, limit = 30) {
  const { data, error } = await supabase
    .from('weights')
    .select('*')
    .eq('user_id', userId)
    .order('logged_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return data;
}

// ── Streak Calculations ────────────────────────────────────────

function calculateCurrentStreak(logs) {
  if (!logs || logs.length === 0) return 0;

  const dateSet = new Set(logs.map(l => l.log_date));
  let streak = 0;
  const date = new Date();

  while (true) {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    if (!dateSet.has(key)) break;
    streak++;
    date.setDate(date.getDate() - 1);
  }

  return streak;
}

function calculateBestStreak(logs) {
  if (!logs || logs.length === 0) return 0;

  const sorted = [...logs].sort((a, b) => a.log_date.localeCompare(b.log_date));
  let best = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].log_date);
    const curr = new Date(sorted[i].log_date);
    const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      current++;
      if (current > best) best = current;
    } else if (diffDays > 1) {
      current = 1;
    }
  }

  return best;
}

// ── Weekly Summary Calculation ─────────────────────────────────

function calculateWeeklySummary(logs) {
  const sevenDaysAgo = daysAgoKey(6);
  const weekLogs = logs.filter(l => l.log_date >= sevenDaysAgo);

  if (weekLogs.length === 0) {
    return {
      daysLogged: 0,
      avgCalories: 0,
      avgProtein: 0,
      avgCarbs: 0,
      avgFat: 0,
    };
  }

  const sum = (arr, key) => arr.reduce((s, l) => s + (l[key] || 0), 0);
  const count = weekLogs.length;

  return {
    daysLogged:  count,
    avgCalories: Math.round(sum(weekLogs, 'calories') / count),
    avgProtein:  Math.round(sum(weekLogs, 'protein') / count),
    avgCarbs:    Math.round(sum(weekLogs, 'carbs') / count),
    avgFat:      Math.round(sum(weekLogs, 'fat') / count),
  };
}

// ── Consistency Score ──────────────────────────────────────────

function calculateConsistency(logs) {
  const sevenDaysAgo = daysAgoKey(6);
  const weekLogs = logs.filter(l => l.log_date >= sevenDaysAgo);
  return Math.round((weekLogs.length / 7) * 100);
}

function getConsistencyLabel(score) {
  if (score === 100) return 'Locked in';
  if (score >= 71)  return 'Strong';
  if (score >= 43)  return 'Slipping';
  return 'Reset needed';
}

// ── Dashboard Render ───────────────────────────────────────────

async function renderDashboard(user) {
  const [profile, todayLog, recentLogs, recentWeights] = await Promise.all([
    getProfile(user.id),
    getTodayLog(user.id),
    getRecentLogs(user.id, 30),
    getRecentWeights(user.id, 30),
  ]);

  const target = profile?.calorie_target || 2000;

  updateText('dash-greeting', getGreeting());

  updateText('dash-calories-target',    target);
  updateText('dash-calories-consumed',  todayLog.calories);
  updateText('dash-calories-remaining', Math.max(0, target - todayLog.calories));
  setProgressBar('dash-calories-bar', todayLog.calories, target);

  updateText('dash-protein', todayLog.protein);
  updateText('dash-carbs',   todayLog.carbs);
  updateText('dash-fat',     todayLog.fat);

  updateText('dash-water', todayLog.water);
  setProgressBar('dash-water-bar', todayLog.water, 8);

  const currentStreak = calculateCurrentStreak(recentLogs);
  const bestStreak    = calculateBestStreak(recentLogs);
  updateText('dash-streak',      currentStreak);
  updateText('dash-best-streak', bestStreak);

  const consistency = calculateConsistency(recentLogs);
  updateText('dash-consistency', `${consistency}%`);
  updateText('dash-consistency-label', getConsistencyLabel(consistency));
  setProgressBar('dash-consistency-bar', consistency, 100);

  renderWeightProgress(recentWeights, profile);

  const weekly = calculateWeeklySummary(recentLogs);
  updateText('dash-week-days',     `${weekly.daysLogged}/7`);
  updateText('dash-week-calories', weekly.avgCalories);
  updateText('dash-week-protein',  weekly.avgProtein);
  updateText('dash-week-carbs',    weekly.avgCarbs);
  updateText('dash-week-fat',      weekly.avgFat);

  renderRecentLogs(recentLogs.slice(0, 7));
}

function renderWeightProgress(weights, profile) {
  if (!weights || weights.length === 0) {
    updateText('dash-weight-current', '–');
    updateText('dash-weight-goal', profile?.goal_weight ? parseFloat(profile.goal_weight).toFixed(1) : '–');
    updateText('dash-weight-change', '–');
    return;
  }

  const current = parseFloat(weights[0].weight);
  updateText('dash-weight-current', current.toFixed(1));

  if (profile?.goal_weight) {
    const goal = parseFloat(profile.goal_weight);
    updateText('dash-weight-goal', goal.toFixed(1));

    const remaining = Math.abs(current - goal).toFixed(1);
    updateText('dash-weight-remaining', remaining);
  }

  const sevenDaysAgo = daysAgoKey(7);
  const olderEntry = weights.find(w => w.logged_at <= sevenDaysAgo);
  if (olderEntry) {
    const change = (current - parseFloat(olderEntry.weight)).toFixed(1);
    const sign = change > 0 ? '+' : '';
    updateText('dash-weight-change', `${sign}${change} lbs`);
  } else if (weights.length >= 2) {
    const oldest = parseFloat(weights[weights.length - 1].weight);
    const change = (current - oldest).toFixed(1);
    const sign = change > 0 ? '+' : '';
    updateText('dash-weight-change', `${sign}${change} lbs`);
  }
}

function renderRecentLogs(logs) {
  const list = document.getElementById('recent-logs-list');
  if (!list) return;

  if (!logs || logs.length === 0) {
    list.innerHTML = `
      <li style="padding: var(--space-lg) 0; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; text-align: center;">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-muted);"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        <span class="text-muted">No meals logged yet today</span>
      </li>`;
    return;
  }

  list.innerHTML = logs
    .map(entry => `
      <li>
        <span class="date">${formatDate(entry.log_date)}</span>
        <span>${entry.calories} kcal &nbsp;·&nbsp; P: ${entry.protein}g &nbsp;·&nbsp; C: ${entry.carbs}g &nbsp;·&nbsp; F: ${entry.fat}g</span>
      </li>
    `)
    .join('');
}

async function init() {
  const user = await requireAuth();
  if (!user) return;

  await renderDashboard(user);
}

init();