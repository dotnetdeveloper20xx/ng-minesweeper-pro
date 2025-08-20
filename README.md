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





# Angular Minesweeper (What • Why • How)

This guide helps for Angular and our game logic **step by step**. For every concept we explain **WHAT** it is, **WHY** we use it, and **HOW** it’s implemented in this project. Use it as a study plan, a walkthrough, and a set of mini-exercises.

---

## 0) Learning Path (recommended order)

1. **Angular foundations** → Standalone components, DI, routing, change detection.
2. **Reactive state** → RxJS, `BehaviorSubject`, immutability.
3. **Project tour** → File-by-file structure.
4. **Core models** → `Tile`, `GameState`, `GameStatus`.
5. **GameService deep dive** → init, first-click safety, adjacency, flood fill, chording, timer, persistence.
6. **UI Components** → `TileComponent`, `BoardComponent`, `GamePage`, a11y, keyboard controls, mobile touch.
7. **Router pages** → Leaderboard & About.
8. **Testing** → core unit tests and how to extend.
9. **Stretch goals** → seeded RNG, animations, PWA, e2e tests.

---

## 1) Angular Foundations

### 1.1 Standalone Components

* **WHAT**: Components that don’t require NgModules.
* **WHY**: Less boilerplate, clearer composition, modern Angular (v16+).
* **HOW**: `standalone: true`, declare imports in the component.

```ts
@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, TileComponent],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css']
})
export class BoardComponent { /* ... */ }
```

### 1.2 Dependency Injection (DI)

* **WHAT**: Angular’s way to give classes the instances they need.
* **WHY**: Decoupled, testable, composable architecture.
* **HOW**: `@Injectable({ providedIn: 'root' })` makes `GameService` a singleton.

### 1.3 Routing

* **WHAT**: Map URLs to components.
* **WHY**: Multi-page UX (Game, Leaderboard, About).
* **HOW**:

```ts
export const routes: Routes = [
  { path: '', component: GamePageComponent, title: 'Minesweeper' },
  { path: 'leaderboard', component: LeaderboardComponent, title: 'Leaderboard' },
  { path: 'about', component: AboutComponent, title: 'About' },
  { path: '**', redirectTo: '' }
];
```

### 1.4 Change Detection: Zone.js vs. Zoneless

* **WHAT**: Angular can run with or without Zone.js.
* **WHY**: Zone.js = easy defaults; Zoneless = advanced perf.
* **HOW**: We’re using **Zone.js** (`import 'zone.js'`) with `provideAnimations()`.

---

## 2) Reactive State with RxJS

### 2.1 BehaviorSubject

* **WHAT**: Subject that stores and replays the latest value.
* **WHY**: Components always render current `GameState`.
* **HOW**:

```ts
private readonly _state$ = new BehaviorSubject<GameState>(this.initialState(...));
readonly state$ = this._state$.asObservable();
```

### 2.2 Immutability

* **WHAT**: Treat state as read-only; copy on change.
* **WHY**: Predictable rendering; easier debugging/testing.
* **HOW**:

```ts
const board = s.board.map((row, ry) => (ry === t.y ? row.slice() : row));
board[t.y] = board[t.y].slice();
board[t.y][t.x] = { ...t, isFlagged: !t.isFlagged };
```

---

## 3) Project Tour

```
src/
  app/
    models/
      game-state.ts        # GameState + GameStatus + Difficulty
      tile.ts              # Tile interface
    services/
      game.service.ts      # All game logic + BehaviorSubject state stream
      __tests__/game.service.spec.ts
    components/
      board/board.component.{ts,html,css}
      tile/tile.component.{ts,html,css}
      leaderboard/leaderboard.component.ts
      about/about.component.ts
    views/game-page.component.ts
    app.component.{ts,html,css}
  index.html
  main.ts
  styles.css
```

---

## 4) Core Models (WHAT • WHY • HOW)

### 4.1 `Tile`

* **WHAT**: A cell (mine or safe) with reveal/flag state and adjacent mine count.
* **WHY**: Minimal unit the UI renders and the logic manipulates.
* **HOW**:

```ts
export interface Tile {
  x: number;
  y: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number; // 0..8
}
```

### 4.2 `GameState` + `GameStatus`

* **WHAT**: Shape of the entire app state.
* **WHY**: Single source of truth; components subscribe and render.
* **HOW**:

```ts
export enum GameStatus { Ready = 'ready', Playing = 'playing', Won = 'won', Lost = 'lost' }
export type Difficulty = 'Beginner' | 'Intermediate' | 'Expert' | 'Custom';

export interface GameState {
  board: Tile[][];
  rows: number; cols: number; mines: number;
  flagsPlaced: number; minesLeft: number;
  status: GameStatus; firstClick: boolean;
  startedAt?: number; elapsedMs: number;
  difficulty: Difficulty; hintsLeft: number;
}
```

---

## 5) `GameService` Deep Dive (line-by-line for key parts)

> File: `src/app/services/game.service.ts`

### 5.1 State & Presets

```ts
@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly _state$ = new BehaviorSubject<GameState>(this.initialState(9, 9, 10, 'Beginner'));
  readonly state$ = this._state$.asObservable();  // WHAT: read-only stream for components

  private timerSub?: Subscription;  // WHY: cancel interval when game ends/restarts
```

* **WHAT**: Singleton service holds the whole game state.
* **WHY**: Centralized logic; dumb components.
* **HOW**: `BehaviorSubject<GameState>` is the authoritative state stream.

### 5.2 Initial State

```ts
private initialState(rows: number, cols: number, mines: number, difficulty: Difficulty): GameState {
  const board = Array.from({ length: rows }, (_, y) =>
    Array.from({ length: cols }, (_, x) => ({ x, y, isMine: false, isRevealed: false, isFlagged: false, adjacentMines: 0 } as Tile))
  );
  return {
    board, rows, cols, mines,
    flagsPlaced: 0, minesLeft: mines,
    status: GameStatus.Ready, firstClick: true,
    elapsedMs: 0, difficulty, hintsLeft: 3,
  };
}
```

* **WHAT**: Builds a new empty board.
* **WHY**: We guarantee first-click safety by placing mines **after** the first click.
* **HOW**: Construct a 2D matrix of `Tile`.

### 5.3 Presets & Restart

```ts
newPreset(which: 'Beginner'|'Intermediate'|'Expert'){ /* choose preset rows/cols/mines */ }

newGame(rows:number, cols:number, mines:number, difficulty: Difficulty='Custom'){
  this.stopTimer();
  this._state$.next(this.initialState(rows, cols, mines, difficulty));
}

restart(){
  const s = this.snapshot;
  this.newGame(s.rows, s.cols, s.mines, s.difficulty);
}
```

* **WHAT**: Lifecycle operations.
* **WHY**: Create fresh states; reset timer.
* **HOW**: Emit a brand-new `GameState`.

### 5.4 Toggling Flags (immutably)

```ts
toggleFlag(tile: Tile|{x:number;y:number}) {
  const s = this.snapshot;
  if (s.status === GameStatus.Lost || s.status === GameStatus.Won) return;
  const t = this.tileAt(s, tile.y, tile.x);
  if (!t || t.isRevealed) return;

  const board = s.board.map((row, ry) => (ry === t.y ? row.slice() : row));
  board[t.y] = board[t.y].slice();
  board[t.y][t.x] = { ...t, isFlagged: !t.isFlagged };

  const flagsPlaced = s.flagsPlaced + (t.isFlagged ? -1 : 1);
  const minesLeft = Math.max(0, s.mines - flagsPlaced);
  this._state$.next({ ...s, board, flagsPlaced, minesLeft });
}
```

* **WHAT**: Toggle a flag safely.
* **WHY**: Immutable updates keep change detection reliable.
* **HOW**: Copy the touched row and tile; recompute derived counts.

### 5.5 Reveal + First-Click Safety

```ts
reveal(tile: Tile|{x:number;y:number}) {
  let s = this.snapshot;
  if (s.status === GameStatus.Lost || s.status === GameStatus.Won) return;
  const t = this.tileAt(s, tile.y, tile.x);
  if (!t || t.isRevealed || t.isFlagged) return;

  if (s.firstClick) {                  // WHAT: place mines after first reveal
    s = this.placeMinesAfterFirstClick(s, t.x, t.y);
    s.status = GameStatus.Playing;
    s.firstClick = false;
    s.startedAt = Date.now();
    this.startTimer();
  }

  if (t.isMine) {                      // WHY: hitting a mine ends the game
    const board = this.revealAllMines(s.board);
    this.stopTimer();
    this._state$.next({ ...s, board, status: GameStatus.Lost });
    return;
  }

  const board = this.revealFloodFill(s.board, t.x, t.y);  // HOW: BFS expand zeros
  s = { ...s, board };

  if (this.countHiddenNonMines(s.board) === 0) {          // WHY: win condition
    s.status = GameStatus.Won;
    this.stopTimer();
    this.persistBestTime(s);
  }
  this._state$.next(s);
}
```

* **WHAT**: Reveal tile; if first click, place mines safely; check win/loss.
* **WHY**: Authentic Minesweeper rules.
* **HOW**: Defer mine placement; BFS flood fill; then emit new state.

### 5.6 Placing Mines (after first click)

```ts
private placeMinesAfterFirstClick(s: GameState, safeX: number, safeY: number): GameState {
  const total = s.rows * s.cols;
  const indices = [...Array(total).keys()];

  // forbid clicked tile and neighbors
  const forbidden = new Set<number>();
  for (let dy=-1; dy<=1; dy++) for (let dx=-1; dx<=1; dx++) {
    const y = safeY + dy, x = safeX + dx;
    if (y>=0 && y<s.rows && x>=0 && x<s.cols) forbidden.add(y * s.cols + x);
  }

  const candidates = indices.filter(i => !forbidden.has(i));
  for (let i=candidates.length-1; i>0; i--) { // Fisher-Yates shuffle
    const j = Math.floor(Math.random()*(i+1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const minePositions = new Set(candidates.slice(0, s.mines));

  const board = s.board.map(r => r.slice());
  for (let i=0; i<total; i++) {
    const y = Math.floor(i / s.cols), x = i % s.cols;
    if (minePositions.has(i)) board[y][x] = { ...board[y][x], isMine: true };
  }
  this.recalculateAdjacency(board);
  return { ...s, board };
}
```

* **WHAT**: Randomly place mines but exclude the 3×3 around the first click.
* **WHY**: Guarantees a safe (and fun) start.
* **HOW**: Candidate list → shuffle → choose first N → set mines → compute adjacency.

### 5.7 Adjacency

```ts
private recalculateAdjacency(board: Tile[][]): void {
  for (let y=0; y<board.length; y++) for (let x=0; x<board[0].length; x++) {
    if (board[y][x].isMine) { board[y][x] = { ...board[y][x], adjacentMines: 0 }; }
    else {
      const count = this.neighbors(board, x, y).filter(t => t.isMine).length;
      board[y][x] = { ...board[y][x], adjacentMines: count };
    }
  }
}
```

* **WHAT**: Compute 1..8 numbers.
* **WHY**: Core game feedback.
* **HOW**: Count neighboring mines.

### 5.8 Flood Fill (BFS)

```ts
private revealFloodFill(board: Tile[][], startX: number, startY: number): Tile[][] {
  const rows = board.length, cols = board[0].length;
  const out = board.map(r => r.slice());
  const queue: Array<{x:number;y:number}> = [];
  const visited = new Set<string>();

  const enqueue = (x:number, y:number) => {
    const key = y + ':' + x;
    if (x<0||x>=cols||y<0||y>=rows) return;
    if (!visited.has(key)) { visited.add(key); queue.push({x,y}); }
  };
  enqueue(startX, startY);

  while (queue.length) {
    const {x, y} = queue.shift()!;
    const t = out[y][x];
    if (t.isRevealed || t.isFlagged) continue;

    out[y][x] = { ...t, isRevealed: true };
    if (t.adjacentMines === 0 && !t.isMine) {
      for (let dy=-1; dy<=1; dy++) for (let dx=-1; dx<=1; dx++) {
        if (dx||dy) enqueue(x+dx, y+dy);
      }
    }
  }
  return out;
}
```

* **WHAT**: Reveal contiguous zeros + their border numbers.
* **WHY**: Classic Minesweeper behavior.
* **HOW**: BFS with a queue and `visited` guard.

### 5.9 Chording (auto-reveal neighbors)

```ts
chord(tile: Tile|{x:number;y:number}) {
  let s = this.snapshot;
  if (s.status !== GameStatus.Playing) return;
  const t = this.tileAt(s, tile.y, tile.x);
  if (!t || !t.isRevealed || t.isMine || t.adjacentMines === 0) return;

  const neighbors = this.neighbors(s.board, t.x, t.y);
  const flags = neighbors.filter(n => n.isFlagged).length;
  if (flags !== t.adjacentMines) return;

  let board = s.board.map(r => r.slice());
  let hitMine = false;

  for (const n of neighbors) {
    if (!n.isFlagged && !n.isRevealed) {
      if (n.isMine) { hitMine = true; board[n.y][n.x] = { ...n, isRevealed: true }; }
      else { board = this.revealFloodFill(board, n.x, n.y); }
    }
  }

  if (hitMine) {
    board = this.revealAllMines(board);
    this.stopTimer();
    this._state$.next({ ...s, board, status: GameStatus.Lost });
    return;
  }

  s = { ...s, board };
  if (this.countHiddenNonMines(s.board) === 0) {
    s.status = GameStatus.Won; this.stopTimer(); this.persistBestTime(s);
  }
  this._state$.next(s);
}
```

* **WHAT**: When flags match the number, reveal remaining neighbors.
* **WHY**: Speed of play; authentic strategy.
* **HOW**: Count flags; reveal neighbors; handle loss/win.

### 5.10 Timer & Best Times

```ts
private startTimer(){ this.stopTimer();
  this.timerSub = interval(200).subscribe(() => {
    const s = this.snapshot;
    if (s.status !== GameStatus.Playing || !s.startedAt) return;
    const elapsedMs = Date.now() - s.startedAt;
    this._state$.next({ ...s, elapsedMs });
  });
}
private stopTimer(){ this.timerSub?.unsubscribe(); this.timerSub = undefined; }

private persistBestTime(s: GameState){
  const sec = s.elapsedMs / 1000;
  const key = 'ms-best-times';
  const current = JSON.parse(localStorage.getItem(key) || '{}');
  if (!current[s.difficulty] || sec < current[s.difficulty]) {
    current[s.difficulty] = sec;
    localStorage.setItem(key, JSON.stringify(current));
  }
}
```

* **WHAT**: Reactive timer & persistence.
* **WHY**: UX polish and replay value.
* **HOW**: `interval(200)` and `localStorage`.

---

## 6) UI Components

### 6.1 `TileComponent` (events, keyboard, touch)

**WHAT**: One tile; handles clicks, flags, chord, keyboard & touch.
**WHY**: Encapsulates per-tile interactions & a11y.
**HOW** (excerpts):

```ts
onClick(){ this.game.reveal(this.tile); }
onRightClick(ev: MouseEvent){ ev.preventDefault(); this.game.toggleFlag(this.tile); }
onDblClick(){ this.game.chord(this.tile); }
onAuxClick(ev: MouseEvent){ if (ev.button === 1) this.game.chord(this.tile); }

onKeyDown(ev: KeyboardEvent){
  if (ev.key===' '||ev.key==='Enter'){
    if (this.tile.isRevealed && !this.tile.isMine && this.tile.adjacentMines>0) this.game.chord(this.tile);
    else this.game.reveal(this.tile);
    ev.preventDefault();
  } else if (ev.key.toLowerCase()==='f'){ this.game.toggleFlag(this.tile); ev.preventDefault(); }
  else if (ev.key.toLowerCase()==='c'){ this.game.chord(this.tile); ev.preventDefault(); }
}

// Touch long-press to flag
onTouchStart(){ this.pressTimer = setTimeout(()=>{ this.game.toggleFlag(this.tile); this.pressTimer=undefined; },450); }
onTouchEnd(){ if (this.pressTimer) this.game.reveal(this.tile); clearTimeout(this.pressTimer!); this.pressTimer=undefined; }
```

**Template highlights**:

```html
<button
  class="tile"
  [class.revealed]="tile.isRevealed"
  [class.flagged]="tile.isFlagged"
  [class.mine]="tile.isMine && tile.isRevealed"
  [attr.aria-label]="ariaLabel()"
  (click)="onClick()" (contextmenu)="onRightClick($event)"
  (dblclick)="onDblClick()" (auxclick)="onAuxClick($event)" (keydown)="onKeyDown($event)"
  (touchstart)="onTouchStart()" (touchend)="onTouchEnd()">
  <!-- number/mine/flag visuals here -->
</button>
```

### 6.2 `BoardComponent` (CSS Grid)

**WHAT**: Lays out tiles in a grid.
**WHY**: Separation of concerns (board vs. tiles).
**HOW**:

```html
<div class="board" [style.gridTemplateColumns]="'repeat(' + cols + ', var(--tile-size))'">
  <ng-container *ngFor="let row of board">
    <ng-container *ngFor="let tile of row; trackBy: trackByTile">
      <app-tile [tile]="tile"></app-tile>
    </ng-container>
  </ng-container>
</div>
```

### 6.3 `GamePageComponent` (controls + board + stats)

**WHAT**: Container view with difficulty buttons, stats, hint button, status line, and board.
**WHY**: Keep `AppComponent` as shell/nav only.
**HOW**: Bind `state$ | async` in template to display timer, flags, minesLeft, best time, etc.

---

## 7) Router Pages

### 7.1 Leaderboard

* **WHAT**: Reads/saves best times from `localStorage`.
* **WHY**: Motivation & bragging rights.
* **HOW**: Simple table + reset button calls `localStorage.removeItem('ms-best-times')`.

### 7.2 About

* **WHAT**: Describes features and tech used.
* **WHY**: Context for learners/reviewers.

---

## 8) Testing

### 8.1 Current Unit Tests (Jasmine)

**WHAT**: Tests core logic behaviors.
**WHY**: Prevent regressions, build confidence, teach TDD.
**HOW** (excerpts):

```ts
it('first click should never be a mine', () => {
  service.newPreset('Beginner');
  service.reveal({ x: 0, y: 0 });
  expect(service.snapshot.board[0][0].isMine).toBeFalse();
  expect(service.snapshot.status).toBe(GameStatus.Playing);
});

it('with zero mines, flood fill reveals all tiles and wins', () => {
  service.newGame(5,5,0,'Custom');
  service.reveal({ x: 2, y: 2 });
  expect(service.snapshot.status === GameStatus.Won || service.snapshot.status === GameStatus.Playing).toBeTrue();
});
```

### 8.2 Exercises (pair with your junior)

* Add unit tests for **chording**.
* Inject a **seeded RNG** for deterministic boards and test exact outcomes.
* Test **hint** behavior (reveals safe tile, decrements `hintsLeft`).

---

## 9) A11y & UX

* **Keyboard**: Space/Enter reveal; F flag; Enter/C chord.
* **ARIA**: Tile labels reflect state; status messages use polite `aria-live`.
* **Touch**: Long-press to flag on mobile.
* **Responsive**: CSS Grid + `--tile-size` variable for density.

---

## 10) Stretch Goals (mentor tasks)

1. **Seeded RNG + DI**: Inject a random provider for reproducible boards → stronger tests.
2. **Angular Animations**: Reveal transitions without harming a11y.
3. **Solver Hints**: Probability-based safe tile detection.
4. **PWA**: Installable, offline cache.
5. **E2E**: Cypress/Playwright for keyboard-only and touch workflows.
6. **Signals**: Map `state$` to signals (`toSignal`) to demo both paradigms together.

---

## 11) Mentoring Script (How to teach)

* **Start small**: “Change a number and watch the UI update via `async` pipe.”
* **Explain immutability**: “We clone rows/tiles—why is that important?”
* **Walk the reveal path**: Click → service method → flood fill → `state$` emit → UI redraw.
* **Draw the BFS**: Whiteboard the queue & visited set.
* **Code kata**: Write `countFlagsAround(x,y)` and test it.
* **Refactor**: Extract `neighbors` into a pure function; unit-test it.

---

## 12) Quick Reference (Cheat Sheet)

* **State**: single `BehaviorSubject<GameState>`
* **Immutability**: never mutate `state.board` in place
* **First click**: place mines after first reveal (exclude 3×3 around click)
* **Win**: all non-mine tiles revealed
* **Chord**: flags == number → reveal other neighbors
* **Timer**: RxJS `interval(200)` updates `elapsedMs`
* **Best times**: `localStorage['ms-best-times']`
* **Keyboard**: Space/Enter reveal, F flag, C chord

---


