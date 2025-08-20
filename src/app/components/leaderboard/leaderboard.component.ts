import { Component, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';
import { Difficulty } from '../../models/game-state';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="panel">
    <h2>🏆 Leaderboard</h2>
    <p>Fastest times are stored locally in your browser.</p>
    <table>
      <thead><tr><th>Difficulty</th><th>Best Time (s)</th></tr></thead>
      <tbody>
        <tr *ngFor="let row of rows">
          <td>{{row.diff}}</td>
          <td>{{row.time === null ? '—' : (row.time | number: '1.1-1')}}</td>
        </tr>
      </tbody>
    </table>
    <div style="margin-top:10px">
      <button (click)="reset()">Reset Times</button>
    </div>
  </div>
  `,
  styles: [`
    h2 { margin: 0 0 8px 0; }
    table { width:100%; border-collapse: collapse; }
    th, td { padding: 8px 10px; border-bottom: 1px solid #263064; text-align: left; }
  `]
})
export class LeaderboardComponent {
  rows: Array<{ diff: Difficulty, time: number | null }> = [
    { diff: 'Beginner', time: null },
    { diff: 'Intermediate', time: null },
    { diff: 'Expert', time: null },
    { diff: 'Custom', time: null },
  ];
  constructor(private game: GameService) {
    this.refresh();
  }
  refresh(){
    this.rows = this.rows.map(r => ({ ...r, time: this.game.getBestTimeSec(r.diff) }));
  }
  reset(){
    localStorage.removeItem('ms-best-times');
    this.refresh();
  }
}
