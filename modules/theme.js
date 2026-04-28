/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  KAZKA v4 — theme.js                                         ║
 * ║  Dark / Light mode con nuovo design system                   ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

export const Theme = (() => {

  const THEMES = {
    dark: {
      '--bg':    '#050912',
      '--bg2':   '#090f1e',
      '--bg3':   '#0d1528',
      '--bg4':   '#111c32',
      '--s1':    'rgba(255,255,255,.03)',
      '--s2':    'rgba(255,255,255,.06)',
      '--s3':    'rgba(255,255,255,.10)',
      '--b1':    'rgba(255,255,255,.07)',
      '--b2':    'rgba(255,255,255,.13)',
      '--b3':    'rgba(255,255,255,.20)',
      '--ac':    '#7B68EE',   // viola elettrico
      '--ac2':   '#00E5FF',   // ciano neon
      '--ac3':   '#FF3D78',   // rosa neon
      '--gr':    '#00F0A0',   // verde neon
      '--re':    '#FF3355',   // rosso
      '--ye':    '#FFD166',   // giallo
      '--or':    '#FF8C42',   // arancio
      '--tx':    '#EEF2FF',
      '--tx2':   '#7A85A8',
      '--tx3':   '#3A4268',
      '--glow':  '0 0 60px rgba(123,104,238,.15)',
    },
    light: {
      '--bg':    '#F0F2F8',
      '--bg2':   '#FFFFFF',
      '--bg3':   '#F8F9FC',
      '--bg4':   '#ECEEF5',
      '--s1':    'rgba(0,0,0,.03)',
      '--s2':    'rgba(0,0,0,.06)',
      '--s3':    'rgba(0,0,0,.10)',
      '--b1':    'rgba(0,0,0,.08)',
      '--b2':    'rgba(0,0,0,.14)',
      '--b3':    'rgba(0,0,0,.22)',
      '--ac':    '#5B4FCC',
      '--ac2':   '#0099CC',
      '--ac3':   '#CC2255',
      '--gr':    '#00A878',
      '--re':    '#CC2244',
      '--ye':    '#CC9900',
      '--or':    '#CC6600',
      '--tx':    '#1A1F36',
      '--tx2':   '#5A6282',
      '--tx3':   '#A0A8C8',
      '--glow':  '0 0 40px rgba(91,79,204,.08)',
    }
  };

  let _current = 'dark';

  function init(saved) {
    const pref = saved || localStorage.getItem('kz_theme') ||
      (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    apply(pref, false);
  }

  function apply(name, save = true) {
    _current = name;
    const vars = THEMES[name] || THEMES.dark;
    const root = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    document.documentElement.setAttribute('data-theme', name);
    if (save) localStorage.setItem('kz_theme', name);
    _updateToggleBtn();
  }

  function toggle() {
    apply(_current === 'dark' ? 'light' : 'dark');
  }

  function current() { return _current; }

  function _updateToggleBtn() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.innerHTML = _current === 'dark'
      ? '<i class="fa fa-sun"></i>'
      : '<i class="fa fa-moon"></i>';
    btn.title = _current === 'dark' ? 'Passa al tema chiaro' : 'Passa al tema scuro';
  }

  // Ascolta cambi sistema OS
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem('kz_theme')) apply(e.matches ? 'dark' : 'light', false);
  });

  return { init, apply, toggle, current, THEMES };

})();
