/*
 * The hub: one window onto every site, all live. Rendering only. Each window copes if its site cannot be reached.
 * Only this file calls Date.now().
 */
(function () {
  'use strict';
  const U = window.PixelUniverse || {};
  const G = window.G;
  const S = U.shared;
  const $ = (id) => document.getElementById(id);
  const H = 3600000, DAY = 86400000, MIN = 60000;
  const ok = (x) => !!(x && (!x.ready || x.ready()));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const num = (n) => Math.round(n).toLocaleString('en');
  const hm = (ms) => new Date(ms).toISOString().slice(11, 16);
  const until = (ms) => { const m = Math.max(0, Math.round(ms / MIN)), h = Math.floor(m / 60); return h >= 24 ? Math.floor(h / 24) + 'd ' + (h % 24) + 'h' : h ? h + 'h ' + (m % 60) + 'm' : m + 'm'; };
  const fDate = new Intl.DateTimeFormat(undefined, { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' });
  const fLong = new Intl.DateTimeFormat(undefined, { timeZone: 'UTC', day: 'numeric', month: 'long' });
  const unreachable = (id, what) => { $(id).innerHTML = '<p class="dim">' + what + ' could not be reached. Reload the page to try again.</p>'; };
  const MOODC = { content: '#3FA66A', uneasy: '#E8A33D', unhappy: '#E5484D' };

  if (S) S.applyLaws();

  // whole windows are links, except where something inside is clicked on purpose
  document.querySelectorAll('.win[data-href]').forEach((w) => w.addEventListener('click', (e) => { if (!e.target.closest('a, button, input, label')) location.href = w.dataset.href; }));

  // ---------------------------------------------------------------- the day
  function lede() {
    const now = Date.now(), n = Math.floor((now - Date.UTC(2025, 11, 3)) / DAY) + 1;
    $('lede').textContent = 'Day ' + num(n) + ' of the universe. ' + fDate.format(now) + ', ' + hm(now) + ' city time. Everything below is happening now, slowly.';
  }

  // ---------------------------------------------------------------- the city, drawn from its own map
  const TILE = ['#1B3A57', '#CDB98A', '#54804B', '#2F5A36', '#5A6168', '#737A80', '#8A8F94', '#C98B6B', '#9AA3AD', '#D9A55B', '#7F9BB8', '#6B6259', '#8C7F6E', '#7A6A55', '#5E9E58', '#2D5C80', '#B9B1A2', '#857B6B', '#E0C060'];
  const SITE = { coal: '#3B3835', solar: '#3E6FB0', wind: '#E6EEF2', park: '#5EB058', wildlife: '#3E8A4A' };
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  function lit(i) { let h = i * 2654435761 >>> 0; h ^= h >>> 15; return (h % 100) / 100; } // fixed per tile: lights don't flicker
  // City's own map, as on the City page: buildings, ships, traffic, smoke, weather, lights and blackouts
  let view = null, cityState = null, cityWx = null, raf = 0, visible = true;
  function cityLight(t) {
    const W = U.climate, off = W.offsetAt ? W.offsetAt(t) : 0, dl = W.normals(t).dayLength, h = (((t + off) % DAY) + DAY) % DAY / H, rise = 12 - dl / 2, set = 12 + dl / 2;
    if (h < rise - 0.75 || h > set + 0.75) return 0;
    if (h < rise + 0.75) return (h - rise + 0.75) / 1.5;
    if (h > set - 0.75) return (set + 0.75 - h) / 1.5;
    return 1;
  }
  function startCityView() {
    if (view || !window.CityMap || !ok(U.city) || !ok(U.climate)) return false;
    try {
      $('city-map').hidden = true;
      const m = view ? view.map : U.city.map(Date.now());
      view = window.CityMap($('city-view'), { time: Date.now(), personHref: (id) => 'https://dvexperiments.github.io/City/census.html#/resident/' + id });
      // fill the window the way a photo fills a frame: zoom until the city covers it, centred
      const cover = () => { const r = $('city-view').getBoundingClientRect(); if (r.width && r.height) view.focus(m.W / 2, m.H / 2, Math.max(r.width / m.W, r.height / m.H)); };
      cover();
      window.addEventListener('resize', cover);
      if ('ResizeObserver' in window) new ResizeObserver(cover).observe($('city-view'));
      const loop = () => { raf = 0; if (!visible || document.hidden) return; try { view.frame(cityState, cityLight(Date.now()), cityWx, Date.now()); } catch (e) { /* skip a frame */ } raf = requestAnimationFrame(loop); };
      const wake = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop); };
      if ('IntersectionObserver' in window) new IntersectionObserver((es) => { visible = es[0].isIntersecting; wake(); }).observe($('city-view'));
      document.addEventListener('visibilitychange', wake);
      view.wake = wake;
      return true;
    } catch (e) { view = null; return false; }
  }
  function city() {
    const C = U.city, W = U.climate;
    if (!ok(C)) { $('city-cap').textContent = 'The city could not be reached. Reload the page to try again.'; return; }
    const now = Date.now(), map = C.map(), st = C.stateAt(now);
    if (view || startCityView()) {
      cityState = st; cityWx = W.sample(now);
      view.wake();
      cityCaption(map, st);
      return;
    }
    // without City's renderer: a simple drawing of the map
    $('city-view').hidden = true; $('city-map').hidden = false;
    const cv = $('city-map'), g = cv.getContext('2d'), img = g.createImageData(map.W, map.H), d = img.data;
    // daylight, the city's way: sunrise and sunset from the season's day length, in city time
    let night = 0;
    if (ok(W)) { const dl = W.normals(now).dayLength, h = (now % DAY) / H, rise = 12 - dl / 2, set = 12 + dl / 2; night = h < rise - 0.6 || h > set + 0.6 ? 1 : h < rise + 0.6 ? (rise + 0.6 - h) / 1.2 : h > set - 0.6 ? (h - set + 0.6) / 1.2 : 0; }
    const dark = new Set(st.dark || []);
    const colour = new Array(map.tiles.length);
    for (let i = 0; i < map.tiles.length; i++) colour[i] = TILE[map.tiles[i]] || '#000000';
    for (const s of st.sites || []) {
      const f = map.features[s.id];
      if (!f || s.state === 'empty') continue;
      const c = s.state === 'operating' ? SITE[s.type] : '#A29A88';
      for (let y = f.y; y < f.y + f.h; y++) for (let x = f.x; x < f.x + f.w; x++) colour[y * map.W + x] = c || colour[y * map.W + x];
    }
    const smog = Math.max(0, Math.min(0.4, ((st.aqi || 0) - 60) / 260));
    for (let i = 0; i < map.tiles.length; i++) {
      let [r, gg, b] = hex(colour[i]);
      const t = map.tiles[i], off = dark.has(map.district[i]);
      const k = 1 - night * (off ? 0.86 : 0.74);
      r *= k; gg *= k; b *= k;
      // windows light up at night, unless the district is in a blackout
      if (night > 0.3 && !off && (t === 7 || t === 8 || t === 9 || t === 10 || t === 18) && lit(i) < (t === 8 || t === 10 ? 0.16 : 0.07)) { const w = 0.55 + lit(i * 7) * 0.4; r = 255 * w; gg = 205 * w; b = 120 * w; }
      r = r * (1 - smog) + 140 * smog; gg = gg * (1 - smog) + 128 * smog; b = b * (1 - smog) + 100 * smog;
      d[i * 4] = r; d[i * 4 + 1] = gg; d[i * 4 + 2] = b; d[i * 4 + 3] = 255;
    }
    cv.width = map.W; cv.height = map.H;
    g.putImageData(img, 0, 0);
    cityCaption(map, st);
  }
  function cityCaption(map, st) {
    const W = U.climate, now = Date.now(), dark = new Set(st.dark || []);
    const l = ok(W) ? cityLight(now) : 1;
    const darkNames = map.districts.filter((x) => dark.has(x.id)).map((x) => x.name);
    const cityHour = (((now + (W && W.offsetAt ? W.offsetAt(now) : 0)) % DAY) + DAY) % DAY / H;
    $('city-live').textContent = (l === 0 ? 'Night' : l < 1 ? (cityHour < 12 ? 'Dawn' : 'Dusk') : 'Day') + ', ' + String(Math.floor(cityHour)).padStart(2, '0') + ':' + String(Math.floor((cityHour % 1) * 60)).padStart(2, '0') + ' city time';
    $('city-cap').innerHTML = '<b>' + num(st.residents) + ' residents.</b> The grid is carrying ' + num(st.grid.demand) + ' MW, ' + Math.round((st.grid.solar + st.grid.wind) / Math.max(1, st.grid.demand) * 100) + '% of it clean. ' +
      'Air: ' + esc(st.air.toLowerCase()) + ' (' + st.aqi + ').' + (darkNames.length ? ' <b>Blackout in ' + esc(darkNames.join(', ')) + '.</b>' : ' The lights are on everywhere.');
  }

  // ---------------------------------------------------------------- the race
  let L = null;
  const MODE = { c: 'Cruising', n: 'Asleep', s: 'Sprinting', t: 'Stumbling', f: 'Finished' };
  function race() {
    if (!G || !G.buildLeague) { unreachable('race', 'Glacial'); return; }
    const now = Date.now();
    if (!L || now >= L.current.startMs + L.current.windowMs) L = G.buildLeague(now);
    const r = L.current, ms = now - r.startMs;
    const field = r.lineup.map((id, i) => ({ id, p: G.PX[id], x: G.posAt(r, i, ms), mode: G.modeAt(r, i, ms) })).sort((a, b) => b.x - a.x);
    const name = r.kind === 'gp' ? r.name : 'Daily Crawl #' + r.number;
    const lead = field[0], gap = Math.round((field[0].x - field[1].x) * r.trackPx);
    $('race').innerHTML = '<h3>' + esc(name) + '</h3><p class="sub">Hour ' + (Math.floor(ms / H) + 1) + ' of about ' + (r.kind === 'gp' ? 45 : 23) + '. ' + esc(lead.p.name) + ' leads by ' + (gap ? gap + ' px' : 'a whisker') + '.</p>' +
      field.slice(0, 8).map((f) => '<div class="lane"><span class="nm">' + esc(f.p.name) + '<small>' + MODE[f.mode] + '</small></span><span class="track"><span style="left:' + (f.x * 100).toFixed(2) + '%;background:' + f.p.color + ';color:' + f.p.color + '"></span></span><span class="pct">' + Math.round(f.x * 100) + '%</span></div>').join('');
    const last = L.races[L.races.length - 1];
    $('race-cap').innerHTML = last ? 'Last race: <b>' + esc(G.PX[last.winner.id].name) + '</b> won ' + (last.kind === 'gp' ? 'the ' + esc(last.name) : 'Daily Crawl #' + last.number) + ' by ' + Math.round(last.marginPx) + ' px.' : '';
  }

  // ---------------------------------------------------------------- the news
  function news() {
    const P = U.paper;
    if (!ok(P)) { unreachable('news', 'The Daily Pixel'); return; }
    const ed = P.editionAt(Date.now());
    if (!ed) return;
    $('news-no').textContent = 'No. ' + num(ed.number);
    const lead = ed.lead;
    let h = lead ? '<p class="muted" style="margin:0 0 4px;font-size:.8125rem">' + esc(lead.section) + '</p><p class="head">' + esc(lead.headline) + '</p><p class="p">' + esc(lead.body[0]) + '</p>' : '<p class="head">A quiet day in the Pixel Universe</p>';
    h += '<ul class="mini">' + ed.stories.slice(0, 3).map((s) => '<li>' + esc(s.headline) + ' <small>' + esc(s.section) + '</small></li>').join('') + '</ul>';
    $('news').innerHTML = h;
  }

  // ---------------------------------------------------------------- the Senate
  const PARTY = { B: ['Brightness', '#E8A33D'], V: ['Verdant', '#3FA66A'], L: ['Legacy Mode', '#8C9AA6'], I: ['Independent', '#B79AE0'] };
  function senate() {
    const Sn = U.senate;
    if (!ok(Sn)) { unreachable('senate', 'The Senate'); return; }
    const now = Date.now(), st = Sn.stateAt(now);
    if (!st.started) {
      const elect = Date.UTC(2026, 10, 28), sit = Date.UTC(2026, 11, 3, 19);
      $('senate-live').textContent = now < elect ? 'Election in ' + until(elect - now) : 'First sitting in ' + until(sit - now);
      $('senate').innerHTML = '<p class="head">' + (now < elect ? 'The founding election is on ' + fLong.format(elect) : 'The first Senate has been elected') + '</p><p class="p muted">Forty-eight senators, three for each district. The Senate first sits on ' + fLong.format(sit) + ' at 19:00 city time, and its laws will change how the whole universe looks.</p>';
      return;
    }
    const c = st.composition, total = 48;
    const dayStart = now - (now % DAY), h = (now % DAY) / H;
    const sitting = Sn.calendar.isSitting(dayStart) && h >= 19 && h < 22 && !(Sn.calendar.adjourned && Sn.calendar.adjourned(dayStart));
    $('senate-live').textContent = sitting ? 'Sitting now' : st.dissolved ? 'Dissolved' : 'In recess';
    const parts = ['B', 'V', 'L', 'I'].filter((k) => c[k]).map((k) => [PARTY[k][0], c[k], PARTY[k][1]]);
    let html = '<div class="compbar">' + parts.map((p) => '<i style="width:' + (p[1] / total) * 100 + '%;background:' + p[2] + '"></i>').join('') + '</div><p class="key">' + parts.map((p) => '<span style="--c:' + p[2] + '">' + p[0] + ' ' + p[1] + '</span>').join('') + '</p>';
    const ev = Sn.eventsBetween(now - 3 * DAY, now).filter((e) => e.importance >= 2).slice(-3).reverse();
    html += '<ul class="mini">' + (ev.length ? ev.map((e) => '<li>' + esc(e.headline) + '</li>').join('') : '<li class="muted">A quiet few days in the chamber.</li>') + '</ul>';
    $('senate').innerHTML = html;
  }

  // ---------------------------------------------------------------- the weather
  function weather() {
    const W = U.climate;
    if (!ok(W)) { unreachable('weather', 'The Weather Bureau'); return; }
    const now = Date.now(), st = W.stateAt(now), n = st.now;
    const fc = st.forecast && st.forecast.days.filter((d) => d.day >= now - (now % DAY))[0];
    const stats = W.forecasterStats(now);
    $('weather').innerHTML = '<p class="big">' + Math.round(n.temp) + '°</p><p class="p">' + esc(n.cond) + ', with a ' + (n.gust >= 50 ? 'strong ' : 'light ') + esc(n.compass) + ' wind. ' + esc(st.season) + '.</p>' +
      (fc ? '<ul class="mini"><li>' + esc(fc.text) + ' High ' + Math.round(fc.max) + '°, low ' + Math.round(fc.min) + '°. <small>' + esc(st.forecaster.name) + ', right ' + Math.round(stats.accuracy * 100) + '% of the time</small></li></ul>' : '');
  }

  // ---------------------------------------------------------------- the Bookmaker
  function book() {
    const B = U.bookmaker;
    if (!ok(B)) { unreachable('book', 'The Bookmaker'); return; }
    const now = Date.now(), st = B.stateAt(now);
    if (!st.started || !st.open) { $('book').innerHTML = '<p class="p muted">The board is being chalked up.</p>'; return; }
    const m = st.open, open = now < m.closes;
    $('book-live').textContent = open ? 'Closes in ' + until(m.closes - now) : 'Betting closed';
    const rows = m.runners.map((r, i) => ({ r, p: m.prices[i] })).sort((a, b) => a.p - b.p).slice(0, 4);
    $('book').innerHTML = '<p class="muted" style="margin:0 0 6px">' + esc(m.name) + '</p><table class="odds"><tbody>' + rows.map((x) => '<tr><td><span class="chip" style="--c:' + x.r.color + '"></span>' + esc(x.r.name) + '</td><td>' + x.p.toFixed(2) + '</td></tr>').join('') + '</tbody></table>' +
      '<p class="p muted" style="margin-top:10px">' + m.bets.length + ' bets from the regulars so far.</p>';
  }

  // ---------------------------------------------------------------- the census
  function census() {
    const K = U.census;
    if (!ok(K)) { unreachable('census', 'The Census Office'); return; }
    const now = Date.now(), st = K.stateAt(now);
    if (!st.started) return;
    const p = st.panel, f = K.person(st.residentOfTheDay, now);
    const parts = [['Content', p.mood.content, MOODC.content], ['Uneasy', p.mood.uneasy, MOODC.uneasy], ['Unhappy', p.mood.unhappy, MOODC.unhappy]];
    const top = p.concerns.filter((c) => c.key !== 'none')[0];
    $('census').innerHTML = '<p class="big">' + num(st.population) + '</p><p class="p muted">residents, in ' + num(st.households) + ' homes.' + (top ? ' This week’s biggest complaint: ' + esc(top.label.toLowerCase()) + '.' : '') + '</p>' +
      '<div class="compbar">' + parts.map((x) => '<i style="width:' + x[1] + '%;background:' + x[2] + '"></i>').join('') + '</div><p class="key">' + parts.map((x) => '<span style="--c:' + x[2] + '">' + x[0] + ' ' + x[1] + '%</span>').join('') + '</p>' +
      '<div class="person"><span class="sq" style="--c:' + f.color + '"><i></i></span><span><a href="https://dvexperiments.github.io/City/census.html#/resident/' + f.id + '">' + esc(f.name) + '</a>, ' + f.age + ', ' + esc(f.districtName) +
      (f.thinks ? '<q>' + esc(f.thinks.quote) + '</q>' : '') + '</span></div>';
  }

  // ---------------------------------------------------------------- the museum
  function museum() {
    if (!G || !G.buildLeague) { unreachable('museum', 'The collection'); return; }
    const now = Date.now();
    if (!L) L = G.buildLeague(now);
    const titles = {};
    for (const r of L.races) if (r.kind === 'gp') titles[r.winner.id] = (titles[r.winner.id] || 0) + 1;
    const best = Object.keys(titles).sort((a, b) => titles[b] - titles[a])[0];
    const R = L.records;
    $('museum').innerHTML = '<p class="big">' + num(L.races.length) + '</p><p class="p muted">races in the collection, every one kept.</p><ul class="mini">' +
      (best ? '<li>Most Grand Prix titles: <b>' + esc(G.PX[best].name) + '</b>, ' + titles[best] + '</li>' : '') +
      (R.longestNap && R.longestNap.id ? '<li>Longest nap: <b>' + esc(G.PX[R.longestNap.id].name) + '</b>, ' + Math.floor(R.longestNap.ms / H) + 'h ' + Math.round((R.longestNap.ms % H) / MIN) + 'm</li>' : '') +
      (R.closest && R.closest.id ? '<li>Closest finish: ' + (Math.round(R.closest.px * 10) / 10) + ' pixels</li>' : '') + '</ul>';
  }

  // ---------------------------------------------------------------- the wire
  const SOURCES = { glacial: ['Glacial', '#FF5FA2'], weather: ['Weather', '#7FB8E8'], senate: ['Senate', '#E8A33D'], city: ['City', '#C98B6B'], bookmaker: ['Bookmaker', '#F2D024'],
    census: ['Census', '#3FA66A'], radio: ['Pixel FM', '#9BE22D'], museum: ['Museum', '#B08D4C'] };
  function wire() {
    const now = Date.now(), from = now - DAY, all = [];
    for (const [k, src] of [['climate', 'weather'], ['senate', 'senate'], ['city', 'city'], ['bookmaker', 'bookmaker'], ['census', 'census'], ['radio', 'radio']]) {
      const s = U[k];
      if (!ok(s)) continue;
      try { for (const e of s.eventsBetween(from, now)) if (e.type !== 'market.open') all.push(Object.assign({}, e, { source: src })); } catch (e) { /* that desk is quiet */ }
    }
    if (L) for (const r of L.races) { const fin = r.startMs + r.winner.finishMs; if (fin >= from && fin < now) all.push({ time: new Date(fin).toISOString(), source: 'glacial', importance: r.kind === 'gp' ? 5 : 3, headline: G.PX[r.winner.id].name + ' wins ' + (r.kind === 'gp' ? 'the ' + r.name : 'Daily Crawl #' + r.number) + ' by ' + Math.round(r.marginPx) + ' pixels' }); }
    all.sort((a, b) => (a.time < b.time ? 1 : -1));
    $('wire-list').innerHTML = all.length ? all.slice(0, 18).map((e) => { const s = SOURCES[e.source] || [e.source, '#8496A0']; return '<li' + (e.importance >= 4 ? ' class="big-news"' : '') + '><time>' + hm(Date.parse(e.time)) + '</time><span>' + esc(e.headline) + '<span class="src" style="--c:' + s[1] + '">' + s[0] + '</span></span></li>'; }).join('')
      : '<li class="dim">A quiet day across the universe.</li>';
  }

  // ---------------------------------------------------------------- open the windows, one at a time, so the page appears at once
  const steps = [lede, race, city, weather, senate, book, news, census, museum, wire];
  (function next() { const s = steps.shift(); if (!s) return; try { s(); } catch (e) { console.error(e); } setTimeout(next, 0); })();
  setInterval(() => { lede(); try { race(); } catch (e) { /* keep the last frame */ } }, 5000);
  setInterval(() => { try { city(); } catch (e) { /* keep the last view */ } }, 20000);
  setInterval(() => { for (const f of [weather, senate, book]) { try { f(); } catch (e) { /* keep the last view */ } } }, 60000);
  setInterval(() => { for (const f of [news, census, museum, wire]) { try { f(); } catch (e) { /* keep the last view */ } } }, 10 * 60000);
})();
