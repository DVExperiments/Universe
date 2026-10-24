/*
 * The universe bar: one navigation bar across the top of every Pixel Universe site.
 *
 * Add it as the first thing inside <body>, naming the site it is on:
 *   <script src="https://dvexperiments.github.io/Universe/nav.js" data-site="city"></script>
 *
 * It inserts itself where the script tag is, before the page paints, so nothing jumps. Every site and its areas are
 * listed once, below, in SITES: add a site or an area here and it appears on every page in the universe.
 *
 * Desktop: hover or focus a site to see its areas; click the name to go there. Touch: the first tap opens the menu,
 * the second follows the link. Narrow screens: one Menu button opens every site and area.
 * Keyboard: Tab moves through the bar and into an open menu; Escape closes it.
 */
(function () {
  'use strict';
  const BASE = 'https://dvexperiments.github.io/';
  const RENEWAL = Date.UTC(2026, 10, 1); // the city's Renewal: from here its clock is UTC+12 (the Weather Bureau has the final word)
  const me = document.currentScript;
  const here = me && me.getAttribute('data-site');

  // ---------------------------------------------------------------- every site and its areas
  const day = (offsetDays) => { const d = new Date(Date.now() - (Date.now() % 86400000) + offsetDays * 86400000); return d.toISOString().slice(0, 10); };
  const SITES = [
    { id: 'glacial', name: 'Glacial', path: 'Glacial/', color: '#FF5FA2', blurb: 'The world’s slowest race', items: [
      ['Live race', '#live'], ['Grand Prix', '#gp'], ['Standings', '#standings'], ['Pixels', '#pixels'], ['Archive', '#archive'], ['Records', '#records'], ['About', '#about']] },
    { id: 'city', name: 'City', path: 'City/', color: '#1FE38C', blurb: 'Sixteen districts, 82,640 pixels', items: [
      ['Map', '#/'], ['Districts', '#/districts'], ['Power', '#/power'], ['Port', '#/port'], ['Census', 'census.html'], ['About', '#/about']] },
    { id: 'senate', name: 'Senate', path: 'Senate/', color: '#E8A33D', blurb: 'Forty-eight senators, one chamber', items: [
      ['Chamber', '#/'], ['Senators', '#/senators'], ['Bills', '#/bills'], ['Elections', '#/elections'], ['Laws', '#/laws'], ['Parties', '#/parties'], ['Records', '#/records'], ['About', '#/about']] },
    { id: 'weather', name: 'Weather', path: 'Weather/', color: '#7FB8E8', blurb: 'The Weather Bureau', items: [
      ['Now', '#/'], ['Forecast', '#/forecast'], ['Almanac', '#/almanac'], ['Storms', '#/storms'], ['Records', '#/records'], ['Forecaster', '#/forecaster'], ['About', '#/about']] },
    { id: 'bookmaker', name: 'Bookmaker', path: 'Bookmaker/', color: '#E8C547', blurb: 'Odds on every race', items: [
      ['The board', ''], ['Results', '#results-title'], ['The regulars', '#regulars-title']] },
    { id: 'paper', name: 'Daily Pixel', path: 'DailyPixel/', color: '#E1E9EC', blurb: 'The newspaper', items: [
      ['Today’s edition', ''], ['Yesterday’s edition', () => '#' + day(-1)], ['Last week’s edition', () => '#' + day(-7)]] },
    { id: 'radio', name: 'Pixel FM', path: 'PixelFM/', color: '#9BE22D', blurb: 'Radio on 88.8', items: [
      ['Listen live', ''], ['The chart', '#chart-title'], ['New this week', '#new-title'], ['The presenters', '#shows-title']] },
    { id: 'school', name: 'Pixel High', path: 'PixelHigh/', color: '#3D7FE0', blurb: 'The city’s secondary school', items: [
      ['Home', '#/'], ['Students', '#/students'], ['Houses', '#/houses'], ['Calendar', '#/calendar'], ['Prom', '#/prom'], ['Yearbook', '#/yearbook'], ['Staff', '#/staff']] },
    { id: 'jobs', name: 'Job Centre', path: 'JobCentre/', color: '#F2D024', blurb: 'Work, and looking for it', items: [
      ['Today', '#/'], ['Vacancies', '#/vacancies'], ['The queue', '#/queue'], ['Employers', '#/employers'], ['Dream jobs', '#/dreams']] },
    { id: 'exchange', name: 'Exchange', path: 'Exchange/', color: '#20C3AF', blurb: 'Every business, trading', items: [
      ['Market', '#/'], ['Businesses', '#/businesses'], ['Register', '#/register'], ['About', '#/about']] },
    { id: 'museum', name: 'Museum', path: 'Museum/', color: '#B08D4C', blurb: 'The history of the universe', items: [
      ['Hall of Champions', '#champions'], ['The Record Books', '#records'], ['Timeline', '#timeline'], ['The Law Library', '#laws'], ['The Archive', '#archive']] }
  ];
  const HUB = { id: 'universe', name: 'Pixel Universe', path: 'Universe/', items: [['Everything, now', ''], ['The wire', '#wire']] };
  const urlOf = (site, href) => BASE + site.path + (typeof href === 'function' ? href() : href || '');

  // ---------------------------------------------------------------- styles, scoped to the bar
  const css = `
.pu-bar { --pu-bg: #0E171C; --pu-ink: #E1E9EC; --pu-muted: #8496A0; --pu-line: #24323A; --pu-hover: #182630;
  position: relative; z-index: 60; background: var(--pu-bg); color: var(--pu-ink); font: 500 14px/1.2 var(--body, "IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif);
  border-bottom: 1px solid #000; padding-top: env(safe-area-inset-top, 0px); -webkit-font-smoothing: antialiased; }
.pu-bar * { box-sizing: border-box; }
.pu-inner { max-width: 1480px; margin: 0 auto; padding: 0 16px; display: flex; align-items: stretch; gap: 4px; min-height: 42px; }
.pu-bar a { color: inherit; text-decoration: none; }
.pu-brand { display: inline-flex; align-items: center; gap: 9px; padding: 0 12px 0 0; margin-right: 6px; font: 800 15px/1 var(--display, "Bricolage Grotesque", system-ui, sans-serif); letter-spacing: -0.01em; white-space: nowrap; border-right: 1px solid var(--pu-line); }
.pu-mark { width: 10px; height: 10px; background: var(--pu-ink); box-shadow: 4px 4px 0 -1px #9BE22D; }
.pu-sites { display: flex; align-items: stretch; list-style: none; margin: 0; padding: 0; flex: 1; min-width: 0; }
.pu-site { position: relative; display: flex; }
.pu-top { display: inline-flex; align-items: center; gap: 6px; padding: 0 8px; color: var(--pu-muted); white-space: nowrap; border-bottom: 2px solid transparent; }
.pu-top i { width: 7px; height: 7px; background: var(--c); opacity: 0.85; }
.pu-site:hover .pu-top, .pu-site.pu-open .pu-top, .pu-top:focus-visible { color: var(--pu-ink); background: var(--pu-hover); }
.pu-site.pu-here .pu-top { color: var(--pu-ink); border-bottom-color: var(--c); }
.pu-drop { position: absolute; left: 0; top: 100%; min-width: 220px; background: var(--pu-bg); border: 1px solid var(--pu-line); border-top: 0; border-radius: 0 0 8px 8px; padding: 6px; display: none;
  box-shadow: 0 14px 28px rgba(0,0,0,.35); list-style: none; margin: 0; }
@media (hover: hover) { .pu-site:hover .pu-drop { display: block; } }
.pu-site.pu-open .pu-drop { display: block; }
.pu-site.pu-shut .pu-drop { display: none !important; }
.pu-drop .pu-blurb { padding: 6px 10px 8px; color: var(--pu-muted); font-size: 12.5px; border-bottom: 1px solid var(--pu-line); margin-bottom: 4px; }
.pu-drop a { display: block; padding: 8px 10px; border-radius: 4px; color: var(--pu-ink); white-space: nowrap; }
.pu-drop a:hover, .pu-drop a:focus-visible { background: var(--pu-hover); }
.pu-drop a[aria-current="page"] { box-shadow: inset 2px 0 0 var(--c); background: var(--pu-hover); }
.pu-status { display: flex; align-items: center; gap: 14px; margin-left: auto; padding-left: 10px; color: var(--pu-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
.pu-status a:hover { color: var(--pu-ink); }
.pu-menu { display: none; margin-left: auto; align-self: center; background: none; border: 1px solid var(--pu-line); color: var(--pu-ink); font: 600 13px var(--body, system-ui); padding: 6px 12px; border-radius: 6px; cursor: pointer; }
.pu-bar :focus-visible { outline: 2px solid #9BE22D; outline-offset: -2px; }
.pu-panel { display: none; }
@media (max-width: 1580px) { .pu-clock { display: none; } }
@media (max-width: 1300px) { .pu-wallet { display: none; } }
@media (max-width: 1180px) {
  .pu-sites, .pu-status { display: none; }
  .pu-menu { display: inline-block; }
  .pu-here-name { display: inline; color: var(--pu-muted); font: 500 14px var(--body, system-ui); margin-left: 4px; }
  .pu-brand { border-right: 0; }
  .pu-bar.pu-mobile-open .pu-panel { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 18px; padding: 8px 16px 18px; max-height: calc(100vh - 50px); overflow-y: auto; border-top: 1px solid var(--pu-line); }
  .pu-panel section { padding: 8px 0; }
  .pu-panel h2 { margin: 0 0 4px; font: 700 15px var(--display, system-ui); display: flex; align-items: center; gap: 7px; }
  .pu-panel h2 i { width: 7px; height: 7px; background: var(--c); }
  .pu-panel a { display: block; padding: 6px 0; color: var(--pu-muted); }
  .pu-panel a[aria-current="page"], .pu-panel h2 a[aria-current="page"] { color: var(--pu-ink); }
  .pu-panel .pu-wallet-m { grid-column: 1 / -1; color: var(--pu-muted); border-top: 1px solid var(--pu-line); padding-top: 10px; }
}
@media (min-width: 1181px) { .pu-here-name { display: none; } }
@media (prefers-reduced-motion: no-preference) { .pu-drop { animation: pu-in 0.12s ease-out; } @keyframes pu-in { from { opacity: 0; transform: translateY(-3px); } } }
@media print { .pu-bar { display: none; } }`;

  // ---------------------------------------------------------------- markup
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const loc = location.href.split('?')[0];
  const isCurrent = (site, href) => {
    if (site.id !== here) return false;
    let u;
    try { u = new URL(urlOf(site, href), location.href).href.split('?')[0]; } catch (e) { return false; }
    const hash = location.hash || '';
    const itemHash = u.indexOf('#') >= 0 ? u.slice(u.indexOf('#')) : '';
    const itemPath = u.split('#')[0], path = loc.split('#')[0];
    const samePath = itemPath === path || itemPath === path.replace(/index\.html$/, '');
    if (!samePath) return false;
    // a site's front page, with no route in the address, is its first area
    if (!hash || hash === '#' || hash === '#/') { const first = site.items[0][1]; return !itemHash || itemHash === '#/' || (typeof first === 'string' && first === itemHash); }
    if (!itemHash) return false;
    return hash === itemHash || (itemHash.length > 2 && hash.indexOf(itemHash + '/') === 0);
  };
  const item = (site, k) => { const [label, href] = site.items[k]; return '<a href="' + urlOf(site, href) + '" data-s="' + site.id + '" data-i="' + k + '"' + (isCurrent(site, href) ? ' aria-current="page"' : '') + '>' + esc(label) + '</a>'; };
  const itemsHtml = (site) => site.items.map((x, k) => '<li>' + item(site, k) + '</li>').join('');
  const current = SITES.filter((s) => s.id === here)[0];

  const bar = document.createElement('div');
  bar.className = 'pu-bar';
  bar.setAttribute('role', 'navigation');
  bar.setAttribute('aria-label', 'Pixel Universe');
  bar.innerHTML =
    '<div class="pu-inner">' +
      '<a class="pu-brand" href="' + BASE + HUB.path + '"' + (here === 'universe' ? ' aria-current="page"' : '') + '><span class="pu-mark" aria-hidden="true"></span>Pixel Universe' +
        (current ? '<span class="pu-here-name">/ ' + esc(current.name) + '</span>' : '') + '</a>' +
      '<ul class="pu-sites">' + SITES.map((s) =>
        '<li class="pu-site' + (s.id === here ? ' pu-here' : '') + '" style="--c:' + s.color + '">' +
          '<a class="pu-top" href="' + BASE + s.path + '" aria-haspopup="true"' + (s.id === here ? ' aria-current="true"' : '') + '><i aria-hidden="true"></i>' + esc(s.name) + '</a>' +
          '<ul class="pu-drop"><li class="pu-blurb">' + esc(s.blurb) + '</li>' + itemsHtml(s) + '</ul></li>').join('') + '</ul>' +
      '<div class="pu-status"><span class="pu-clock" title="City time is UTC"></span><a class="pu-wallet" href="' + BASE + 'Bookmaker/" title="Your play money, kept in this browser"></a></div>' +
      '<button type="button" class="pu-menu" aria-expanded="false">Menu</button>' +
    '</div>' +
    '<div class="pu-panel">' + SITES.map((s) => '<section style="--c:' + s.color + '"><h2><i aria-hidden="true"></i><a href="' + BASE + s.path + '"' + (s.id === here ? ' aria-current="page"' : '') + '>' + esc(s.name) + '</a></h2>' +
      s.items.map((x, k) => item(s, k)).join('') + '</section>').join('') +
      '<p class="pu-wallet-m"></p></div>';

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  if (me && me.parentNode) me.parentNode.insertBefore(bar, me);
  else document.body.insertBefore(bar, document.body.firstChild);

  // ---------------------------------------------------------------- behaviour
  const sites = bar.querySelectorAll('.pu-site');
  const menuBtn = bar.querySelector('.pu-menu');
  sites.forEach((li) => {
    const top = li.querySelector('.pu-top');
    // touch: the first tap opens the menu, the second follows the link
    top.addEventListener('pointerdown', (e) => { li.dataset.pointer = e.pointerType; });
    top.addEventListener('click', (e) => {
      if (li.dataset.pointer === 'touch' && !li.classList.contains('pu-open')) {
        e.preventDefault();
        sites.forEach((o) => o.classList.remove('pu-open'));
        li.classList.add('pu-open');
      }
    });
  });
  document.addEventListener('click', (e) => { if (!bar.contains(e.target)) sites.forEach((o) => o.classList.remove('pu-open')); });
  // keyboard: Tab moves between sites; Down arrow (or Enter on an open menu's site) opens its areas; Up and Down move
  // through them; Escape closes and returns to the site's name. A closed menu's areas are not in the tab order.
  const openMenu = (li, focusFirst) => {
    sites.forEach((o) => { if (o !== li) { o.classList.remove('pu-open'); o.querySelector('.pu-top').setAttribute('aria-expanded', 'false'); } });
    li.classList.add('pu-open');
    li.querySelector('.pu-top').setAttribute('aria-expanded', 'true');
    if (focusFirst) li.querySelector('.pu-drop a').focus();
  };
  const closeMenu = (li, refocus) => {
    li.classList.remove('pu-open');
    li.classList.add('pu-shut');
    li.querySelector('.pu-top').setAttribute('aria-expanded', 'false');
    if (refocus) li.querySelector('.pu-top').focus();
  };
  sites.forEach((li) => li.querySelector('.pu-top').setAttribute('aria-expanded', 'false'));
  bar.addEventListener('keydown', (e) => {
    const li = e.target.closest('.pu-site');
    if (e.key === 'Escape') {
      if (li) closeMenu(li, true);
      if (bar.classList.contains('pu-mobile-open')) { toggleMobile(false); menuBtn.focus(); }
      return;
    }
    if (!li) return;
    const links = Array.from(li.querySelectorAll('.pu-drop a'));
    const i = links.indexOf(e.target);
    if (e.key === 'ArrowDown') { e.preventDefault(); if (i < 0) openMenu(li, true); else links[(i + 1) % links.length].focus(); }
    else if (e.key === 'ArrowUp' && i >= 0) { e.preventDefault(); if (i === 0) closeMenu(li, true); else links[i - 1].focus(); }
  });
  bar.addEventListener('focusout', (e) => {
    const li = e.target.closest('.pu-site');
    if (li && !li.contains(e.relatedTarget)) { li.classList.remove('pu-open'); li.querySelector('.pu-top').setAttribute('aria-expanded', 'false'); }
  });
  sites.forEach((li) => li.addEventListener('mouseleave', () => li.classList.remove('pu-shut')));
  function toggleMobile(v) { bar.classList.toggle('pu-mobile-open', v); menuBtn.setAttribute('aria-expanded', String(v)); menuBtn.textContent = v ? 'Close' : 'Menu'; }
  menuBtn.addEventListener('click', () => toggleMobile(!bar.classList.contains('pu-mobile-open')));
  // a link to a section of this same page: close the menus as it is followed
  bar.addEventListener('click', (e) => { const a = e.target.closest('.pu-drop a, .pu-panel a'); if (a) { sites.forEach((o) => o.classList.remove('pu-open')); toggleMobile(false); } });

  // ---------------------------------------------------------------- the clock and the wallet
  const clock = bar.querySelector('.pu-clock'), wallet = bar.querySelector('.pu-wallet'), walletM = bar.querySelector('.pu-wallet-m');
  function tick() {
    const d = new Date();
    // city time: UTC until the Renewal, then City Standard Time (UTC+12), as the Weather Bureau keeps it
    const W = window.PixelUniverse && window.PixelUniverse.climate;
    const off = W && W.offsetAt ? W.offsetAt(d.getTime()) : (d.getTime() >= RENEWAL ? 12 * 3600000 : 0);
    clock.textContent = new Date(d.getTime() + off).toISOString().slice(11, 16) + (off ? ' city time' : ' UTC');
    clock.title = off ? 'City Standard Time, UTC+12. Races, laws and the newspaper turn over at 00:00 UTC.' : 'City time is UTC';
    let w = null;
    try { const raw = localStorage.getItem('pixeluniverse.wallet.v1'); w = raw ? JSON.parse(raw) : null; } catch (e) { w = null; }
    const text = w && typeof w.balance === 'number' ? Math.floor(w.balance).toLocaleString('en') + ' W' : 'Get 1,000 W';
    if (wallet.textContent !== text) wallet.textContent = text;
    walletM.textContent = 'Your balance: ' + text;
  }
  tick();
  setInterval(tick, 15000);
  window.addEventListener('storage', (e) => { if (e.key === 'pixeluniverse.wallet.v1') tick(); });
  // the site's own routes change the hash: keep the highlighted area in step
  window.addEventListener('hashchange', () => {
    bar.querySelectorAll('a[data-s]').forEach((a) => {
      const site = SITES.filter((x) => x.id === a.dataset.s)[0];
      if (isCurrent(site, site.items[+a.dataset.i][1])) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  });

  window.PixelUniverseNav = { SITES, HUB, BASE };
})();
