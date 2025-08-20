import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Tile } from '../../models/tile';
import { TileComponent } from '../tile/tile.component';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, TileComponent],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css']
})
export class BoardComponent {
  @Input({ required: true }) board!: Tile[][];
  @Input() rows = 0;
  @Input() cols = 0;

  trackByTile(_i: number, t: Tile): string { return t.y + ':' + t.x; }
  get gridCols(): string { return `repeat(${this.cols}, var(--tile-size))`; }
}
