# Angular Minesweeper Pro (Angular 18)

A modern, production-quality **Minesweeper** built with **Angular 18 (standalone components)**, **TypeScript**, and **RxJS**.  
It showcases advanced front-end engineering: clean component architecture, reactive state management, keyboard-first a11y, router-based pages, and UI polish.

> **Highlights**
> - First-click safety & flood-fill reveal
> - **Number-click chording** (auto-reveal neighbors when flags match the number)
> - **Best times** per difficulty persisted to **localStorage**
> - **Keyboard a11y** (reveal, flag, chord)
> - **Router pages**: Game, Leaderboard, About
> - **Unit tests** for core game behaviors
> - Clean, responsive CSS Grid UI with subtle animations

---

## Table of Contents

- [Features](#features)
- [Screens & Controls](#screens--controls)
- [Architecture](#architecture)
  - [State Flow](#state-flow)
  - [Core Data Structures](#core-data-structures)
  - [Key Algorithms](#key-algorithms)
- [Accessibility](#accessibility)
- [Performance & Code Quality](#performance--code-quality)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Option A: Scaffold via Angular CLI (recommended)](#option-a-scaffold-via-angular-cli-recommended)
  - [Run, Build, Test](#run-build-test)
  - [Zoneless vs Zonejs](#zoneless-vs-zonejs)
- [Configuration & Customization](#configuration--customization)
- [Testing](#testing)
- [Roadmap](#roadmap)
- [License](#license)

---

## Features

- 🎯 **First-click is always safe**  
  Mines are placed *after* the first reveal, excluding the clicked tile and its neighbors.
- 🧠 **Flood-fill** (BFS) for empty regions  
  Reveals contiguous zero-adjacent tiles and their numeric border.
- 🏁 **Flags** with right-click (desktop) or long-press (mobile)
- 💥 **Number-click chording**  
  When a revealed number has exactly that many 🚩 flags around it, auto-reveal all unflagged neighbors.
- ⏱ **Timer** runs while playing
- 🏆 **Best times** saved to localStorage per difficulty (Beginner/Intermediate/Expert/Custom)
- 💡 **Hints** (3 per game) for a guaranteed safe reveal
- ♿ **Keyboard a11y** and sensible ARIA
- 🗺️ **Router pages**: Game, Leaderboard, About
- 🧪 **Unit tests** for core service behaviors
- 🎨 **Polished UI** with responsive CSS Grid and subtle animations

---

## Screens & Controls

### Pages
- **Game** — Primary play screen with difficulty presets, stats, restart, and hint.
- **Leaderboard** — Best times pulled from `localStorage`, with a reset button.
- **About** — Feature overview.

### Keyboard & Mouse
| Action | Mouse / Touch | Keyboard |
|---|---|---|
| Reveal tile | Left click / tap | **Space** or **Enter** |
| Place/remove flag | Right click / long-press | **F** |
| Chord (reveal neighbors of a number) | Double-click / Middle-click | **Enter** on a revealed number, or **C** |
| Restart | Button in header | — |

---

## Architecture

This project follows a SOLID, reactive design:
- **Components are presentation-only**; they render inputs and forward user events.
- The **singleton `GameService`** owns all game logic and state. It exposes `state$` as a **`BehaviorSubject<GameState>`** so the UI updates reactively via the `async` pipe.
- **Immutable board updates** ensure predictable change detection and testability.

### State Flow
1. UI components subscribe to `GameService.state$`.
2. User interactions (`reveal`, `toggleFlag`, `chord`, `useHint`, `restart`, `newPreset`) call service methods.
3. The service calculates the next immutable `GameState` and emits it via `BehaviorSubject`.
4. Components re-render with the latest state.

### Core Data Structures

```ts
// src/app/models/tile.ts
export interface Tile {
  x: number;
  y: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number; // 0..8
}
```

```ts
// src/app/models/game-state.ts
export type Difficulty = 'Beginner' | 'Intermediate' | 'Expert' | 'Custom';

export enum GameStatus { Ready = 'ready', Playing = 'playing', Won = 'won', Lost = 'lost' }

export interface GameState {
  board: Tile[][];
  rows: number;
  cols: number;
  mines: number;
  flagsPlaced: number;
  minesLeft: number;   // derived: mines - flagsPlaced
  status: GameStatus;
  firstClick: boolean; // defer mine placement to guarantee safe first reveal
  startedAt?: number;
  elapsedMs: number;
  difficulty: Difficulty;
  hintsLeft: number;   // defaults to 3
}
```

### Key Algorithms

- **Deferred Mine Placement (First-click Safety)**  
  On the first reveal, mines are randomly placed on the board but *never* on the clicked tile or any of its 8 neighbors. This yields a more natural first move and avoids immediate losses.

- **Adjacency Calculation**  
  For each non-mine tile, `adjacentMines` is computed by scanning its neighbors. This runs once after we place mines (and again only if we rebuild the board).

- **Flood-fill Reveal (BFS)**  
  When revealing a zero-adjacent tile, we breadth-first traverse the region, revealing all contiguous zeros and their numeric border tiles.

- **Chording**  
  If a revealed number tile has **exactly** that many flagged neighbors, the remaining unflagged neighbors are auto-revealed.  
  - If any of those is a mine (i.e., flags were wrong), the game ends in a loss.
  - Otherwise, flood-fill is applied to any zero-adjacent neighbors.

- **Hints**  
  A simple, deterministic strategy: reveal the first non-mine, non-revealed, non-flagged tile found. (Easy to swap for a probability-based solver if you want to showcase advanced heuristics.)

- **Best Time Persistence**  
  On a win, we compare the elapsed time against the stored best time for that difficulty in `localStorage` and persist the new best if it’s faster.

---

## Accessibility

- **Keyboard support** for reveal, flag, and chord.
- **ARIA labels** for tile states; live region status updates for game state changes.
- **Touch**: long-press to flag on mobile.
- Clear focusable controls and sufficient color contrast.

---

## Performance & Code Quality

- **Immutable updates** to the board (shallow row copies + tile replacement) keep change detection tight and predictable.
- **`trackBy`** functions for grid rendering minimize DOM churn.
- Encapsulated logic in `GameService` simplifies **unit testing** and reusability.
- Separation of concerns keeps components lean and maintainable.

---

## Project Structure

```
src/
  app/
    models/
      game-state.ts
      tile.ts
    services/
      game.service.ts           # All game logic + state (BehaviorSubject<GameState>)
      __tests__/
        game.service.spec.ts    # Unit tests for core behaviors
    components/
      board/
        board.component.{ts,html,css}
      tile/
        tile.component.{ts,html,css}
      leaderboard/
        leaderboard.component.ts
      about/
        about.component.ts
    views/
      game-page.component.ts    # Container for game controls + board + stats
    app.component.{ts,html,css} # Shell + nav + router outlet
  index.html
  main.ts
  styles.css
```

---

## Getting Started

### Option A: Scaffold via Angular CLI (recommended)

1. **Create a new Angular workspace** (Angular 18):
   ```bash
   npm i -g @angular/cli
   ng new ng-minesweeper-pro --standalone --style=css --routing=false
   ```

2. **Replace the generated `src/`** with this repo’s `src/`.

3. **Install dependencies** (if not already present in your workspace):
   ```bash
   npm i @angular/animations zone.js
   ```

### Run, Build, Test

```bash
# dev
npm start        # or: ng serve

# production build
npm run build    # or: ng build --configuration production

# unit tests (Jasmine/Karma)
npm test
```

### Zoneless vs Zone.js

- Current `main.ts` uses **Zone.js** with:
  ```ts
  import 'zone.js';
  import { provideAnimations } from '@angular/platform-browser/animations';
  ```
- If you prefer **zoneless**, set `ngZone: 'noop'` at bootstrap and remove `provideAnimations()` (we rely on CSS transitions, so the UI remains smooth). You’ll also need to remove `zone.js` imports.

---

## Configuration & Customization

- **Difficulty presets** are defined in `GameService` (`Beginner`, `Intermediate`, `Expert`). Add your own or expose inputs for a custom game.
- **Tile size** — tweak `--tile-size` in `src/styles.css` for different densities.
- **Hints** — initial count is `3` (see `GameService.initialState`).
- **Animations/UI** — CSS only by default. You can add Angular Animations if desired.

---

## Testing

Basic unit tests live in:
```
src/app/services/__tests__/game.service.spec.ts
```
Included tests:
- **First-click safety** (no mine at the first revealed tile)
- **Flood-fill behavior** when mines = 0
- **Win detection** when all safe tiles are revealed

> **Tip:** For a deeper test suite, inject a **seeded RNG** (or pass predetermined mine positions) so chording & edge cases become fully deterministic.

---

## Roadmap

- Seeded RNG for deterministic boards (great for demos & testing)
- Probability-based safe-tile hints
- Angular animations for reveal transitions
- Persist best times to a backend leaderboard (optional)
- E2E tests (Cypress/Playwright) for keyboard & touch flows
- PWA support (offline + installable)

---

## License

MIT — do whatever you like, but attribution is appreciated.

---

### Credits & Origin

Inspired by a C# console Minesweeper (Board/Game/Tile split). This Angular version re-imagines that design for the web: a single **GameService** orchestrates state, while components remain stateless and declarative.
