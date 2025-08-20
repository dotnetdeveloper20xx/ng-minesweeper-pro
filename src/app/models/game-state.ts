import { Tile } from './tile';

export type Difficulty = 'Beginner' | 'Intermediate' | 'Expert' | 'Custom';

export enum GameStatus {
  Ready = 'ready',
  Playing = 'playing',
  Won = 'won',
  Lost = 'lost',
}

export interface GameState {
  board: Tile[][];
  rows: number;
  cols: number;
  mines: number;
  flagsPlaced: number;
  status: GameStatus;
  firstClick: boolean;
  startedAt?: number;
  elapsedMs: number;
  minesLeft: number;
  difficulty: Difficulty;
  hintsLeft: number;
}
