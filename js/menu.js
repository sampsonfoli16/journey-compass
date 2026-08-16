// A small mobile menu toggle that keeps the header usable on phones and tablets.
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('primary-nav');
  if (!toggle || !nav) return;

  function setOpen(open) {
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    nav.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.querySelector('.site-header').classList.toggle('nav-open', open);
    // Keep the page from scrolling behind the open menu on small screens.
    document.body.style.overflow = open ? 'hidden' : '';
  }

  // Start in the closed state so the header behaves consistently on first load.
  setOpen(false);

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    setOpen(!expanded);
    // Move focus to the first navigation link as soon as the menu opens.
    // This helps when a browser does not fire the usual transition callback.
    const firstLink = nav.querySelector('a');
    if (!expanded && firstLink) setTimeout(() => firstLink.focus(), 150);
  });

  // Close the menu when the user clicks away or selects a nav link.
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

  // Allow the user to close the menu with the Escape key.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });
});
