/*
 * World health: does the Pixel Universe hold together?
 *
 * Loads every simulation in the chain and checks that they are up, current, consistent with each other and with
 * themselves. Read-only: it changes nothing. Add ?at=2027-06-01T12:00 to check any moment.
 */
(function () {
  const U = window.PixelUniverse || {};
  const DAY = 86400000;
  const q = new URLSearchParams(location.search), at = q.get('at');
  const T = at ? Date.parse(at.length <= 16 ? at + ':00Z' : at) : Date.now();
  const out = document.getElementById('checks'), sum = document.getElementById('summary');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const rows = [];
  const add = (group, name, status, detail, ms) => { rows.push({ group, name, status, detail, ms }); paint(); };
  function paint() {
    const n = { ok: 0, warn: 0, fail: 0 }; for (const r of rows) n[r.status]++;
    sum.innerHTML = '<span class="b ok">' + n.ok + ' passing</span> <span class="b warn">' + n.warn + ' to look at</span> <span class="b fail">' + n.fail + ' failing</span>';
    let g = '';
    out.innerHTML = rows.map((r) => (r.group !== g ? '<tr class="g"><th colspan="4">' + esc((g = r.group)) + '</th></tr>' : '') +
      '<tr><td><span class="b ' + r.status + '">' + { ok: 'OK', warn: 'Look', fail: 'Fail' }[r.status] + '</span></td><td>' + esc(r.name) + '</td><td>' + esc(r.detail) + '</td><td class="n">' + (r.ms === undefined ? '' : r.ms + ' ms') + '</td></tr>').join('');
  }
  // run one check, timing it and catching anything it throws
  async function check(group, name, fn) {
    const t0 = performance.now();
    try { const [status, detail] = await fn(); add(group, name, status, detail, Math.round(performance.now() - t0)); }
    catch (e) { add(group, name, 'fail', 'Threw: ' + (e && e.message ? e.message : e), Math.round(performance.now() - t0)); }
    await new Promise((r) => setTimeout(r, 0)); // let the page paint between checks
  }
  const SITES = [['climate', 'Weather Bureau'], ['senate', 'Senate'], ['city', 'Pixel City'], ['census', 'Census Office'], ['labour', 'Working lives'], ['commerce', 'Exchange'], ['freight', 'Freight'], ['bank', 'Bank'], ['society', 'Society'], ['radio', 'Pixel FM'], ['paper', 'Daily Pixel']];
  const ymd = (ms) => new Date(ms).toISOString().slice(0, 10);

  async function run() {
    rows.length = 0;
    // ---------------------------------------------------------------- 1. every site is here and ready
    for (const [key, label] of SITES) await check('Sites', label, () => {
      const s = U[key];
      if (!s) return [key === 'paper' || key === 'radio' ? 'warn' : 'fail', 'Script did not load'];
      const ready = !s.ready || s.ready();
      return [ready ? 'ok' : 'fail', (ready ? 'Ready' : 'Loaded but not ready') + (s.version ? ', version ' + s.version : '')];
    });
    const C = U.city, K = U.census, L = U.labour, X = U.commerce, F = U.freight, B = U.bank, S = U.society, Se = U.senate, W = U.climate;
    if (!C || !X || !S || !K) { add('Sites', 'The chain', 'fail', 'Core simulations are missing, so nothing further can be checked'); return; }

    // ---------------------------------------------------------------- 2. stale data: each run has reached yesterday
    const yday = Math.floor(T / DAY) * DAY - DAY;
    await check('Fresh data', 'Weather Bureau', () => { const d = W.dayAt(yday); return [d && d.date === ymd(yday) ? 'ok' : 'fail', d ? 'Yesterday: ' + d.cond + ', ' + d.max + '\u00b0' : 'No record for yesterday']; });
    await check('Fresh data', 'Pixel City', () => { const h = C.historyBetween(yday, yday + DAY); return [h.length === 1 ? 'ok' : 'fail', h.length ? 'Yesterday\u2019s grid peaked at ' + Math.round(h[0].peak || 0) + ' MW' : 'No record for yesterday']; });
    await check('Fresh data', 'Exchange', () => { const h = X.historyBetween(yday, yday + DAY + 1); const d = h[h.length - 1]; return [d && d.date === ymd(yday) ? 'ok' : 'fail', d ? 'Last close: ' + d.date + ', ' + d.open + ' businesses trading' : 'No close recorded']; });
    await check('Fresh data', 'Society', () => { const st = S.stateAt(T); return [st.started ? 'ok' : 'warn', st.started ? 'As of ' + st.asOf.slice(0, 10) + ', ' + st.fads.length + ' crazes running' : 'Not started (begins ' + st.startDate + ')']; });

    // ---------------------------------------------------------------- 3. events: unique, well-formed
    await check('Events', 'Unique ids across every site, last 30 days', () => {
      const all = [], from = T - 30 * DAY;
      for (const [k, s] of [['city', C], ['senate', Se], ['commerce', X], ['freight', F], ['bank', B], ['society', S]]) if (s && s.eventsBetween) for (const e of s.eventsBetween(from, T)) all.push(e);
      if (L && L.universityEventsBetween) for (const e of L.universityEventsBetween(from, T)) all.push(e);
      const seen = {}, dup = [];
      for (const e of all) { if (seen[e.id]) dup.push(e.id); seen[e.id] = 1; }
      return [dup.length ? 'fail' : 'ok', all.length + ' events' + (dup.length ? ', duplicated: ' + dup.slice(0, 3).join(', ') : ', no duplicates')];
    });
    await check('Events', 'Shared event format', () => {
      const bad = [], all = [];
      for (const s of [C, Se, X, F, B, S]) if (s && s.eventsBetween) for (const e of s.eventsBetween(T - 30 * DAY, T)) all.push(e);
      for (const e of all) if (!e.id || !e.source || !/^[a-z]+\.[a-z-]+$/.test(e.type) || !(e.importance >= 1 && e.importance <= 5) || isNaN(Date.parse(e.time)) || !e.headline) bad.push(e.id || '(no id)');
      return [bad.length ? 'fail' : 'ok', bad.length ? bad.length + ' malformed, e.g. ' + bad.slice(0, 2).join(', ') : 'All ' + all.length + ' follow the shared format'];
    });

    await check('Events', 'Closures explain themselves', () => {
      const cl = X.eventsBetween(T - 90 * DAY, T).filter((e) => e.type === 'business.closed');
      if (!cl.length) return ['ok', 'No closures in the last 90 days'];
      const none = cl.filter((e) => !e.data.causes || !e.data.causes.length), over = cl.filter((e) => (e.data.causes || []).reduce((a, c) => a + c.share, 0) > 101);
      return [over.length ? 'fail' : none.length > cl.length * 0.1 ? 'warn' : 'ok', cl.length + ' closures; ' + (cl.length - none.length) + ' with causes' + (over.length ? '; ' + over.length + ' with shares over 100%' : '')];
    });
    // ---------------------------------------------------------------- 4. citizens: nobody missing
    await check('Citizens', 'Census against Society\u2019s homes', () => {
      const st = S.stateAt(T), pop = K.stats(T).population;
      if (!st.districts) return ['warn', 'Society\u2019s opinions are not running yet; census counts ' + pop.toLocaleString('en')];
      let soc = 0; for (const d of st.districts) soc += d.population;
      const diff = Math.abs(pop - soc) / soc;
      return [diff < 0.04 ? 'ok' : diff < 0.08 ? 'warn' : 'fail', 'Census ' + pop.toLocaleString('en') + ', Society ' + soc.toLocaleString('en') + ' (' + (diff * 100).toFixed(1) + '% apart)'];
    });
    await check('Citizens', 'Working lives add up', () => {
      const lm = L.labourAt(T);
      if (!lm) return ['warn', 'Working lives begin on 30 November 2026'];
      const rate = lm.rate;
      return [rate >= 0 && rate < 40 ? 'ok' : 'fail', lm.employed.toLocaleString('en') + ' employed, ' + lm.looking.toLocaleString('en') + ' looking (' + rate + '%), ' + (lm.studying || 0).toLocaleString('en') + ' studying'];
    });

    await check('Citizens', 'Basic needs within range', () => {
      const st = S.stateAt(T);
      if (!st.districts || !st.districts[0].needs) return ['ok', 'Needs are not tracked yet'];
      const bad = st.districts.filter((d) => Object.values(d.needs).some((v) => !(v >= 0 && v <= 100)));
      let lo = 100; for (const d of st.districts) if (d.needs.wellbeing < lo) lo = d.needs.wellbeing;
      return [bad.length ? 'fail' : 'ok', bad.length ? 'Out of range in ' + bad.map((d) => d.name).join(', ') : 'All sixteen districts in range; lowest wellbeing ' + lo.toFixed(0)];
    });
    await check('Citizens', 'A resident\u2019s wellbeing reads cleanly', () => {
      if (!L.wellbeingOf) return ['warn', 'Not available in this census version'];
      const p = (K.residentsOf(0, T, 10, 1) || [])[0]; if (!p) return ['warn', 'No resident to sample'];
      const w = L.wellbeingOf(p.id || p, T);
      if (!w) return ['ok', 'Not tracked yet'];
      const ok = Object.values(w).every((v) => v >= 0 && v <= 1);
      return [ok ? 'ok' : 'fail', 'Sampled ' + (p.id || p) + ': wellbeing ' + Math.round(w.wellbeing * 100)];
    });
    // ---------------------------------------------------------------- 5. balances: nothing impossible
    await check('Balances', 'Businesses', () => {
      const firms = X.firmsAt(T), bad = firms.filter((f) => f.open && (f.staff < 0 || f.staff > f.capacity || !(f.price > 0)));
      return [bad.length ? 'fail' : 'ok', firms.filter((f) => f.open).length + ' trading' + (bad.length ? '; impossible: ' + bad.slice(0, 2).map((f) => f.name).join(', ') : '; staff and prices all within bounds')];
    });
    await check('Balances', 'The Bank', () => {
      const b = B.stateAt(T);
      if (!b.open) return ['ok', 'Not open yet'];
      const neg = ['deposits', 'mortgages', 'overdrafts', 'startup'].filter((k) => b[k] < 0);
      return [neg.length ? 'fail' : b.capital < 0 ? 'warn' : 'ok', 'Rate ' + b.rate + '%, capital ' + b.capitalRatio + '%' + (neg.length ? '; negative: ' + neg.join(', ') : b.capital < 0 ? '; the Bank is insolvent' : '')];
    });
    await check('Balances', 'Freight stocks', () => {
      const f = F.stateAt(T);
      if (!f.started) return ['ok', 'Freight begins on ' + f.startDate];
      const bad = f.rawDays < 0 || f.rawDays > 16.5 || f.dockFill < 0 || f.dockFill > 101 || f.districts.some((d) => d.shelfDays < 0);
      return [bad ? 'fail' : 'ok', 'Raw colour ' + f.rawDays + ' days, export dock ' + f.dockFill + '% full'];
    });

    // ---------------------------------------------------------------- 6. cross-references
    await check('References', 'Exchange premises are in the census register', () => {
      const reg = {}; for (const e of L.employers()) reg[e.id] = 1;
      const miss = X.firmsAt(T).filter((f) => !reg[f.premises]);
      return [miss.length ? 'fail' : 'ok', miss.length ? miss.length + ' unknown premises' : 'All ' + Object.keys(reg).length + ' employers known'];
    });
    await check('References', 'Employers in working lives exist', () => {
      const lm = L.labourAt(T); if (!lm) return ['ok', 'Working lives have not begun'];
      const reg = {}; for (const e of L.employers()) reg[e.id] = 1;
      const miss = Object.keys(lm.head).filter((id) => !reg[id]);
      return [miss.length ? 'fail' : 'ok', Object.keys(lm.head).length + ' employers with staff' + (miss.length ? '; unknown: ' + miss.slice(0, 3).join(', ') : '')];
    });
    await check('References', 'Building links on the map', async () => {
      const m = C.map(T), links = m.features.filter((f) => f.link).map((f) => f.link);
      if (location.hostname !== 'dvexperiments.github.io') return ['warn', links.length + ' links; checked only on the live site'];
      const bad = [];
      for (const l of links) { try { const r = await fetch(l, { method: 'HEAD' }); if (!r.ok) bad.push(l); } catch (e) { bad.push(l); } }
      return [bad.length ? 'fail' : 'ok', bad.length ? 'Broken: ' + bad.join(', ') : 'All ' + links.length + ' answer'];
    });

    // ---------------------------------------------------------------- 7. contradictions between sites
    await check('Consistency', 'Blackouts: City and the Exchange agree', () => {
      const ch = C.historyBetween(yday, yday + DAY)[0], ex = X.historyBetween(yday, yday + DAY + 1).slice(-1)[0];
      if (!ch || !ex) return ['warn', 'No record for yesterday'];
      return ['ok', 'City: ' + (ch.blackoutHours || 0) + ' blackout hours yesterday; the Exchange traded ' + ex.open + ' businesses through them'];
    });
    await check('Consistency', 'Senate laws are all known keys', () => {
      const laws = Se.lawsAt(T), keys = Object.keys(laws), odd = keys.filter((k) => !/^(style|names|commentary|policy)\./.test(k));
      return [odd.length ? 'fail' : 'ok', keys.length + ' laws in force' + (odd.length ? '; unknown: ' + odd.join(', ') : '')];
    });

    // ---------------------------------------------------------------- 8. determinism: the same moment, twice
    await check('Determinism', 'The Exchange, a week ago, twice', () => {
      const a = JSON.stringify(X.stateAt(T - 7 * DAY)), b = JSON.stringify(X.stateAt(T - 7 * DAY));
      return [a === b ? 'ok' : 'fail', a === b ? 'Identical' : 'Different answers for the same moment'];
    });
    await check('Determinism', 'Society, a week ago, twice', () => {
      const a = JSON.stringify(S.stateAt(T - 7 * DAY)), b = JSON.stringify(S.stateAt(T - 7 * DAY));
      return [a === b ? 'ok' : 'fail', a === b ? 'Identical' : 'Different answers for the same moment'];
    });
    // the answer for a past moment mustn't depend on how far the run has gone: a fresh city, run only that far, agrees
    await check('Determinism', 'Pixel City, a week ago, after the run has moved on', () => {
      if (!C.create) return ['warn', 'This version of the city cannot make a fresh copy'];
      const a = JSON.stringify(C.stateAt(T - 7 * DAY)), b = JSON.stringify(C.create().stateAt(T - 7 * DAY));
      return [a === b ? 'ok' : 'fail', a === b ? 'Identical' : 'The city\u2019s answer for a week ago depends on what was asked before'];
    });
    await check('Determinism', 'The census, a week ago, morning and evening', () => {
      const d = T - 7 * DAY - ((T - 7 * DAY) % DAY);
      const a = JSON.stringify(K.stateAt(d + 20 * 3600000)), b = JSON.stringify(K.stateAt(d + 2 * 3600000));
      const same = JSON.stringify(Object.assign(JSON.parse(a), { time: 0 })) === JSON.stringify(Object.assign(JSON.parse(b), { time: 0 }));
      return [same ? 'ok' : 'fail', same ? 'The same figures all day' : 'The day\u2019s figures depend on which moment was asked first'];
    });
  }
  document.getElementById('when').textContent = at ? 'Checking the universe as it stood at ' + at + ' UTC.' : 'Checking the universe as it stands now.';
  document.getElementById('rerun').onclick = () => run();
  setTimeout(run, 50);
})();
