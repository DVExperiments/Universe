# Pixel Universe: Shared Conventions

Oct 23, 2026 · @Dylan · revised for City v3, the Exchange, Society, the Bank and the University

## Purpose and core principles

The Pixel Universe is a set of static GitHub Pages sites that share one world, built on Glacial's model: no server, no database, everything computed in the browser from the date. These rules apply to every site.

1. **The universe is a pure function of time.** Given a moment, any browser computes the same state and the same full history. Nothing is stored server-side.
2. **Alive without users.** Visitors watch; they don't steer. The only user action is betting on races, kept in each visitor's own browser.
3. **Dependencies flow one way.** A site may read from sites upstream of it, never downstream. No cycles.
4. **Cosmetic influence only across sites.** One site may change how another looks or reads, never what happens in it. Race outcomes, schedules and ratings are never affected by anything outside Glacial.
5. **History never gets rewritten.** Any change that would alter past results is handled as a new era (see Hosting, repo layout, versioning and eras).
6. **Everything happens slowly, is tracked, and is reported with total sincerity.**

## Site map and dependency order

Sites are listed upstream first. Each may read only from sites above it in this table.

| Site | Tier | Reads from | Can influence |
| --- | --- | --- | --- |
| Glacial (the race) | Root | Time only | Nothing; race outcomes are the root of the universe. Links to the Bookmaker. |
| Climate (Weather Bureau base) | Root | Time only | Base seasons and weather for everything below |
| Pixel Senate | World loop | Roots, plus yesterday's city and ecosystem | Cosmetics of every site; city policies |
| Pixel City (hub) | World loop | Roots, plus yesterday's laws and ecosystem | City, pollution |
| Ecosystem | World loop | Climate, plus yesterday's city pollution | Local weather, wildlife, smog, city mood |
| Census Office (City `census.js`) | World loop | City, the Exchange, Society | Working lives, homes, wellbeing, student loans, mortgages |
| Pixel Exchange (with Freight and the Bank) | World loop | City, the census register, Society | Business, prices, credit, freight; shop demand |
| Pixel City Society (City `society.js`) | World loop | City, the Exchange, Weather | Crazes (FM, shops, Senate colour bills), migration, election swings, needs |
| Bookmaker | Reader | Glacial, world loop | Its own odds and pages |
| The newspaper | Reader | Everything | Nothing |
| Pixel FM, Pixel High, Job Centre, University, Bank site, Museum, Universe hub | Readers | Anything upstream | Their own pages only (Pixel FM plays Society's song crazes) |

The universe has three tiers:

1. **Roots** (Glacial, Climate) are pure functions of time and read nothing else.
2. **The world loop** (Senate, City, Ecosystem) can affect each other, but only with a one-day lag. One shared `universe.js` steps them together day by day from the epoch, so today's Senate reads yesterday's pollution, and today's city obeys laws passed yesterday. Feedback is allowed; same-day cycles are not.
3. **Readers** (Bookmaker, newspaper, future sites) read anything above and nothing reads them.

Nothing in any tier ever affects race outcomes.

### The loop, and the lag rule

Since Society, the world loop is wider: the Senate reads Society (elections, a fortnight late; colour bills, from crazes); Society reads the city and the Exchange (the day before); the Exchange reads the city and Society (crazes, population, needs, the day before); the census reads the Exchange and Society; the city reads the Senate. This is allowed only because every link looks back in time:

- **Never read ahead.** A run may only ask another for days it has already finished. Reading City's history 30 days ahead for speed once caused infinite recursion; everything that touches the Senate is read one day at a time.
- **Taste and opinion are separate runs.** Society's crazes read only the map and the weather, so Pixel FM, the Exchange and the Senate can read them freely; its opinions read the economy and are read by the Senate with a fortnight's lag.
- **Forward runs are re-entrant for earlier days.** A nested question about an earlier day is answered from checkpoints, never by moving the running state.

### Load order

Every page that loads the Senate must load the whole chain, in this order: Weather, Senate, City `universe.js`, City `census.js`, the Exchange `universe.js`, City `society.js`. Simulation dependencies are hard: without the chain the Senate, the census and the Exchange refuse to run. Glacial's style hook and the Pixel FM widget load the chain themselves.

## Time

The universe epoch is Glacial's existing `G.EPOCH` (in `js/league.js`), so every site's history starts on 3 December 2025 at 00:00 UTC, the first Daily Crawl.

- **All simulation uses UTC.** Local time is for display only.
- **A day starts at 00:00 UTC**, matching the Daily Crawl start.
- **Time is passed in, never read inside simulation code.** Functions take a timestamp argument; only the page's display loop calls `Date.now()`. This keeps simulations testable and lets any site ask "what was true at time T".
- **Coarse past, fine present.** Systems may simulate history in daily steps and only compute minute-level detail for the current day, to keep load times short as history grows.
- Sites that start later than the epoch (e.g. the Senate) declare their own start date. Before it, they return empty state and no events.

### Daily rhythm

The universe runs on one daily beat, and **00:00 UTC is the moment everything new begins**: the Daily Crawl starts, new laws take effect, and the newspaper turns its page. That is 1pm in New Zealand during daylight saving and noon in winter; the universe stays on UTC and local times shift.

| UTC | NZ (daylight saving) | What happens |
| --- | --- | --- |
| 19:00 | 8am | Senate sits: bills introduced and debated |
| 22:00 | 11am | Senate votes; bookmaker odds firm up for the next race |
| 23:30 | 12:30pm | Betting closes on the next race |
| 00:00 | 1pm | Race starts; passed laws take effect; new newspaper edition |

On Grand Prix days (the 1st of each month) the Senate is in recess, so the race has the day to itself.

## Randomness

Every random choice comes from a seeded generator, never `Math.random()` (except purely decorative animation that is never recorded or shown as fact).

- **One shared RNG implementation**, copied from Glacial's so race history is unaffected. Other sites use the same function.
- **Seeds are derived from a site name, a purpose, and a date**, e.g. `seed("senate", "bill", "2026-10-23")`. A string hash turns this into the number the RNG needs.
- **Each system gets its own seed stream.** Adding a new random call in the Senate must never shift the numbers the city or Glacial receive.
- **Within a stream, call order is fixed.** Adding a call in the middle of an existing stream changes history; add new calls on a new purpose seed instead.

Glacial already defines the shared functions in `js/sim.js`: `G.rng(seed)` (a mulberry32 generator) and `G.hash(string)` (32-bit FNV-1a). Every site uses these exact functions.

- **Seed strings start with the site name**, e.g. `G.rng(G.hash("senate:bill:2026-12-03"))`. Glacial's existing seeds (race ids like `C-2026-10-23`, and `pair:` + race id) must never be reused by other sites.
- **Simulation maths uses only +, -, \*, /, `Math.floor` and `Math.imul`**, as Glacial's simulator does. Functions like `Math.sin`, `Math.exp` and `Math.pow` can differ slightly between browsers and would make visitors see different histories. Display code may use anything.

### Start dates

Each system that changes what happens declares its start date, and must be live before it: working lives 30 November 2026; freight and Society 1 December 2026; the Bank 1 February 2027; migration, glitches and the University 1 March 2027; Society-driven elections from May 2027; rents 1 June 2027; wellbeing, choices and staff turnover 1 September 2027. Changes that only explain or display (causes, the map, the health dashboard) can go live at any time.

## Event format

Every site describes notable happenings as events in one shared shape, so the newspaper and other sites can read any site's events, including sites built later.

```json
{
  "id": "glacial:race-412:finish",
  "time": "2026-10-23T22:41:07Z",
  "source": "glacial",
  "type": "race.finish",
  "importance": 3,
  "data": { "race": 412, "winner": "Crimson", "margin_px": 3 },
  "headline": "Crimson edges Azure by 3 pixels in Race #412"
}
```

| Field | Rule |
| --- | --- |
| `id` | Unique and stable: `<source>:<thing>:<what>`. The same event always gets the same id. |
| `time` | UTC ISO 8601. |
| `source` | The site's short name: `glacial`, `senate`, `city`, `weather`. |
| `type` | `<area>.<verb>`, lowercase, e.g. `race.finish`, `bill.passed`, `city.blackout`. |
| `importance` | 1 (trivia) to 5 (front page). The newspaper uses it to pick headlines. |
| `data` | Site-specific details. Readers must tolerate fields they don't know. |
| `headline` | One plain sentence, written in-universe, so any reader can show the event without understanding it. Never changed once published. |
| `data.causes` | Optional: why it happened, as `[{ cause, label, share }]` (share in %). Added without changing headlines; readers that know it explain the event. |

Sources in use: `glacial`, `weather`, `senate`, `city`, `bookmaker`, `commerce`, `freight`, `bank`, `society`, `university`, `radio`, `paper`, `museum`.

Events are generated, not stored: each site exposes a function that returns its events for a time range.

## Read-only API pattern

Each site publishes one script, `universe.js`, at its Pages URL (e.g. `dvexperiments.github.io/Senate/universe.js`). It registers a global object under `window.PixelUniverse.<source>` and exposes only pure, read-only functions of time:

```js
PixelUniverse.senate = {
  startDate: "2026-11-01",
  stateAt(time) { /* laws in effect, seats, etc. */ },
  eventsBetween(from, to) { /* array of events */ },
  version: "1.0.0"
};
```

- **Simulation and rendering are separate files.** `universe.js` contains no DOM code, so other sites can load it safely.
- **Upstream scripts load first**, in dependency order, via plain `<script>` tags. All sites share the `dvexperiments.github.io` origin, so no CORS setup is needed.
- **Every consumer has a fallback.** If an upstream script fails to load, the page keeps working with defaults (e.g. Glacial shows its standard colours).
- **No site writes to another.** The only writes anywhere are betting slips in the visitor's own localStorage.
- **Simulation dependencies are hard dependencies.** A site whose history depends on another site’s `universe.js` (as the Senate depends on the Weather Bureau’s) must refuse to run if that script fails to load, rather than fall back, because a fallback would compute a different history from every other visitor. Cosmetic readers like Glacial’s `universe-hook.js` may fall back to defaults. Load order is always Weather, then Senate, then anything that reads them.

## Senate laws

Laws change how things look or read, never what happens. A law takes effect from the next 00:00 UTC after it passes.

| Allowed | Not allowed |
| --- | --- |
| Colours, applied as CSS variables | Pixel speed, traits or race results |
| Fonts and font sizes | Race schedules or Grand Prix entry |
| Track and background colour | Ratings, standings or records |
| Names of trophies, streets, buildings | Anything recorded as a statistic |
| Commentary tone and wording | Betting odds or payouts |
| City policies (power, lighting, construction) | Anything in an upstream site's simulation |

Each law has a stable key (e.g. `style.background`), a value, and a default. Consumer sites only read keys they know and apply the default when a key is missing. Past races may be displayed in the colours that were law at the time; that is cosmetic and allowed.

### Environmental policy

Beyond cosmetics, the Senate's main real power is over the city's environment. These bills feed the world loop and take effect the next day:

- **Energy mix:** commissioning or retiring power plants, solar and wind subsidies, coal (pixel-coal) phase-outs.
- **Emissions limits:** caps on factory output, traffic restrictions, smog-day emergency measures.
- **Green space:** new parks, protected wildlife zones, tree-planting programmes.
- **Trade-offs are real:** clean energy costs more, so budgets tighten, construction slows and blackouts become more likely during the transition.

Senators have environmental leanings (green, industrial, indifferent) alongside their party, and the ecosystem's state yesterday shapes which bills get introduced today. A bad smog week should reliably produce a flurry of clean-air legislation, some of which fails.

## Bookmaker and betting

The Bookmaker is its own site, entered from a button on Glacial or from its building in the city. Pixel residents of the city bet there, their bets move the odds, and visitors bet alongside them. Odds never affect results.

- **Glacial's only change is a "Place a bet" button** linking to the Bookmaker, ideally pre-selecting the current or next race. Glacial loads nothing from it.
- **The Bookmaker is a reader:** it reads Glacial (ratings, form, live race state) and the world loop (city residents, weather), and nothing reads it. The newspaper may report on it.
- **Pixel bettors are real city residents**, with bankrolls, favourite pixels and superstitions, so a resident's win or ruin can be followed across sites.
- **Odds are a function of time:** opening odds from ratings and form, drifting as pixel bets arrive, then moving in-running as the race unfolds (a long nap lengthens a pixel's price).
- **Visitor bets live in the visitor's localStorage**, in play money. All sites share the `dvexperiments.github.io` origin, so Glacial can read the slips to show "your bet" on the race page if wanted. Odds are fixed when the slip is made and settle against the deterministic result.

### Visitor bankroll

Every visitor gets the same play money, on the same schedule, however much they watch. In-universe, the pixels pay visitors for the clean energy their screens generate while watching.

| Rule | Proposed value |
| --- | --- |
| Currency | Watts (W) |
| Starting bankroll | 1,000 W on first visit |
| Minimum stake | 10 W |
| Monthly stipend | 500 W, credited on the first visit on or after the 1st (Grand Prix day) |
| Missed months | No back pay; one stipend per calendar month |
| Hoarding | Allowed; no cap on balance |
| Annual reset | Every wallet returns to 1,000 W at 00:00 UTC on 1 January, then January's stipend is added as usual |
| Stray sparks bonus | 25 to 100 W per spark caught |

- **Stray sparks** are escaped energy pixels that appear briefly at random spots across the city. Clicking one returns it to the grid and the residents tip you.
- **Sparks are shared and deterministic:** their times and places come from a seed (e.g. `city:spark:<hour>`), so everyone watching sees the same spark at the same moment. Only the catch is recorded, in the visitor's own storage, and each spark can be caught once per visitor.
- **Roughly two or three sparks a day**, at unannounced times, so catching one feels lucky rather than like a chore.
- **Everything is stored locally.** Clearing browser data restarts the bankroll at 1,000 W. Without a server there's no way to stop someone editing their own balance, so there are no cross-visitor leaderboards for bettors.

In-universe, the annual reset is the **closing of the energy year**: the pixels settle their accounts, and the newspaper can run an end-of-year piece on the season's biggest pixel winners and losers among residents. The universe stays free and server-free for now; visitor leaderboards and server-side records are a possible future step if the project grows.

## Weather, climate and ecosystem

Seasons follow the Southern Hemisphere: summer peaks in January, winter in July. Weather comes from two layers, and neither ever touches race outcomes.

- **Climate (root).** A pure function of time giving season, temperature, rain and wind fronts that take days to arrive. Glacial's existing day/night effect stays as it is and never reads weather.
- **Ecosystem (world loop).** Modifies the climate locally based on what the city did yesterday. Pollution from power plants and traffic builds smog, warms the city slightly, and shifts what lives there. Parks, clean-energy laws and quiet days let it recover.
- **Living things.** Pixel birds, insects and plants have populations that rise and fall with season and pollution, tracked like any other statistic. Migrations, blooms and die-offs make news.
- **Feedback loop.** Smog raises city health complaints, the Senate debates clean-air bills, laws change the city's power mix, and the ecosystem slowly responds. Each step lags a day, so a full cycle plays out over weeks.
- **The Weather Bureau** displays both layers, publishes a forecaster pixel's imperfect daily predictions with a running accuracy record, and reports air quality.
- **Elsewhere,** weather sets skies and lighting on every site, crowd sizes at the stadium, and pixel bettors' superstitions at the Bookmaker.

## Hosting, repo layout, versioning and eras

Each site is its own public repo under `DVExperiments`, published with GitHub Pages at `dvexperiments.github.io/<Repo>/`.

```
<Repo>/
  index.html
  universe.js     simulation only, safe for other sites to load
  js/             rendering, views, app code
  css/
  README.md       links back to this conventions doc
```

- **Shared helpers (RNG, seed hashing, event helpers)** live in Glacial's repo as `js/shared.js` until a second site needs them, then move to a small `Universe` repo that every site loads first.
- **Versioning:** each `universe.js` carries a semantic version. A change that alters past results is a major version bump and needs an era.
- **Eras:** to change rules without rewriting history, freeze the old era (keep its code, or bake its results into a JSON snapshot) and start the new rules from a declared date. Present it in-universe: a new racing season, a constitutional reform.
- **Snapshots:** if replaying history gets slow, a site may ship a checkpoint JSON of state at a past date and simulate only from there.

## Visual and tone rules

Every site should look and sound like it belongs to Glacial.

- **Palette and type come from Glacial's `css/`.** Define them once as CSS variables with the same names on every site, so Senate laws can change them everywhere at once.
- **Pixels are the actors.** Keep Glacial's pixel scale; characters are single pixels or small pixel clusters, never detailed sprites.
- **The sixteen Glacial pixels are celebrities** across the universe and can be referenced anywhere by their names from `js/pixels.js`.
- **Stats everywhere.** Every actor has a profile, history and records page.
- **Deadpan voice.** Commentary and headlines are written like serious sports or political journalism about trivial things. No winking at the joke.
- **Slow motion.** Nothing should change faster than a careful watcher would notice. Big moments are rare and earned.

## The digital society

Pixel City is a place on a screen. Businesses make and sell what pixels use (charge, colour, shading, patches, the race feed, sprites); industry is render plants, refineries, foundries and compression works; roads are data buses and the river a data stream. Districts behave like their names (see City's `look.js` and `CITY_V3.md`). New names, trades and titles should follow suit.

## World health

`Universe/health.html` checks the universe holds together: every site ready, fresh data, unique and well-formed events, closures with causes, citizens counted the same way twice, no impossible balances, cross-references intact, and determinism. Run it after every deployment.

## New site checklist and open questions

Before building any new site, confirm:

- [ ] It works with zero user input and is still worth watching.
- [ ] Its place in the dependency order is decided, and it reads only from upstream sites.
- [ ] It influences other sites cosmetically or not at all.
- [ ] It has its own seed streams and a declared start date.
- [ ] It exposes `universe.js` with `stateAt`, `eventsBetween` and `version`.
- [ ] Its events use the shared format, with in-universe headlines.
- [ ] It falls back gracefully when upstream scripts fail.
- [ ] It has a building in the city (and appears in the map's Buildings panel).
- [ ] Every page that loads the Senate loads the whole chain, in order.
- [ ] Its first effects start on a declared date after it goes live.
- [ ] World health still passes.

Open questions:

- [x] Epoch and RNG confirmed from `js/league.js` and `js/sim.js` (see Time and Randomness).
- [x] Betting: a Bookmaker building with pixel bettors moving the odds; visitors bet on Glacial.
- [x] Weather Bureau will exist (see Weather Bureau).
- [x] Senate first sitting: proposed for 3 December 2026, Glacial's first anniversary, at 19:00 UTC (8am NZ).
- [ ] Bankroll: hoarding allowed, full wallet reset each 1 January (decided; see Visitor bankroll).
- [ ] Seasons: Southern Hemisphere, with a city-influenced ecosystem (decided; see Weather, climate and ecosystem).
