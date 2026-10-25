/*
 * The Emergent Behaviour Log's page. Rendering only: reads PixelUniverse.emergence. Supports ?at=YYYY-MM-DDTHH:MM (UTC)
 * to read the log as it stood at another moment. Only this file calls Date.now().
 */
(function () {
  'use strict';
  const U = window.PixelUniverse || {}, M = U.emergence, S = U.shared;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const q = new URLSearchParams(location.search), at = q.get('at');
  const fixed = at ? Date.parse(at.length <= 16 ? at + ':00Z' : at) : null;
  const now = () => (fixed !== null && !isNaN(fixed) ? fixed : Date.now());
  const W = U.climate, off = (t) => (W && W.offsetAt ? W.offsetAt(t) : 0);
  const fDate = new Intl.DateTimeFormat('en-NZ', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' });
  const fTime = new Intl.DateTimeFormat('en-NZ', { timeZone: 'UTC', hour: 'numeric', minute: '2-digit' });
  const date = (t) => fDate.format(t + off(t));
  const KIND = { linked: ['Linked', 'linked'], 'one system': ['One system', 'one'], coincidence: ['Coincidence', 'coincidence'] };
  const COLOR = { climate: '#7FB8E8', city: '#1FE38C', senate: '#E8A33D', commerce: '#20C3AF', freight: '#46D6FF', bank: '#C9A227', society: '#FF5FA2', bookmaker: '#F2D024' };
  const BASE = 'https://dvexperiments.github.io/';
  let filter = '', entries = [], loaded = false;

  if (S && S.applyLaws) S.applyLaws();
  if (fixed !== null && !isNaN(fixed)) { const b = $('travel'); b.hidden = false; b.innerHTML = 'Reading the log as it stood at ' + esc(at.replace('T', ' ')) + ' UTC. <a href="' + location.pathname + '">Return to the present</a>.'; }

  function entryHtml(e) {
    return '<li class="entry"><div class="meta"><span class="kind ' + KIND[e.connection][1] + '">' + KIND[e.connection][0] + '</span><span class="observed">Observed</span><time>' + esc(date(e.time)) + '</time><span>' + esc(e.watcherName) + '</span></div>' +
      '<h3>' + esc(e.title) + '</h3><p>' + esc(e.text) + '</p><p class="via"><b>How it connects:</b> ' + esc(e.via) + '</p>' +
      '<ol class="chain" aria-label="The chain, from the records">' + e.links.map((l) => '<li style="--c:' + (COLOR[l.site] || '#8496A0') + '"><span class="src"><a href="' + BASE + (M.SITE_URL[l.site] || '') + '">' + esc(l.siteName) + '</a> \u00b7 ' + esc(date(l.time)) + ', ' + esc(fTime.format(l.time + off(l.time))) + ' PCT</span>' + esc(l.headline) + '</li>').join('') + '</ol></li>';
  }
  function paintEntries() {
    const shown = filter ? entries.filter((e) => e.connection === filter) : entries;
    $('entries').innerHTML = shown.length ? shown.map(entryHtml).join('')
      : '<li class="entry"><p style="margin:0;color:var(--muted)">' + (entries.length ? 'Nothing of this kind has been observed yet.' : 'Nothing unexpected has been observed yet. The watchers are reading every site.') + '</p></li>';
  }
  function paintWatchers() {
    const seen = {}; for (const e of entries) seen[e.watcher] = (seen[e.watcher] || 0) + 1;
    $('watchers').innerHTML = M.watchers().map((w) => '<li class="watcher"><span class="kind ' + KIND[w.connection][1] + '">' + KIND[w.connection][0] + '</span><h3>' + esc(w.name) + '</h3>' +
      '<p>' + esc(w.looks) + '</p><p class="via" style="color:var(--muted)">' + esc(w.via) + '</p>' +
      '<div class="hypo"><b>Hypothetical example \u00b7 this has not happened</b>' + esc(w.example) + '</div>' +
      '<span class="seen">' + (!loaded ? 'Counting\u2026' : seen[w.key] ? 'Observed ' + (seen[w.key] === 1 ? 'once' : seen[w.key] + ' times') + ' so far.' : 'Not observed yet.') + '</span></li>').join('');
  }
  document.querySelectorAll('.filters button').forEach((b) => b.addEventListener('click', () => {
    filter = b.dataset.k;
    document.querySelectorAll('.filters button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    paintEntries();
  }));

  function run() {
    if (!M) { $('entries').innerHTML = '<li class="entry"><p style="margin:0">The log could not be loaded. Please try again shortly.</p></li>'; return; }
    try { entries = M.entriesAt(now()); } catch (e) { entries = []; console.error(e); }
    loaded = true;
    paintEntries(); paintWatchers();
  }
  paintWatchers();
  setTimeout(run, 30); // let the page paint first: reading the whole record takes a moment
  if (fixed === null) setInterval(run, 10 * 60000);
})();
