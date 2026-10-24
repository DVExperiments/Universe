# The Pixel Universe

The hub of the Pixel Universe, and the toolkit every site shares. Published at `dvexperiments.github.io/Universe/`.

Follows the [Pixel Universe Shared Conventions](../Pixel_Universe_Shared_Conventions.md). This is the "small `Universe` repo that every site loads first" the conventions planned for shared helpers.

## What's here

| File | What it is |
| --- | --- |
| `index.html`, `hub.js`, `hub.css` | The hub: a live window onto every site |
| `nav.js` | The universe bar, the navigation across the top of every site |
| `shared.js` | Shared helpers: the universe's RNG and hash, seeds, dates, and applying the Senate's style laws |
| `wallet.js` | The visitor's wallet (canonical copy) |
| `tools/serve.py` | The local universe, for testing changes across sites before publishing |

## The hub

Windows onto every site, each live and each a link to its site:

- **Pixel City:** the city's own map (City v3: data buses, the data stream, the frame border, and districts that behave like their names), with day and night, lit windows, blackouts, smog, and whatever the Senate has built. Needs City's `look.js` loaded before its `map.js`.
- **Glacial:** the race in progress, pixel by pixel.
- **The Daily Pixel:** today's front page.
- **The Senate:** the countdown to the founding election; once it sits, the chamber's make-up and its latest news.
- **The Weather Bureau:** conditions now and Isobar's forecast.
- **Pixel FM:** the radio itself, docked in its window.
- **The Bookmaker, the Census Office, the Museum:** the next race's prices, the city's mood and its resident of the day, and the collection.
- **The wire:** everything that happened in the last 24 hours, everywhere.

Each window copes on its own if its site can't be reached.

## The universe bar

One bar across the top of every page: every site, each with a dropdown of its areas, plus city time and the visitor's balance. Each site keeps its own tabs underneath, the way an app has its own toolbar.

**Adding the bar to a page.** Put this straight after the page's skip link, or first in `<body>`:

```html
<script src="https://dvexperiments.github.io/Universe/nav.js" data-site="city"></script>
```

`data-site` is one of `glacial`, `city`, `senate`, `weather`, `bookmaker`, `paper`, `radio`, `museum`, or `universe`.

**Adding a site, or an area of a site.** Edit `SITES` near the top of `nav.js`: a name, its path, a colour, a one-line description, and its areas as `[label, link]`. Links are relative to the site (`'#/districts'`, `'census.html'`). Publish, and every page in the universe shows the change.

How it behaves:

- **Mouse:** hover a site to see its areas, and click its name to go there.
- **Touch:** the first tap opens a site's menu, and the second follows the link.
- **Keyboard:** Tab moves between sites, Down opens a menu and moves through it, and Escape closes it.
- **Narrow screens:** one Menu button lists every site and area.
- **Current place:** the bar highlights the site you're on and the area you're in, and keeps up as the site changes its own route.

## Shared helpers

```html
<script src="https://dvexperiments.github.io/Universe/shared.js"></script>
```

`PixelUniverse.shared` provides:

- **`rng` and `hash`:** identical to Glacial's `G.rng` and `G.hash`. Never change them.
- **`seed(site, purpose)`:** a seeded stream for one site and purpose.
- **Dates:** `ymd`, `iso`, `dayOf`, plus `EPOCH` and `DAY`.
- **`applyLaws(t)`:** restyles a page with the colours and typefaces that are Senate law at time `t`, following the reader's light or dark setting.

Existing sites keep identical copies, so nothing changes for them. New sites should use these, and older ones can switch whenever they're next edited.

## Testing before you publish

1. Clone every repo side by side into one folder, named exactly as on GitHub (`Glacial`, `City`, `Senate`, `Weather`, `Bookmaker`, `DailyPixel`, `PixelFM`, `Museum`, `Universe`).
2. From that folder, run `python3 Universe/tools/serve.py`.
3. Open `http://localhost:8000/Universe/`.

Every site is served from your local copies, and every address pointing at `dvexperiments.github.io` is pointed at your copies instead, so you can change two sites and see them work together before either goes live. Anything you haven't cloned comes from the live site.

## Publishing changes that span sites

- **Order:** publish upstream first, in the order of the conventions' site table (Glacial and Weather, then the Senate and City, then the readers), then the Universe.
- **Additions only:** never rename or remove anything another site reads. Add the new thing alongside the old one, and retire the old one once nothing uses it.
- **Repo names are addresses:** a site's repo name is part of every link to it, so keep the names in `SITES` and the repo names identical.

## World health (`health.html`)

An internal dashboard that loads every simulation in the chain and checks that the universe holds together. Read-only; add `?at=` to check any moment. It checks: every site loaded and ready, with versions; fresh data (each run has reached yesterday); events unique across every site and in the shared format; citizens (the census population against Society's homes, and working lives adding up); impossible balances (business staff and prices, the Bank's book, freight stocks); cross-references (Exchange premises and employers in the census register; building links on the map, live site only); consistency between sites (blackouts, Senate law keys); and determinism (the same moment computed twice gives the same answer). Linked from the Pixel Universe menu.
