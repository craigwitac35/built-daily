/**
 * auth.js – Authentication (signup, login, logout, route guard).
 *
 * Uses Supabase Auth. Keeps the alert UI system for inline
 * error/success messages instead of browser alerts.
 */

import { supabase } from './supabase.js';

// ── Helpers ────────────────────────────────────────────────────

function showAlert(id, message, type = 'error') {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message;
  el.className = `alert alert-${type} show`;
}

function hideAlert(id) {
  const el = document.getElementById(id);
  if (el) el.className = 'alert';
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── Signup ─────────────────────────────────────────────────────

async function handleSignup(event) {
  event.preventDefault();
  hideAlert('signup-alert');

  const name     = document.getElementById('name').value.trim();
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirm  = document.getElementById('confirm-password').value;

  // Validation
  if (!name || !email || !password || !confirm) {
    return showAlert('signup-alert', 'Please fill in all fields.');
  }
  if (!validateEmail(email)) {
    return showAlert('signup-alert', 'Please enter a valid email address.');
  }
  if (password.length < 8) {
    return showAlert('signup-alert', 'Password must be at least 8 characters.');
  }
  if (password !== confirm) {
    return showAlert('signup-alert', 'Passwords do not match.');
  }

  // Supabase signup
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name }
    }
  });

  if (error) {
    return showAlert('signup-alert', error.message);
  }

  // Check if email confirmation is required
  if (data?.user?.identities?.length === 0) {
    return showAlert('signup-alert', 'An account with this email already exists.');
  }

  showAlert('signup-alert', 'Account created! Redirecting to your profile…', 'success');

  setTimeout(() => {
    window.location.href = 'profile.html';
  }, 1500);
}

// ── Login ──────────────────────────────────────────────────────

async function handleLogin(event) {
  event.preventDefault();
  hideAlert('login-alert');

  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    return showAlert('login-alert', 'Please enter your email and password.');
  }
  if (!validateEmail(email)) {
    return showAlert('login-alert', 'Please enter a valid email address.');
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return showAlert('login-alert', error.message);
  }

  showAlert('login-alert', 'Login successful! Redirecting…', 'success');

  setTimeout(() => {
    window.location.href = 'dashboard.html';
  }, 1500);
}

// ── Logout ─────────────────────────────────────────────────────

async function handleLogout(event) {
  if (event) event.preventDefault();
  await supabase.auth.signOut();
  window.location.href = 'login.html';
}

// ── Auth Guard ─────────────────────────────────────────────────

/**
 * Require an active session. If none, redirect to login.
 * @returns {Object|null} The authenticated user, or null.
 */
export async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = 'login.html';
    return null;
  }

  return session.user;
}

// ── Redirect if already logged in (for login/signup pages) ────

export async function redirectIfLoggedIn(destination = 'dashboard.html') {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    window.location.href = destination;
  }
}

// ── Event Binding ──────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signup-form');
  if (signupForm) signupForm.addEventListener('submit', handleSignup);

  const loginForm = document.getElementById('login-form');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  // Support logout button on desktop and mobile nav
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

  const logoutBtnMobile = document.getElementById('logout-btn-mobile');
  if (logoutBtnMobile) logoutBtnMobile.addEventListener('click', handleLogout);
});
