import { Routes } from '@angular/router';
import { GamePageComponent } from './views/game-page.component';
import { LeaderboardComponent } from './components/leaderboard/leaderboard.component';
import { AboutComponent } from './components/about/about.component';

export const routes: Routes = [
  { path: '', component: GamePageComponent, title: 'Minesweeper' },
  { path: 'leaderboard', component: LeaderboardComponent, title: 'Leaderboard' },
  { path: 'about', component: AboutComponent, title: 'About' },
  { path: '**', redirectTo: '' }
];
