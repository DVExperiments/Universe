/*
 * The Pixel Universe's shared toolkit. Load it before a site's own scripts:
 *   <script src="https://dvexperiments.github.io/Universe/shared.js"></script>
 *
 * PixelUniverse.shared.rng and .hash are exactly Glacial's G.rng and G.hash (js/sim.js): mulberry32 and 32-bit FNV-1a.
 * Do not change them. Every history in the universe depends on these two functions producing the same numbers forever.
 *
 * Existing sites keep their own copies for now: they are identical, so nothing changes. New sites should use these,
 * and existing ones can switch whenever they are next edited.
 */
(function (root) {
  'use strict';

  function rng(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  /** A seeded stream for one site and purpose, e.g. seed('school', 'exam:2027-06-01'). */
  const seed = (site, purpose) => rng(hash(site + ':' + purpose));

  const DAY = 86400000;
  const EPOCH = Date.UTC(2025, 11, 3);
  const pad = (n) => (n < 10 ? '0' : '') + n;
  const ymd = (ms) => { const d = new Date(ms); return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); };
  const iso = (ms) => new Date(ms).toISOString().replace('.000Z', 'Z');
  const dayOf = (ms) => ms - (((ms % DAY) + DAY) % DAY);

  // ---------------------------------------------------------------- the Pixel Calendar (for display)
  // One Pixel Year per calendar month, from 00:00 UTC on the 1st; December 2025 is Year 1; 360 pixel days a year.
  // The Weather Bureau's universe.js is the source of truth (PixelUniverse.climate.pixel), and simulations read it there;
  // this copy, identical, lets reader pages show pixel dates without loading the climate.
  const MONTH0 = 2025 * 12 + 11;
  function pixelTime(t) {
    const C = root.PixelUniverse && root.PixelUniverse.climate;
    if (C && C.pixel) return C.pixel.time(t);
    const d = new Date(t), y = d.getUTCFullYear(), m = d.getUTCMonth();
    const a = Date.UTC(y, m, 1), b = Date.UTC(y, m + 1, 1);
    const dayOfYear = Math.floor(((t - a) * 360) / (b - a));
    return { year: y * 12 + m - MONTH0 + 1, month: Math.floor(dayOfYear / 30) + 1, day: (dayOfYear % 30) + 1, dayOfYear, yearStart: a, yearEnd: b };
  }
  const PIXEL_MONTHS = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth', 'Eleventh', 'Twelfth'];
  /** '13-04-12' (year, month, day), as events write it. */
  const pixelDate = (t) => { const p = pixelTime(t); return p.year + '-' + pad(p.month) + '-' + pad(p.day); };
  /** 'Day 12 of the Fourth Month, Year 13', for pages. */
  const pixelLong = (t) => { const p = pixelTime(t); return 'Day ' + p.day + ' of the ' + PIXEL_MONTHS[p.month - 1] + ' Month, Year ' + p.year; };

  // ---------------------------------------------------------------- the Senate's laws, applied to a page (cosmetic)
  const FONT_AXES = {
    'Space Grotesk': 'wght@500;700', 'Fraunces': 'opsz,wght@9..144,500;9..144,700;9..144,800', 'DM Serif Display': '',
    'Syne': 'wght@500;700;800', 'Archivo Narrow': 'wght@500;600;700', 'Source Serif 4': 'opsz,wght@8..60,400;8..60,600',
    'Work Sans': 'wght@400;500;600', 'Atkinson Hyperlegible': 'wght@400;700', 'IBM Plex Mono': 'wght@400;500;600', 'Literata': 'opsz,wght@7..72,400;7..72,600'
  };
  const loaded = {};
  function loadFont(name) {
    if (typeof document === 'undefined' || !name || loaded[name] || !(name in FONT_AXES)) return;
    loaded[name] = true;
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=' + name.replace(/ /g, '+') + (FONT_AXES[name] ? ':' + FONT_AXES[name] : '') + '&display=swap';
    document.head.appendChild(l);
  }
  /**
   * Restyles the page with the colours and typefaces that are Senate law at time t (default: now), and keeps it in step
   * with the reader's light or dark setting. Needs the Senate's universe.js; without it the page keeps its own look.
   */
  function applyLaws(t) {
    if (typeof document === 'undefined') return false;
    const S = root.PixelUniverse && root.PixelUniverse.senate;
    if (!S || !S.styleVars || (S.ready && !S.ready())) return false;
    const dark = root.matchMedia ? root.matchMedia('(prefers-color-scheme: dark)') : null;
    const apply = () => {
      try {
        const at = t === undefined ? Date.now() : t;
        const vars = S.styleVars(at, dark && dark.matches ? 'dark' : 'light');
        for (const k in vars) document.documentElement.style.setProperty(k, vars[k]);
        const laws = S.lawsAt(at);
        loadFont(laws['style.display']);
        loadFont(laws['style.body']);
      } catch (e) { /* keep the page's own look */ }
    };
    apply();
    if (dark && !applyLaws.watching) { applyLaws.watching = true; dark.addEventListener('change', apply); }
    return true;
  }

  root.PixelUniverse = root.PixelUniverse || {};
  root.PixelUniverse.shared = { version: '1.1.0', rng, hash, seed, EPOCH, DAY, ymd, iso, dayOf, pixelTime, pixelDate, pixelLong, PIXEL_ADOPTED: Date.UTC(2026, 11, 1), applyLaws, loadFont };
})(typeof window !== 'undefined' ? window : globalThis);
