/*
 * The Emergent Behaviour Log: things that happened in the Pixel Universe that nobody wrote.
 *
 * No site is told to make any of these happen. Each is found by a watcher reading the events every site has already
 * published, and is logged only when its whole chain has actually happened, with every link a real published event.
 * Nothing here is invented: the hypothetical examples that explain each watcher are kept apart (WATCHERS[].example)
 * and are never mixed into the log.
 *
 * Each entry says how its parts are connected:
 *   linked       the systems involved really do read one another, so one part helped cause the next
 *   one system   many actors inside one site, with no instruction to act together
 *   coincidence  the systems involved never read one another; it simply happened at the same time
 *
 * A reader: it reads every site's eventsBetween and nothing reads it. Pure, deterministic, no DOM.
 * Registers window.PixelUniverse.emergence. Load after the sites it reads (any that are missing are skipped).
 */
(function (root) {
  'use strict';

  const VERSION = '1.0.0';
  const H = 3600000, DAY = 86400000;
  const EPOCH = Date.UTC(2025, 11, 3);
  // the sites the watchers read; the census, the Job Centre and Pixel High are left out because replaying their whole
  // history is slow, and everything the watchers need from them is echoed in these
  const SOURCES = ['climate', 'city', 'senate', 'commerce', 'freight', 'bank', 'society', 'bookmaker'];
  const SITE = { climate: 'Weather Bureau', weather: 'Weather Bureau', city: 'Pixel City', senate: 'Senate', commerce: 'Exchange', freight: 'Freight', bank: 'Bank', society: 'Society', bookmaker: 'Bookmaker' };
  const SITE_URL = { climate: 'Weather/', weather: 'Weather/', city: 'City/', senate: 'Senate/', commerce: 'Exchange/', freight: 'Exchange/#/freight', bank: 'Bank/', society: 'City/society.html', bookmaker: 'Bookmaker/' };

  const U = () => root.PixelUniverse || {};
  const pad = (n) => (n < 10 ? '0' : '') + n;
  const ymd = (ms) => { const d = new Date(ms); return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); };
  const iso = (ms) => new Date(ms).toISOString().replace('.000Z', 'Z');
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const longDate = (ms) => { const d = new Date(ms + 12 * H); return d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); };
  const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
  const word = (n) => (n < WORDS.length ? WORDS[n] : String(n));
  const plural = (n, one, many) => word(n) + ' ' + (n === 1 ? one : many || one + 's');
  const list = (xs) => (xs.length <= 2 ? xs.join(' and ') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1]);
  const lc = (s) => s.charAt(0).toLowerCase() + s.slice(1);

  /** A link in a chain: a real published event. */
  const link = (e) => ({ id: e.id, site: e.source === 'weather' ? 'climate' : e.sourceKey || e.source, siteName: SITE[e.sourceKey || e.source] || e.source, time: e.ms, headline: e.headline });

  // ================================================================ the watchers
  // Each reads the whole record (by type) up to t and returns entries whose every link happened by t.
  // example: a made-up illustration of what the watcher looks for, with no real names, so it can never be mistaken for
  // something that happened. It is never an entry.
  const WATCHERS = [
    {
      key: 'smog', name: 'The smog answered', connection: 'linked',
      looks: 'A smog alert in the city, followed within a month by answers from at least two other parts of the universe: the Senate passing an environmental law, communities changing sides because of the air, or pixels leaving the city.',
      via: 'The Senate reads yesterday\u2019s smog, Society\u2019s communities read the air, and the city obeys yesterday\u2019s laws.',
      example: 'Smog settles over the city one week. Nine days later the Senate retires a coal plant, and a choir in one district turns to Verdant, citing the air.',
      find(R, t) {
        const out = [];
        for (const s of R('city.smog')) {
          const end = Math.min(s.ms + 30 * DAY, t);
          const within = (type, f) => R(type).filter((e) => e.ms > s.ms && e.ms <= end && (!f || f(e)));
          const laws = within('bill.passed', (e) => R.bill(e.data.bill) && R.bill(e.data.bill).data.kind === 'environmental');
          const turns = within('society.turns', (e) => (e.data.causes || []).some((c) => c.cause === 'smog'));
          const left = within('society.migration', (e) => (e.data.causes || []).some((c) => c.cause === 'smog' && c.share >= 50));
          const sites = (laws.length ? 1 : 0) + (turns.length || left.length ? 1 : 0);
          if (sites < 2 || !laws.length) continue;
          const last = laws.concat(turns, left).sort((a, b) => a.ms - b.ms);
          // logged from the moment the second direction answered; the entry keeps growing until the month is out
          const qualified = Math.max(laws[0].ms, Math.min(turns.length ? turns[0].ms : Infinity, left.length ? left[0].ms : Infinity));
          const parts = [];
          if (laws.length) parts.push('the Senate passed ' + (laws.length === 1 ? 'the ' + laws[0].data.title : plural(laws.length, 'environmental law')));
          if (turns.length) parts.push(plural(turns.length, 'community', 'communities') + ' changed sides because of the air');
          if (left.length) parts.push('pixels left the city, most of them because of the smog');
          out.push({ anchor: s, time: qualified, links: [s].concat(last.slice(0, 5)),
            title: 'The smog was answered from ' + word(sites + 1) + ' directions',
            text: 'After the smog alert of ' + longDate(s.ms) + ', ' + list(parts) + '. No part of the universe was told to respond to the others; each read the air for itself.' });
        }
        return out;
      }
    },
    {
      key: 'storm', name: 'A storm reached every corner', connection: 'linked',
      looks: 'A named storm whose effects show up in at least three other sites: ships held off the harbour, shelves emptying, the Senate adjourning, shortages at the Exchange, or businesses closing in the following fortnight because their deliveries never came.',
      via: 'The harbour reads the wind, freight reads the harbour, the shops read the freight, and the Senate reads the weather.',
      example: 'A named storm arrives. Two container ships wait outside the harbour, shelves run low in six districts, and the Senate adjourns for the day.',
      find(R, t) {
        const out = [];
        for (const a of R('storm.arrives')) {
          const name = a.data.storm, clears = R('storm.clears').filter((c) => c.data.storm === name)[0];
          if (!clears || clears.ms > t) continue;
          const from = a.ms - DAY, to = Math.min(clears.ms + 3 * DAY, t);
          const got = (type, f) => R(type).filter((e) => e.ms >= from && e.ms <= to && (!f || f(e)));
          const groups = [
            ['the harbour', got('port.held')],
            ['the shops', got('freight.shelves').concat(got('freight.rawlow'))],
            ['the Senate', got('senate.adjourned', (e) => e.data.storm === name).concat(got('bill.emergency', (e) => (e.data.title || '').indexOf(name) >= 0))],
            ['the Exchange', got('market.shortage')],
            ['businesses that closed for want of deliveries', R('business.closed').filter((e) => e.ms >= a.ms && e.ms <= Math.min(clears.ms + 14 * DAY, t) && (e.data.causes || []).some((c) => /deliver/.test(c.label) && c.share >= 50))]
          ].filter((g) => g[1].length);
          if (groups.length < 3) continue;
          const links = [a]; for (const g of groups) links.push(g[1][g[0].indexOf('closed') >= 0 ? g[1].length - 1 : 0]);
          links.sort((x, y) => x.ms - y.ms);
          const firsts = groups.map((g) => g[1][0].ms).sort((x, y) => x - y); // logged once the third part had felt it
          out.push({ anchor: a, time: Math.max(a.ms, firsts[2]), links,
            title: name + ' reached ' + word(groups.length) + ' parts of the universe',
            text: name + ' was felt by ' + list(groups.map((g) => g[0])) + '. The storm only ever touched the weather; everything after it happened because each site reads the one before.' });
        }
        return out;
      }
    },
    {
      key: 'loop', name: 'The lights went out on a law', connection: 'linked',
      looks: 'A coal plant switched off by law, rolling blackouts within three weeks, and a bill to bring coal back within a month of the blackouts.',
      via: 'The city obeys the Senate\u2019s laws, its grid decides the blackouts, and the Senate reads the city.',
      example: 'A coal plant is switched off by law. On a calm evening a fortnight later a district goes dark, and a senator introduces a bill to commission a new coal plant.',
      find(R, t) {
        const out = [];
        for (const c of R('city.closure').filter((e) => e.data.type === 'coal')) {
          const b = R('city.blackout').filter((e) => e.ms > c.ms && e.ms <= Math.min(c.ms + 21 * DAY, t))[0];
          if (!b) continue;
          const back = R('bill.introduced').filter((e) => e.ms > b.ms && e.ms <= Math.min(b.ms + 30 * DAY, t) && e.data.change && e.data.change.key === 'policy.coalPlants' && e.data.change.delta > 0)[0];
          if (!back) continue;
          const passed = R('bill.passed').filter((e) => e.data.bill === back.data.bill && e.ms <= t)[0];
          const links = [c, b, back].concat(passed ? [passed] : []);
          out.push({ anchor: c, time: links[links.length - 1].ms, links,
            title: 'The city asked for the lights back',
            text: c.data.name + ' was switched off on ' + longDate(c.ms) + '. ' + longDate(b.ms) + ' brought rolling blackouts, and the ' + back.data.title + ' followed' + (passed ? ', and passed' : '') + '. A law, its consequence and its reversal, with no one steering.' });
        }
        return out;
      }
    },
    {
      key: 'craze', name: 'A craze became the law', connection: 'linked',
      looks: 'A colour craze that starts in one community and ends as a Senate law changing the colours of every site in the universe.',
      via: 'The Senate\u2019s colour debates read Society\u2019s crazes, and every site reads the Senate\u2019s laws.',
      example: 'A hobby club in one district takes up a shade of cyan. Three weeks later a background hue bill passes, and every page in the universe turns slightly bluer.',
      find(R, t) {
        const out = [];
        for (const p of R('bill.passed')) {
          const intro = R.bill(p.data.bill), craze = intro && intro.data.change && intro.data.change.craze;
          if (!craze) continue;
          const fad = R('fad.start').filter((e) => e.data.item === craze && e.ms < intro.ms).slice(-1)[0];
          const law = R('law.in_effect').filter((e) => e.data.bill === p.data.bill && e.ms <= t)[0];
          const links = (fad ? [fad] : []).concat([intro, p]).concat(law ? [law] : []);
          out.push({ anchor: p, time: links[links.length - 1].ms, links,
            title: craze + ' went from a craze to the law',
            text: (fad ? 'The ' + fad.data.community + ' took up ' + craze + ' on ' + longDate(fad.ms) + '. ' : 'A craze for ' + craze + ' swept the city. ') + 'The ' + p.data.title + ' passed ' + p.data.ayes + '\u2013' + p.data.noes + ', and the colours of every site in the universe followed a fashion.' });
        }
        return out;
      }
    },
    {
      key: 'flipflop', name: 'Built, closed, built again', connection: 'linked',
      looks: 'The same site in the city closed twice within four months, as the Senate\u2019s laws pull it one way and then the other.',
      via: 'The city builds and clears its sites as the Senate\u2019s laws say.',
      example: 'A wind farm is cleared in March, rebuilt in April and cleared again in June.',
      find(R, t) {
        const out = [], by = {};
        for (const e of R('city.closure')) (by[e.data.site] = by[e.data.site] || []).push(e);
        for (const k in by) {
          const xs = by[k];
          for (let i = 1; i < xs.length; i++) {
            if (xs[i].ms - xs[i - 1].ms > 120 * DAY || xs[i].ms > t) continue;
            const reopened = R('city.opened').filter((e) => e.data.site === xs[i].data.site && e.ms > xs[i - 1].ms && e.ms < xs[i].ms)[0];
            const links = [xs[i - 1]].concat(reopened ? [reopened] : [], [xs[i]]);
            out.push({ anchor: xs[i], time: xs[i].ms, links,
              title: xs[i].data.name + ' closed twice',
              text: xs[i].data.name + ' closed on ' + longDate(xs[i - 1].ms) + (reopened ? ', reopened on ' + longDate(reopened.ms) : '') + ' and closed again on ' + longDate(xs[i].ms) + '. Each closure was by order of the Senate, but no senator ever voted for the back and forth: each vote was on the bill in front of them.' });
          }
        }
        return out;
      }
    },
    {
      key: 'record', name: 'The weather set a record, and so did the grid', connection: 'linked',
      looks: 'A temperature record and a record for the city\u2019s power demand on the same day or the next.',
      via: 'The city\u2019s demand for power rises with heating on cold days and cooling on hot ones.',
      example: 'The coldest night on record, and the next evening the city draws more power than ever before.',
      find(R, t) {
        const out = [];
        for (const w of R('weather.record').filter((e) => e.data.kind === 'min' || e.data.kind === 'max')) {
          const c = R('city.record').filter((e) => e.ms >= w.ms - DAY && e.ms <= Math.min(w.ms + DAY + H, t))[0];
          if (!c) continue;
          out.push({ anchor: w, time: Math.max(w.ms, c.ms), links: [w, c].sort((a, b) => a.ms - b.ms),
            title: (w.data.kind === 'min' ? 'The coldest night' : 'The hottest day') + ' brought the highest demand',
            text: w.headline + ', and the city drew ' + c.data.peak + ' MW, more than ever before.' });
        }
        return out;
      }
    },
    {
      key: 'rebels', name: 'The rebels decided it', connection: 'one system',
      looks: 'A Senate vote won or lost by fewer votes than the number of senators who crossed the floor.',
      via: 'Forty-eight senators, each voting their own way.',
      example: 'A parks bill fails 23\u201324, after two senators vote against their own party.',
      find(R, t) {
        const out = [];
        for (const e of R('bill.passed').concat(R('bill.failed'))) {
          const reb = (e.data.rebels || []).length, margin = Math.abs((e.data.ayes || 0) - (e.data.noes || 0));
          if (!reb || reb * 2 < margin + 1) continue; // had they voted with their party, it would have gone the other way
          out.push({ anchor: e, time: e.ms, links: [e].concat(R('senate.rebellion').filter((x) => x.data.bill === e.data.bill && x.ms <= t).slice(0, 1)),
            title: 'The rebels decided the ' + e.data.title,
            text: 'The ' + e.data.title + (e.type === 'bill.passed' ? ' passed ' : ' failed ') + e.data.ayes + '\u2013' + e.data.noes + ', with ' + plural(reb, 'senator') + ' voting against their party. Had they voted with it, the result would have been the other way.' });
        }
        return out;
      }
    },
    {
      key: 'missed', name: 'The forecaster named the storm, then forecast fine weather', connection: 'one system',
      looks: 'A day the Bureau\u2019s forecaster called fine or dry, inside a named storm the Bureau itself had been watching.',
      via: 'The forecast and the storm watch come from the same Bureau, but the forecaster leans optimistic.',
      example: 'The Bureau names a storm on Monday. On Wednesday the forecaster calls a fine day, and 60 mm of rain falls.',
      find(R, t) {
        const out = [], done = new Set();
        for (const b of R('forecaster.bust')) {
          const name = /^Storm /.test(b.data.cond || '') ? b.data.cond : null;
          if (!name || done.has(name)) continue;
          done.add(name);
          const watch = R('storm.watch').filter((e) => e.data.storm === name && e.ms < b.ms).slice(-1)[0];
          out.push({ anchor: b, time: b.ms, links: (watch ? [watch] : []).concat([b]),
            title: 'Fine weather was forecast for ' + name,
            text: (watch ? 'The Bureau named ' + name + ' on ' + longDate(watch.ms) + '. ' : '') + b.headline + ', in the middle of ' + name + '.' });
        }
        return out;
      }
    },
    {
      key: 'closures', name: 'A street of closed shops', connection: 'one system',
      looks: 'Four or more businesses closing in one district within a fortnight, each deciding alone.',
      via: 'Every business sets its own prices and staff; none of them knows what the others are doing.',
      example: 'Four charge bars close in one district in a fortnight, each having lost its customers to the next.',
      find(R, t) {
        const out = [], by = {}, last = {};
        for (const e of R('business.closed')) (by[e.data.district] = by[e.data.district] || []).push(e);
        for (const d in by) {
          const xs = by[d];
          for (let i = 3; i < xs.length; i++) {
            if (xs[i].ms > t || xs[i].ms - xs[i - 3].ms > 14 * DAY || xs[i - 3].ms - (last[d] || -Infinity) < 60 * DAY) continue;
            let j = i; while (j + 1 < xs.length && xs[j + 1].ms - xs[i - 3].ms <= 14 * DAY && xs[j + 1].ms <= t) j++;
            const run = xs.slice(i - 3, j + 1); last[d] = xs[j].ms;
            const causes = {}; for (const e of run) for (const c of e.data.causes || []) causes[c.label] = (causes[c.label] || 0) + c.share;
            const top = Object.keys(causes).sort((a, b) => causes[b] - causes[a])[0];
            let jobs = 0; for (const e of run) jobs += e.data.jobs || 0;
            out.push({ anchor: run[0], time: run[run.length - 1].ms, links: run.slice(0, 5),
              title: word(run.length).charAt(0).toUpperCase() + word(run.length).slice(1) + ' businesses closed in ' + d + ' in a fortnight',
              text: run.map((e) => e.data.name).slice(0, 4).join(', ') + (run.length > 4 ? ' and others' : '') + ' closed between ' + longDate(run[0].ms) + ' and ' + longDate(run[run.length - 1].ms) + ', with ' + jobs + ' jobs lost' + (top ? '. The reason given most often: \u201c' + top + '\u201d' : '') + '.' });
            i = j;
          }
        }
        return out;
      }
    },
    {
      key: 'boombust', name: 'Boom, then bust', connection: 'one system',
      looks: 'Orders for one of the city\u2019s goods jumping and then falling (or the other way round) within two months.',
      via: 'Orders from beyond the margin move on their own; the city\u2019s plants hire and lay off in reply.',
      example: 'Orders for palettes jump by 18% in May and fall by 15% in June.',
      find(R, t) {
        const out = [], swings = R('market.boom').concat(R('market.slump')).sort((a, b) => a.ms - b.ms);
        for (let i = 1; i < swings.length; i++) {
          const a = swings[i - 1], b = swings[i];
          if (a.data.good !== b.data.good || a.type === b.type || b.ms - a.ms > 60 * DAY) continue;
          out.push({ anchor: b, time: b.ms, links: [a, b],
            title: 'Pixel City ' + a.data.good + ': ' + (a.type === 'market.boom' ? 'boom, then bust' : 'bust, then boom'),
            text: 'Orders for the city\u2019s ' + a.data.good + ' ' + (a.type === 'market.boom' ? 'jumped' : 'fell') + ' by ' + Math.abs(a.data.change) + '% on ' + longDate(a.ms) + ', and ' + (b.type === 'market.boom' ? 'jumped' : 'fell') + ' by ' + Math.abs(b.data.change) + '% ' + Math.round((b.ms - a.ms) / DAY) + ' days later.' });
        }
        return out;
      }
    },
    {
      key: 'longshot', name: 'The outsider won', connection: 'one system',
      looks: 'A race won by a pixel the city\u2019s bettors had priced at 9.00 or longer.',
      via: 'The odds come from what the residents bet; the race never reads them.',
      example: 'The least-fancied pixel in the Daily Crawl wins at 12.00, and three regulars collect.',
      find(R, t) {
        return R('market.settled').filter((e) => e.data.sp >= 9).map((e) => ({ anchor: e, time: e.ms, links: [e],
          title: 'An outsider won at ' + e.data.sp.toFixed(2),
          text: e.headline + '. The city\u2019s bettors had made it an outsider; the race does not read the odds.' }));
      }
    },
    {
      key: 'stormgp', name: 'A storm on Grand Prix day', connection: 'coincidence',
      looks: 'A named storm over the city while the Grand Prix is being run.',
      via: 'Nothing: weather never touches a race, and the race never reads the weather.',
      example: 'A named storm arrives on the morning of a Grand Prix, and the crowds watch it in the rain.',
      find(R, t) {
        const out = [];
        for (const c of R('city.crowds')) {
          const gp = c.ms - 9 * H, gpEnd = gp + 46 * H;
          for (const a of R('storm.arrives')) {
            const cl = R('storm.clears').filter((x) => x.data.storm === a.data.storm)[0];
            const end = cl ? cl.ms : a.ms + 2 * DAY;
            if (a.ms > gpEnd || end < gp || a.ms > t) continue;
            out.push({ anchor: c, time: Math.max(a.ms, c.ms), links: [a, c].sort((x, y) => x.ms - y.ms),
              title: a.data.storm + ' over the Grand Prix',
              text: a.data.storm + ' was over the city during the Grand Prix of ' + MONTHS[new Date(gp).getUTCMonth()] + ' ' + new Date(gp).getUTCFullYear() + '. Neither knew about the other.' });
          }
        }
        return out;
      }
    }
  ];

  // ================================================================ reading the record
  let cache = null;
  function record(t) {
    if (cache && cache.t === t) return cache.R;
    const all = [];
    for (const key of SOURCES) {
      const s = U()[key];
      if (!s || typeof s.eventsBetween !== 'function' || (s.ready && !s.ready())) continue;
      try { for (const e of s.eventsBetween(EPOCH, t)) { const ms = e.ms !== undefined ? e.ms : Date.parse(e.time); if (ms <= t) all.push(Object.assign({}, e, { ms, sourceKey: key })); } }
      catch (err) { /* a site that fails is simply not read */ }
    }
    all.sort((a, b) => a.ms - b.ms || (a.id < b.id ? -1 : 1));
    const byType = {}, bills = {};
    for (const e of all) { (byType[e.type] = byType[e.type] || []).push(e); if (e.type === 'bill.introduced' || e.type === 'bill.emergency') bills[e.data.bill] = e; }
    const R = (type) => byType[type] || [];
    R.bill = (id) => bills[id] || null;
    cache = { t, R };
    return R;
  }

  /** Every entry whose whole chain had happened by t, newest first. */
  function entriesAt(t) {
    const R = record(t), out = [], seen = new Set();
    for (const w of WATCHERS) {
      let found = [];
      try { found = w.find(R, t); } catch (e) { found = []; }
      for (const f of found) {
        if (f.time > t || f.links.some((l) => l.ms > t)) continue; // nothing from the future
        f.links.sort((a, b) => a.ms - b.ms);
        const id = 'emergence:' + w.key + ':' + f.anchor.id;
        if (seen.has(id)) continue;
        seen.add(id);
        out.push({ id, watcher: w.key, watcherName: w.name, connection: w.connection, via: w.via, observed: true, time: f.time, iso: iso(f.time), date: ymd(f.time),
          title: f.title, text: f.text, links: f.links.map(link) });
      }
    }
    out.sort((a, b) => b.time - a.time || (a.id < b.id ? -1 : 1));
    return out;
  }

  root.PixelUniverse = root.PixelUniverse || {};
  root.PixelUniverse.emergence = {
    version: VERSION, source: 'emergence', SOURCES, SITE, SITE_URL,
    /** What each watcher looks for, how it is connected, and a clearly made-up example. */
    watchers: () => WATCHERS.map((w) => ({ key: w.key, name: w.name, connection: w.connection, looks: w.looks, via: w.via, example: w.example, hypothetical: true })),
    entriesAt,
    entriesBetween: (from, to) => entriesAt(to).filter((e) => e.time >= from)
  };
})(typeof window !== 'undefined' ? window : globalThis);
