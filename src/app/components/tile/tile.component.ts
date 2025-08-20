import { Component, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Tile } from '../../models/tile';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-tile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tile.component.html',
  styleUrls: ['./tile.component.css']
})
export class TileComponent implements OnDestroy {
  @Input({ required: true }) tile!: Tile;
  private pressTimer?: any;

  constructor(private game: GameService) {}

  ngOnDestroy(): void { this.clearPressTimer(); }

  onClick(): void {
    this.game.reveal(this.tile);
  }
  onRightClick(ev: MouseEvent): void {
    ev.preventDefault();
    this.game.toggleFlag(this.tile);
  }
  onDblClick(): void { this.game.chord(this.tile); }
  onAuxClick(ev: MouseEvent): void { if (ev.button === 1) this.game.chord(this.tile); }

  // keyboard controls
  onKeyDown(ev: KeyboardEvent): void {
    if (ev.key === ' ' || ev.key === 'Enter') {
      // Enter on a revealed number will chord
      if (this.tile.isRevealed && !this.tile.isMine && this.tile.adjacentMines > 0) {
        this.game.chord(this.tile);
      } else {
        this.game.reveal(this.tile);
      }
      ev.preventDefault();
    } else if (ev.key.toLowerCase() === 'f') {
      this.game.toggleFlag(this.tile);
      ev.preventDefault();
    } else if (ev.key.toLowerCase() === 'c') {
      this.game.chord(this.tile);
      ev.preventDefault();
    }
  }

  // touch long-press to flag
  onTouchStart(): void {
    this.clearPressTimer();
    this.pressTimer = setTimeout(() => {
      this.game.toggleFlag(this.tile);
      this.pressTimer = undefined;
    }, 450);
  }
  onTouchEnd(): void {
    if (this.pressTimer) this.game.reveal(this.tile);
    this.clearPressTimer();
  }
  private clearPressTimer(): void { if (this.pressTimer) { clearTimeout(this.pressTimer); this.pressTimer = undefined; } }

  numberClass(n: number): string { return n > 0 ? 'n' + n : ''; }
  ariaLabel(): string {
    if (!this.tile.isRevealed) return this.tile.isFlagged ? 'flagged tile' : 'hidden tile';
    if (this.tile.isMine) return 'mine';
    return this.tile.adjacentMines === 0 ? 'empty tile' : `${this.tile.adjacentMines} adjacent mines`;
  }
}
