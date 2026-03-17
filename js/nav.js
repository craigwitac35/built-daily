/**
 * nav.js – Hamburger / mobile-nav toggle.
 *
 * Loaded as a classic script (no type="module") on every page.
 * Targets .hamburger and .nav-mobile, toggling .open on both.
 * Also handles close-on-link-click, Escape key, outside-click,
 * aria-expanded, and body-scroll lock.
 */

document.addEventListener('DOMContentLoaded', function () {
  const hamburger = document.querySelector('.hamburger');
  const navMobile = document.querySelector('.nav-mobile');

  if (!hamburger || !navMobile) return;

  hamburger.setAttribute('aria-expanded', 'false');

  function openMenu() {
    hamburger.classList.add('open');
    navMobile.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    hamburger.classList.remove('open');
    navMobile.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  function isOpen() {
    return navMobile.classList.contains('open');
  }

  // Toggle on hamburger click
  hamburger.addEventListener('click', function () {
    if (isOpen()) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close when a nav link is clicked
  navMobile.addEventListener('click', function (e) {
    if (e.target.closest('a')) {
      closeMenu();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) {
      closeMenu();
      hamburger.focus();
    }
  });

  // Close when clicking outside the nav and hamburger
  document.addEventListener('click', function (e) {
    if (isOpen() && !navMobile.contains(e.target) && !hamburger.contains(e.target)) {
      closeMenu();
    }
  });
});
