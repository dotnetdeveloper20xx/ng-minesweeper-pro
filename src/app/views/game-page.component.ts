import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BoardComponent } from '../components/board/board.component';
import { GameService } from '../services/game.service';
import { GameStatus } from '../models/game-state';

@Component({
  selector: 'app-game-page',
  standalone: true,
  imports: [CommonModule, BoardComponent],
  template: `
  <div class="panel controls">
    <div class="difficulty">
      <button (click)="newGame('Beginner')">Beginner 9×9 · 10 💣</button>
      <button (click)="newGame('Intermediate')">Intermediate 16×16 · 40 💣</button>
      <button (click)="newGame('Expert')">Expert 16×30 · 99 💣</button>
    </div>
    <div class="stats" *ngIf="(state$ | async) as s">
      <span class="badge" aria-live="polite">⏱ {{ (s.elapsedMs/1000) | number : '1.1-1' }}s</span>
      <span class="badge">🚩 Flags: {{ s.flagsPlaced }}</span>
      <span class="badge">💣 Mines: {{ s.minesLeft }}</span>
      <span class="badge" *ngIf="bestTimeSec !== null">🏆 Best ({{s.difficulty}}): {{ bestTimeSec | number: '1.1-1' }}s</span>
      <button (click)="restart()">Restart</button>
      <button (click)="hint()" [disabled]="(state$ | async)?.hintsLeft === 0">Hint ({{(state$ | async)?.hintsLeft}})</button>
    </div>
  </div>

  <div class="panel" *ngIf="(state$ | async) as s">
    <div class="status" [ngClass]="s.status">
      <ng-container [ngSwitch]="s.status">
        <span *ngSwitchCase="GameStatus.Ready" aria-live="polite">Tap a tile to start.</span>
        <span *ngSwitchCase="GameStatus.Playing" aria-live="polite">Good luck!</span>
        <span *ngSwitchCase="GameStatus.Won" aria-live="polite">🎉 You Win!</span>
        <span *ngSwitchCase="GameStatus.Lost" aria-live="polite">💥 Boom! You hit a mine.</span>
      </ng-container>
    </div>

    <app-board
      [board]="s.board"
      [rows]="s.rows"
      [cols]="s.cols">
    </app-board>
  </div>

  <div class="footer">
    <p>
      Keyboard: Arrow keys to move, <kbd>Space</kbd>/<kbd>Enter</kbd> reveal, <kbd>F</kbd> flag, 
      <kbd>C</kbd>/<kbd>Enter</kbd> on a number = chord. Long‑press on mobile to place 🚩.
    </p>
  </div>
  `
})
export class GamePageComponent {
  GameStatus = GameStatus;
  private game = inject(GameService);
  state$ = this.game.state$;
  bestTimeSec: number | null = this.game.getBestTimeSec(this.game.snapshot.difficulty);

  newGame(preset: 'Beginner'|'Intermediate'|'Expert'){
    this.game.newPreset(preset);
    this.bestTimeSec = this.game.getBestTimeSec(preset);
  }
  restart(){ this.game.restart(); }
  hint(){ this.game.useHint(); }
}
