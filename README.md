# Catan Timer

A turn timer web app for board games like Catan. Keep your game moving with per-player countdowns, overtime tracking, and post-game statistics.

Built as a Progressive Web App (PWA) so you can install it on your phone and use it offline at the table.

## Features

- **Turn Timer** — Countdown per player with configurable duration (presets: Casual 5:00, Normal 3:00, Competitive 1:30, or custom)
- **Overtime Tracking** — Soft warning when time expires; overtime counts up in red with audio + visual pulse
- **Player Setup** — 3–6 players with customizable names and colors (red, blue, white, green, brown, yellow)
- **Pause / Resume** — Pause the timer at any time; all controls remain accessible except End Turn
- **Game Stats** — Per-player averages, fastest/slowest turns, overtime totals, and a round-by-round breakdown
- **PWA Support** — Installable on iOS/Android, works offline, wakelock keeps screen on during play
- **Persistent State** — Game state survives page refreshes and navigation via IndexedDB

## Tech Stack

- [Svelte 5](https://svelte.dev/) with runes (`$state`, `$derived`, `$effect`)
- [SvelteKit](https://kit.svelte.dev/) with static adapter
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) + [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
- [idb](https://github.com/jakearchibald/idb) for IndexedDB persistence
- [Vitest](https://vitest.dev/) for unit tests

## Development

```sh
npm install
npm run dev
```

Open `http://localhost:5173`.

## Build

```sh
npm run build
```

The static site is output to `build/`. Preview locally with:

```sh
npm run preview
```

## Test

```sh
npm test
```

## Game Flow

1. **Setup** (`/`) — Choose player count, turn duration, and names/colors
2. **Game** (`/game`) — Active timer for the current player. Tap "End Turn" to advance. Use Pause to freeze the timer.
3. **Stats** (`/stats`) — Review per-player and per-round statistics at any time during or after the game

## Project Structure

```
src/
  routes/
    +page.svelte          # Setup screen
    game/+page.svelte     # Active game timer
    stats/+page.svelte    # Post-game statistics
  lib/
    timer/
      engine.ts           # Timer logic (pure functions)
      state.svelte.ts     # Reactive game state store
    db/
      schema.ts           # TypeScript types
      index.ts            # IndexedDB persistence
    audio/index.ts        # Web Audio alarm beeps
    notifications/index.ts # Browser notification on overtime
    wakelock/index.ts     # Screen wakelock during play
```

## License

MIT
