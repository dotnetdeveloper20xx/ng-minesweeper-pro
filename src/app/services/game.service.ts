import { Injectable } from '@angular/core';
import { BehaviorSubject, Subscription, interval } from 'rxjs';
import { Difficulty, GameState, GameStatus } from '../models/game-state';
import { Tile } from '../models/tile';

function createMatrix<T>(rows: number, cols: number, factory: (r: number, c: number) => T): T[][] {
  return Array.from({ length: rows }, (_, y) => Array.from({ length: cols }, (_, x) => factory(y, x)));
}

type Preset = { rows:number; cols:number; mines:number; difficulty: Difficulty };

const PRESETS: Record<Exclude<Difficulty,'Custom'>, Preset> = {
  Beginner: { rows: 9, cols: 9, mines: 10, difficulty: 'Beginner' },
  Intermediate: { rows: 16, cols: 16, mines: 40, difficulty: 'Intermediate' },
  Expert: { rows: 16, cols: 30, mines: 99, difficulty: 'Expert' },
};

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly _state$ = new BehaviorSubject<GameState>(this.initialState(9, 9, 10, 'Beginner'));
  readonly state$ = this._state$.asObservable();

  private timerSub?: Subscription;

  constructor() {}

  get snapshot(): GameState { return this._state$.getValue(); }

  /** Create a preset game */
  newPreset(which: Exclude<Difficulty,'Custom'>): void {
    const p = PRESETS[which];
    this.newGame(p.rows, p.cols, p.mines, p.difficulty);
  }

  /** Create a custom game */
  newGame(rows: number, cols: number, mines: number, difficulty: Difficulty = 'Custom'): void {
    this.stopTimer();
    this._state$.next(this.initialState(rows, cols, mines, difficulty));
  }

  restart(): void {
    const s = this.snapshot;
    this.newGame(s.rows, s.cols, s.mines, s.difficulty);
  }

  toggleFlag(tile: Tile | {x:number;y:number}): void {
    const s = this.snapshot;
    if (s.status === GameStatus.Lost || s.status === GameStatus.Won) return;
    const t = this.tileAt(s, tile.y, tile.x);
    if (!t || t.isRevealed) return;

    const flagged = !t.isFlagged;
    const board = s.board.map((row, ry) => (ry === t.y ? row.slice() : row));
    board[t.y] = board[t.y].slice();
    board[t.y][t.x] = { ...t, isFlagged: flagged };

    const flagsPlaced = s.flagsPlaced + (flagged ? 1 : -1);
    const minesLeft = Math.max(0, s.mines - flagsPlaced);
    this._state$.next({ ...s, board, flagsPlaced, minesLeft });
  }

  /** Reveal tile; if first click, place mines excluding the tile and its neighbors. */
  reveal(tile: Tile | {x:number;y:number}): void {
    let s = this.snapshot;
    if (s.status === GameStatus.Lost || s.status === GameStatus.Won) return;
    const t = this.tileAt(s, tile.y, tile.x);
    if (!t || t.isRevealed || t.isFlagged) return;

    if (s.firstClick) {
      s = this.placeMinesAfterFirstClick(s, t.x, t.y);
      s.status = GameStatus.Playing;
      s.firstClick = false;
      s.startedAt = Date.now();
      this.startTimer();
    }

    if (t.isMine) {
      const board = this.revealAllMines(s.board);
      this.stopTimer();
      this._state$.next({ ...s, board, status: GameStatus.Lost });
      return;
    }

    const revealedBoard = this.revealFloodFill(s.board, t.x, t.y);
    s = { ...s, board: revealedBoard };

    if (this.countHiddenNonMines(s.board) === 0) {
      s.status = GameStatus.Won;
      this.stopTimer();
      this.persistBestTime(s);
    }
    this._state$.next(s);
  }

  /** Number-click chording: if flags around equal adjacent number, reveal all other neighbors. */
  chord(tile: Tile | {x:number;y:number}): void {
    let s = this.snapshot;
    if (s.status !== GameStatus.Playing) return;
    const t = this.tileAt(s, tile.y, tile.x);
    if (!t || !t.isRevealed || t.isMine || t.adjacentMines === 0) return;

    const neighbors = this.neighbors(s.board, t.x, t.y);
    const flags = neighbors.filter(n => n.isFlagged).length;
    if (flags !== t.adjacentMines) return;

    // Reveal unflagged neighbors
    let board = s.board.map(r => r.slice());
    let hitMine = false;
    for (const n of neighbors) {
      if (!n.isFlagged && !n.isRevealed) {
        if (n.isMine) {
          hitMine = true;
          board[n.y][n.x] = { ...n, isRevealed: true };
        } else {
          board = this.revealFloodFill(board, n.x, n.y);
        }
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
      s.status = GameStatus.Won;
      this.stopTimer();
      this.persistBestTime(s);
    }
    this._state$.next(s);
  }

  /** Reveal a guaranteed-safe tile (if any). */
  useHint(): void {
    let s = this.snapshot;
    if (s.hintsLeft <= 0 || s.status === GameStatus.Lost || s.status === GameStatus.Won) return;

    // Naive strategy: find a non-mine unrevealed tile. If first click, just reveal a corner.
    // After first click, we can compute probabilities, but for demo we choose the first safe deterministically.
    // We'll scan for any tile that is not a mine AND not revealed.
    for (let y = 0; y < s.rows; y++) {
      for (let x = 0; x < s.cols; x++) {
        const t = s.board[y][x];
        if (!t.isMine && !t.isRevealed && !t.isFlagged) {
          this.reveal({x,y});
          // decrement hints after reveal call may change state, so snapshot again and update hints.
          s = this.snapshot;
          this._state$.next({ ...s, hintsLeft: Math.max(0, s.hintsLeft - 1) });
          return;
        }
      }
    }
  }

  // ======================== helpers & state ========================

  private initialState(rows: number, cols: number, mines: number, difficulty: Difficulty): GameState {
    const board = createMatrix<Tile>(rows, cols, (y, x) => ({
      x, y, isMine: false, isRevealed: false, isFlagged: false, adjacentMines: 0,
    }));
    return {
      board, rows, cols, mines,
      flagsPlaced: 0, minesLeft: mines,
      status: GameStatus.Ready, firstClick: true,
      elapsedMs: 0, difficulty, hintsLeft: 3,
    };
  }

  private tileAt(s: GameState, y: number, x: number): Tile | undefined {
    if (y < 0 || y >= s.rows || x < 0 || x >= s.cols) return undefined;
    return s.board[y][x];
  }

  private placeMinesAfterFirstClick(s: GameState, safeX: number, safeY: number): GameState {
    const total = s.rows * s.cols;
    const indices = Array.from({ length: total }, (_, i) => i);

    const forbidden = new Set<number>();
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const y = safeY + dy, x = safeX + dx;
        if (y >= 0 && y < s.rows && x >= 0 && x < s.cols) forbidden.add(y * s.cols + x);
      }
    }
    const candidates = indices.filter(i => !forbidden.has(i));
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    const minePositions = new Set(candidates.slice(0, s.mines));

    const board = s.board.map(r => r.slice());
    for (let i = 0; i < total; i++) {
      const y = Math.floor(i / s.cols);
      const x = i % s.cols;
      if (minePositions.has(i)) board[y][x] = { ...board[y][x], isMine: true };
    }
    this.recalculateAdjacency(board);
    return { ...s, board };
  }

  private neighbors(board: Tile[][], x: number, y: number): Tile[] {
    const res: Tile[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const ny = y + dy, nx = x + dx;
        if (ny >= 0 && ny < board.length && nx >= 0 && nx < board[0].length) res.push(board[ny][nx]);
      }
    }
    return res;
  }

  private recalculateAdjacency(board: Tile[][]): void {
    for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < board[0].length; x++) {
        if (board[y][x].isMine) {
          board[y][x] = { ...board[y][x], adjacentMines: 0 };
        } else {
          const count = this.neighbors(board, x, y).filter(t => t.isMine).length;
          board[y][x] = { ...board[y][x], adjacentMines: count };
        }
      }
    }
  }

  private revealAllMines(board: Tile[][]): Tile[][] {
    return board.map(row => row.map(t => t.isMine ? ({ ...t, isRevealed: true }) : t));
  }

  private countHiddenNonMines(board: Tile[][]): number {
    let count = 0;
    for (const row of board) for (const t of row) if (!t.isMine && !t.isRevealed) count++;
    return count;
  }

  private revealFloodFill(board: Tile[][], startX: number, startY: number): Tile[][] {
    const rows = board.length, cols = board[0].length;
    const out = board.map(r => r.slice());
    const queue: Array<{x:number;y:number}> = [];
    const visited = new Set<string>();

    const enqueue = (x:number, y:number) => {
      const key = y + ':' + x;
      if (x < 0 || x >= cols || y < 0 || y >= rows) return;
      if (visited.has(key)) return;
      visited.add(key);
      queue.push({x,y});
    };
    enqueue(startX, startY);

    while (queue.length) {
      const {x, y} = queue.shift()!;
      const t = out[y][x];
      if (t.isRevealed || t.isFlagged) continue;
      out[y][x] = { ...t, isRevealed: true };
      if (t.adjacentMines === 0 && !t.isMine) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            enqueue(x + dx, y + dy);
          }
        }
      }
    }
    return out;
  }

  // ---------- timer & persistence ----------

  private startTimer(): void {
    this.stopTimer();
    this.timerSub = interval(200).subscribe(() => {
      const s = this.snapshot;
      if (s.status !== GameStatus.Playing || !s.startedAt) return;
      const elapsedMs = Date.now() - s.startedAt;
      this._state$.next({ ...s, elapsedMs });
    });
  }
  private stopTimer(): void {
    if (this.timerSub) { this.timerSub.unsubscribe(); this.timerSub = undefined; }
  }

  /** Persist best time by difficulty to localStorage */
  private persistBestTime(s: GameState): void {
    const sec = s.elapsedMs / 1000;
    const key = 'ms-best-times';
    const current = JSON.parse(localStorage.getItem(key) || '{}');
    const prev = current[s.difficulty];
    if (!prev || sec < prev) {
      current[s.difficulty] = sec;
      localStorage.setItem(key, JSON.stringify(current));
    }
  }

  getBestTimeSec(difficulty: Difficulty): number | null {
    const key = 'ms-best-times';
    const current = JSON.parse(localStorage.getItem(key) || '{}');
    return typeof current[difficulty] === 'number' ? current[difficulty] : null;
  }
}
