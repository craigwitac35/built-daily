/**
 * profile.js – Profile setup helpers.
 *
 * Saves user body data to localStorage (placeholder) and
 * calculates a daily calorie target using the
 * Mifflin–St Jeor equation + activity multiplier.
 */

'use strict';

// ── Activity multipliers (Mifflin–St Jeor) ─────────────────────
const ACTIVITY_MULTIPLIERS = {
  sedentary:    1.2,   // little / no exercise
  light:        1.375, // 1–3 days / week
  moderate:     1.55,  // 3–5 days / week
  active:       1.725, // 6–7 days / week
  'very-active': 1.9,  // hard exercise + physical job
};

// ── Calorie Calculation ────────────────────────────────────────

/**
 * Calculate Basal Metabolic Rate using Mifflin–St Jeor.
 * @param {'male'|'female'} sex
 * @param {number} weightKg
 * @param {number} heightCm
 * @param {number} age
 * @returns {number} BMR in kcal/day
 */
function calculateBMR(sex, weightKg, heightCm, age) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

/**
 * Calculate Total Daily Energy Expenditure (maintenance calories).
 * @param {'male'|'female'} sex
 * @param {number} weightKg
 * @param {number} heightCm
 * @param {number} age
 * @param {string} activityLevel
 * @returns {number} TDEE rounded to nearest whole number
 */
function calculateTDEE(sex, weightKg, heightCm, age, activityLevel) {
  const bmr        = calculateBMR(sex, weightKg, heightCm, age);
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.2;
  return Math.round(bmr * multiplier);
}

/**
 * Derive a calorie target adjusted for goal weight.
 * – Deficit of ~500 kcal/day to lose ~0.5 kg/week
 * – Surplus of ~300 kcal/day to gain muscle
 * @param {number} tdee
 * @param {number} currentWeightKg
 * @param {number} goalWeightKg
 * @returns {number} adjusted daily calorie target
 */
function calculateCalorieTarget(tdee, currentWeightKg, goalWeightKg) {
  if (goalWeightKg < currentWeightKg) return tdee - 500;  // cut
  if (goalWeightKg > currentWeightKg) return tdee + 300;  // bulk
  return tdee;                                             // maintain
}

// ── Profile Save ───────────────────────────────────────────────

/**
 * Collect form data, compute calorie target, and persist to
 * localStorage (swap for a real API / Supabase call later).
 * @param {Event} event – form submit event
 */
function handleProfileSave(event) {
  event.preventDefault();

  const age            = parseInt(document.getElementById('age').value, 10);
  const sex            = document.getElementById('sex').value;
  const heightCm       = parseFloat(document.getElementById('height').value);
  const currentWeight  = parseFloat(document.getElementById('current-weight').value);
  const goalWeight     = parseFloat(document.getElementById('goal-weight').value);
  const activityLevel  = document.getElementById('activity-level').value;

  // Validation
  if ([age, heightCm, currentWeight, goalWeight].some(isNaN)) {
    showProfileAlert('Please fill in all fields with valid numbers.', 'error');
    return;
  }
  if (age < 10 || age > 120) {
    showProfileAlert('Please enter a realistic age.', 'error');
    return;
  }

  const tdee    = calculateTDEE(sex, currentWeight, heightCm, age, activityLevel);
  const target  = calculateCalorieTarget(tdee, currentWeight, goalWeight);

  const profile = { age, sex, heightCm, currentWeight, goalWeight, activityLevel, tdee, calorieTarget: target };

  // TODO: persist to backend, e.g. Supabase `profiles` table
  localStorage.setItem('bd_profile', JSON.stringify(profile));
  console.log('Profile saved:', profile);

  showProfileAlert(
    `Profile saved! Your daily calorie target is ${target} kcal.`,
    'success'
  );

  // Populate calorie target display if present
  const targetEl = document.getElementById('calorie-target-display');
  if (targetEl) {
    targetEl.textContent = `Your daily calorie target: ${target} kcal`;
    targetEl.style.display = '';
  }

  setTimeout(() => { window.location.href = 'dashboard.html'; }, 2000);
}

// ── Helpers ────────────────────────────────────────────────────

function showProfileAlert(message, type = 'error') {
  const el = document.getElementById('profile-alert');
  if (!el) return;
  el.textContent = message;
  el.className = `alert alert-${type} show`;
}

/** Pre-fill form with stored profile data (if any). */
function loadProfileData() {
  const stored = localStorage.getItem('bd_profile');
  if (!stored) return;

  try {
    const profile = JSON.parse(stored);
    const fields  = ['age', 'sex', 'height', 'current-weight', 'goal-weight', 'activity-level'];
    const keys    = ['age', 'sex', 'heightCm', 'currentWeight', 'goalWeight', 'activityLevel'];

    fields.forEach((id, i) => {
      const el = document.getElementById(id);
      if (el && profile[keys[i]] !== undefined) el.value = profile[keys[i]];
    });

    const targetEl = document.getElementById('calorie-target-display');
    if (targetEl && profile.calorieTarget) targetEl.textContent = profile.calorieTarget;
  } catch (e) {
    console.warn('Could not load profile data:', e);
  }
}

// ── Event Binding ──────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  loadProfileData();

  const profileForm = document.getElementById('profile-form');
  if (profileForm) profileForm.addEventListener('submit', handleProfileSave);
});
