/**
 * auth.js – Authentication helpers (signup & login).
 *
 * Placeholder functions ready to be wired to a backend
 * (e.g. Supabase Auth, Firebase, or a custom REST API).
 */

'use strict';

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

/**
 * Handle user registration.
 * @param {Event} event – form submit event
 */
async function handleSignup(event) {
  event.preventDefault();
  hideAlert('signup-alert');

  const name     = document.getElementById('name').value.trim();
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirm  = document.getElementById('confirm-password').value;

  // Basic validation
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

  // TODO: replace with real backend call, e.g. Supabase
  // const { data, error } = await supabase.auth.signUp({ email, password });
  console.log('Signup attempt:', { name, email });

  showAlert(
    'signup-alert',
    'Account created! Redirecting to your profile…',
    'success'
  );

  // Simulate redirect after successful signup
  setTimeout(() => {
    window.location.href = 'profile.html';
  }, 1500);
}

// ── Login ──────────────────────────────────────────────────────

/**
 * Handle user login.
 * @param {Event} event – form submit event
 */
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

  // TODO: replace with real backend call, e.g. Supabase
  // const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  console.log('Login attempt:', { email });

  showAlert('login-alert', 'Login successful! Redirecting…', 'success');

  setTimeout(() => {
    window.location.href = 'dashboard.html';
  }, 1500);
}

// ── Logout ─────────────────────────────────────────────────────

/**
 * Log the current user out and return to the landing page.
 */
async function handleLogout() {
  // TODO: await supabase.auth.signOut();
  console.log('User logged out.');
  window.location.href = 'index.html';
}

// ── Event Binding ──────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signup-form');
  if (signupForm) signupForm.addEventListener('submit', handleSignup);

  const loginForm = document.getElementById('login-form');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
});
