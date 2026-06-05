# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # install dependencies
npm run dev        # start Vite dev server on http://localhost:8080 (alias: npm run serve)
npm run build      # production build into dist/
npm run preview    # preview the production build locally
node server.js     # serve dist/ in production (Express, forces HTTPS, SPA history fallback, PORT env)
```

There is no test runner, linter, or formatter configured. `vue.config.js` and `babel.config.js` are leftover from the Vue CLI → Vite 5 migration and are unused by the Vite build.

## Architecture

A Vue 3 + Vuex 4 + Vue Router 4 single-page "football manager" game. The player drafts 20 players from random picks within a budget, then chooses a formation for the resulting squad. There is no backend or persistence — all game data is generated procedurally in the browser and lives only in the Vuex store for the session.

### Data generation (`src/assets/js/`)

This is the heart of the app — the game's rules live in pure functions here, not in components.

- **`Config.js`** — every tunable constant: draft counts, age/potential ranges, position thresholds, salary factor, and the four available `formations` (5-4-1, 4-5-1, 4-4-2, 4-3-3) with per-position slot counts. Change game balance here.
- **`PlayerFactory.js`** — `makePlayer()` builds a player object by deriving everything from random rolls: potential → skill (decayed by distance from `optimal_age` via `AGE_FACTOR`) → a single skill budget split across `goalkeeping`/`defense`/`progression`/`shot`. `get_pos()` then maps those four skills + a horizontal field coordinate onto a concrete position (GK/CB/LB/CM/ST/etc.) and per-position skill weights. `get_skills()` redistributes the skill budget so most players collapse into a recognizable role rather than being well-rounded.
- **`ClubFactory.js`** — `makeClub()` makes a named club of 30 players and assigns its best formation.
- **`Helpers.js`** — `getFormationsWithPlayers()` slots a player list into each formation (best players first, capped at slot count) and sums skill; `getRecommendedFormation()` picks the highest-skill formation. `getBiasedRnd()` is the weighted-random primitive used throughout. `moneyStr()` formats currency.

### State (`src/store/`)

Vuex modules registered in `store/index.js`. NOTE: the modules are **not** namespaced (no `namespaced` flag) — all actions/mutations share one global namespace and components dispatch them by bare name (e.g. `this.$store.dispatch('addPlayerToTeam', player)`). State is still read per-module (e.g. `this.$store.state.team.players`).

- **`Team.js`** — the drafted squad. `ADD_TO_TEAM` appends a player and recomputes derived aggregates (`positionStats`, `positionCount`, `skillCount`) via the local helper functions, then sorts by position then skill.
- **`Draft.js`** — `activeDraftSet` holds the current 3 cards; `MAKE_DRAFT_SET` regenerates them.
- **`Club.js`** — the budget (`money`, starts at 300000); `PAY` subtracts a salary.
- **`League.js`** — generates 8 AI clubs (currently only logged to console).

### Views & flow (`src/router/index.js`)

- `/` → **`Draft.vue`**: shows three `DraftCard`s. Clicking a card dispatches `addPlayerToTeam` + `pay` + `makeDraftSet` (see `DraftPicks.vue`). A `watch` on `draftIsCompleted` (players === draftAmount) auto-navigates to `/team`.
- `/team` → **`Team.vue`**: formation picker; `Lineup`/`Field` render the chosen formation. Formations are computed live from the squad via `Helpers`, not stored.

### Styling

Global SCSS variables in `src/assets/scss/` (`var-color-base`, `var-color-mapping`, `var-breakpoints`) are auto-injected into every component's `<style lang="scss">` via `vite.config.mjs` `additionalData` — so `$col_*` and `$breakpoint_*` are available without importing. Use the mapped semantic variables (e.g. `$col_module_background`, `$col_cta`, `$col_text`) rather than raw base colors.

### Conventions

- `@` aliases `src/` (configured in `vite.config.mjs`).
- Components use the Options API throughout; logic that isn't view-specific belongs in `assets/js/` as a pure function, imported as `import * as HLP from '.../Helpers.js'`.
