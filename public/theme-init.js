// Inline script to set the theme BEFORE first paint.
// Must run synchronously in the <head>, ahead of any CSS that references it.
// Reads: 1) localStorage override, 2) OS preference. Applies data-theme="dark" to <html>.
(function () {
  try {
    var saved = localStorage.getItem('theme');
    var theme;
    if (saved === 'dark' || saved === 'light') {
      theme = saved;
    } else {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);
  } catch (_) {
    // localStorage blocked (e.g. private mode). Fall back to OS preference only.
    try {
      var osTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', osTheme);
    } catch (_) { /* ignore */ }
  }
})();
