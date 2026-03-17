/**
 * profile.js – Profile setup with Supabase storage.
 *
 * Saves user body data to Supabase `profiles` table and
 * calculates a daily calorie target using the
 * Mifflin–St Jeor equation + activity multiplier.
 *
 * Height is stored as total inches; weight is stored as lbs.
 * Both are converted to metric internally for BMR calculations.
 */

import { supabase } from './supabase.js';
import { requireAuth } from './auth.js';

// ── Activity multipliers (Mifflin–St Jeor) ─────────────────────
const ACTIVITY_MULTIPLIERS = {
  sedentary:     1.2,
  light:         1.375,
  moderate:      1.55,
  active:        1.725,
  'very-active': 1.9,
};

// ── Unit Conversion ────────────────────────────────────────────

const LBS_PER_KG  = 2.20462;
const CM_PER_INCH = 2.54;

function lbsToKg(lbs) {
  return lbs / LBS_PER_KG;
}

function inchesToCm(inches) {
  return inches * CM_PER_INCH;
}

// ── Calorie Calculation ────────────────────────────────────────

function calculateBMR(sex, weightKg, heightCm, age) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

function calculateTDEE(sex, weightKg, heightCm, age, activityLevel) {
  const bmr        = calculateBMR(sex, weightKg, heightCm, age);
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.2;
  return Math.round(bmr * multiplier);
}

function calculateCalorieTarget(tdee, currentWeightLbs, goalWeightLbs) {
  if (goalWeightLbs < currentWeightLbs) return tdee - 500;  // cut
  if (goalWeightLbs > currentWeightLbs) return tdee + 300;  // bulk
  return tdee;                                               // maintain
}

// ── Alert Helper ───────────────────────────────────────────────

function showProfileAlert(message, type = 'error') {
  const el = document.getElementById('profile-alert');
  if (!el) return;
  el.textContent = message;
  el.className = `alert alert-${type} show`;
}

// ── Profile Save ───────────────────────────────────────────────

async function handleProfileSave(event, user) {
  event.preventDefault();

  const age           = parseInt(document.getElementById('age').value, 10);
  const sex           = document.getElementById('sex').value;
  const heightFt      = parseInt(document.getElementById('height-ft').value, 10);
  const heightIn      = parseInt(document.getElementById('height-in').value, 10);
  const currentWeight = parseFloat(document.getElementById('current-weight').value);
  const goalWeight    = parseFloat(document.getElementById('goal-weight').value);
  const activityLevel = document.getElementById('activity-level').value;

  // Validation
  if ([age, heightFt, heightIn, currentWeight, goalWeight].some(isNaN)) {
    return showProfileAlert('Please fill in all fields with valid numbers.');
  }
  if (!sex) {
    return showProfileAlert('Please select your sex.');
  }
  if (!activityLevel) {
    return showProfileAlert('Please select your activity level.');
  }
  if (age < 10 || age > 120) {
    return showProfileAlert('Please enter a realistic age.');
  }
  if (heightIn < 0 || heightIn > 11) {
    return showProfileAlert('Inches must be between 0 and 11.');
  }

  // Height stored as total inches
  const totalInches = heightFt * 12 + heightIn;

  // Convert to metric for BMR/TDEE calculation
  const weightKg  = lbsToKg(currentWeight);
  const heightCm  = inchesToCm(totalInches);

  const tdee   = calculateTDEE(sex, weightKg, heightCm, age, activityLevel);
  const target = calculateCalorieTarget(tdee, currentWeight, goalWeight);

  // Upsert to Supabase (height in inches, weights in lbs)
  const { error } = await supabase
    .from('profiles')
    .upsert({
      user_id:        user.id,
      age,
      sex,
      height:         totalInches,
      current_weight: currentWeight,
      goal_weight:    goalWeight,
      activity_level: activityLevel,
      calorie_target: target
    });

  if (error) {
    return showProfileAlert(error.message);
  }

  showProfileAlert(`Profile saved! Your daily calorie target is ${target} kcal.`, 'success');

  // Show calorie target display
  const targetEl = document.getElementById('calorie-target-display');
  if (targetEl) {
    targetEl.textContent = `Your daily calorie target: ${target} kcal`;
    targetEl.style.display = 'block';
  }

  setTimeout(() => {
    window.location.href = 'dashboard.html';
  }, 2000);
}

// ── Pre-fill from Supabase ─────────────────────────────────────

async function loadProfileData(user) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error || !data) return;

  // Age, sex, activity level set directly
  const simpleFields = {
    'age':            data.age,
    'sex':            data.sex,
    'activity-level': data.activity_level,
  };

  for (const [id, value] of Object.entries(simpleFields)) {
    const el = document.getElementById(id);
    if (el && value !== null && value !== undefined) {
      el.value = value;
    }
  }

  // Height stored as total inches → split into feet and inches
  if (data.height !== null && data.height !== undefined) {
    const totalInches = Math.round(data.height);
    const ft = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    const ftEl = document.getElementById('height-ft');
    const inEl = document.getElementById('height-in');
    if (ftEl) ftEl.value = ft;
    if (inEl) inEl.value = inches;
  }

  // Weight fields stored in lbs
  const weightFields = {
    'current-weight': data.current_weight,
    'goal-weight':    data.goal_weight,
  };

  for (const [id, value] of Object.entries(weightFields)) {
    const el = document.getElementById(id);
    if (el && value !== null && value !== undefined) {
      el.value = parseFloat(value).toFixed(1);
    }
  }

  // Show existing calorie target
  if (data.calorie_target) {
    const targetEl = document.getElementById('calorie-target-display');
    if (targetEl) {
      targetEl.textContent = `Your daily calorie target: ${data.calorie_target} kcal`;
      targetEl.style.display = 'block';
    }
  }
}

// ── Init ───────────────────────────────────────────────────────

async function init() {
  const user = await requireAuth();
  if (!user) return;

  await loadProfileData(user);

  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', (e) => handleProfileSave(e, user));
  }
}

init();
