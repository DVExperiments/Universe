# Deploying the Pixel Universe

Everything below is in the latest zips. Publish in this order: each step's scripts are read by the ones after it.

## Order

| Step | Repo | Zip | Why this order |
| --- | --- | --- | --- |
| 1 | City | `City.zip` | `universe.js`, `census.js` and `society.js` are the middle of the chain |
| 2 | Exchange | `Exchange.zip` | Reads City; the census, Society and the Senate read it |
| 3 | Senate | `Senate.zip` | Reads Society for elections and colour bills |
| 4 | Pixel FM | `PixelFM.zip` | Reads Society's song crazes; its widget loads the chain |
| 5 | Glacial | `Glacial.zip` | Its style hook loads the chain |
| 6 | Bank (new) | `Bank.zip` | Reads the Exchange and the census |
| 7 | University (new) | `University.zip` | Reads the census and the Senate |
| 8 | Job Centre, Pixel High, Bookmaker, Daily Pixel, Museum | their zips | Readers |
| 9 | Universe | `Universe.zip` | The hub, the universe bar (new sites), World health |

Each zip holds the whole repo with files at the top level: replace the repo's contents with it.

## Deadlines

Each change that alters what happens starts on a fixed date. It must be live before then, or it rewrites history.

| Must be live before | What starts |
| --- | --- |
| 1 November 2026 | The Renewal (already scheduled in City) and University applications |
| 30 November 2026 | Working lives follow the Exchange |
| 1 December 2026 | Freight, Society |
| 1 February 2027 | The Bank of Pixel City |
| 1 March 2027 | Migration, glitches, Pixel University |
| 1 June 2027 | District rents |
| 1 September 2027 | Wellbeing, choices, student loans, mortgages, staff turnover |

If everything goes live together before 1 November 2026, history is consistent from start to finish.

## After every deployment

1. Open `https://dvexperiments.github.io/Universe/health.html` and check it passes. On the live site it also checks every building link.
2. Spot-check a future date: add `?at=2027-09-15T12:00` to the City map, the Exchange, the Bank and the University.
3. Hard-refresh once: browsers cache the old scripts for a while.

## Tuning knobs

| What | Where | Now |
| --- | --- | --- |
| How much Society swings elections | City `society.js`, `voteSwing`: `1 + 1.6 * (ratio - 1)` | 1.6 (lower is calmer) |
| How readily pixels quit | City `census.js`, `quitAt`: `sat < 0.55` | 0.55 (higher quits more) |
| How much "customers stopped buying" dominates causes | Exchange `universe.js`: `normalRev * 0.6` | 0.6 (lower shows root causes more) |
| Staff turnover where life is hard | Exchange `universe.js`, `staffDay`: `0.01 * hi(0, 0.85 - wb)` | 0.01 |
| Glitch frequency | City `universe.js`, `glitchesOnDay`: `(storm ? 3 : 1) / 40` | 1 in 40 days |

Also replace the project's `Pixel_Universe_Shared_Conventions.md` with the updated copy alongside this file.
