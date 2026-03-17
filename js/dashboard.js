/**
 * dashboard.js – Dashboard with Supabase data.
 *
 * Reads profile and daily logs from Supabase to populate
 * all dashboard stat cards, progress bars, and recent logs.
 */

import { supabase } from './supabase.js';
import { requireAuth } from './auth.js';

// ── Helpers ────────────────────────────────────────────────────

function todayKey() {
  return new Date().toISOString().slice(0, 10);
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

async function getRecentLogs(userId, limit = 7) {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .order('log_date', { ascending: false })
    .limit(limit);

  if (error) return [];
  return data;
}

// ── Streak Calculation ─────────────────────────────────────────

function calculateStreak(logs) {
  if (!logs || logs.length === 0) return 0;

  // Sort descending by date
  const sorted = [...logs].sort((a, b) => b.log_date.localeCompare(a.log_date));
  const dateSet = new Set(sorted.map(l => l.log_date));

  let streak = 0;
  const date = new Date();

  while (true) {
    const key = date.toISOString().slice(0, 10);
    if (!dateSet.has(key)) break;
    streak++;
    date.setDate(date.getDate() - 1);
  }

  return streak;
}

// ── Dashboard Render ───────────────────────────────────────────

async function renderDashboard(user) {
  const profile   = await getProfile(user.id);
  const todayLog  = await getTodayLog(user.id);
  const recentLogs = await getRecentLogs(user.id, 30); // Get more for streak calc

  const target = profile?.calorie_target || 2000;

  // Greeting
  updateText('dash-greeting', getGreeting());

  // Calorie stats
  updateText('dash-calories-target',    target);
  updateText('dash-calories-consumed',  todayLog.calories);
  updateText('dash-calories-remaining', Math.max(0, target - todayLog.calories));
  setProgressBar('dash-calories-bar', todayLog.calories, target);

  // Macros
  updateText('dash-protein', todayLog.protein);
  updateText('dash-carbs',   todayLog.carbs);
  updateText('dash-fat',     todayLog.fat);

  // Water
  updateText('dash-water', todayLog.water);
  setProgressBar('dash-water-bar', todayLog.water, 8);

  // Streak
  updateText('dash-streak', calculateStreak(recentLogs));

  // Recent logs list (show last 7)
  renderRecentLogs(recentLogs.slice(0, 7));
}

// ── Recent Logs Render ─────────────────────────────────────────

function renderRecentLogs(logs) {
  const list = document.getElementById('recent-logs-list');
  if (!list) return;

  if (!logs || logs.length === 0) {
    list.innerHTML = '<li class="text-muted" style="padding:0.85rem 0">No logs yet – start logging today!</li>';
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

// ── Init ───────────────────────────────────────────────────────

async function init() {
  const user = await requireAuth();
  if (!user) return;

  await renderDashboard(user);
}

init();
