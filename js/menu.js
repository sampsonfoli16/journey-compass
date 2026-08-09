// Simple mobile menu toggle used on all pages
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('primary-nav');
  if (!toggle || !nav) return;

  function setOpen(open) {
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    nav.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.querySelector('.site-header').classList.toggle('nav-open', open);
    // prevent body scroll when menu open on small screens
    document.body.style.overflow = open ? 'hidden' : '';
  }

  // initialize
  setOpen(false);

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    setOpen(!expanded);
    // move focus to the first link immediately after opening (fallback
    // for browsers where transitionend doesn't fire for display:none)
    const firstLink = nav.querySelector('a');
    if (!expanded && firstLink) setTimeout(() => firstLink.focus(), 150);
  });

  // close menu when clicking outside or on a nav link
  document.addEventListener('click', (e) => {
    if (!document.querySelector('.site-header.nav-open')) return;
    const header = document.querySelector('.site-header');
    if (!header.contains(e.target)) {
      setOpen(false);
    }
  });

  nav.addEventListener('click', (e) => {
    if (e.target.tagName.toLowerCase() === 'a') setOpen(false);
  });

  // close on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });
});
