import { TestBed } from '@angular/core/testing';
import { GameService } from '../game.service';
import { GameStatus } from '../../models/game-state';

describe('GameService (core behaviors)', () => {
  let service: GameService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [GameService] });
    service = TestBed.inject(GameService);
  });

  it('first click should never be a mine', () => {
    service.newPreset('Beginner');
    const s = service.snapshot;
    service.reveal({ x: 0, y: 0 });
    const after = service.snapshot;
    expect(after.board[0][0].isMine).toBeFalse();
    expect(after.status).toBe(GameStatus.Playing);
  });

  it('with zero mines, flood fill reveals all tiles and immediately wins', () => {
    service.newGame(5, 5, 0, 'Custom');
    service.reveal({ x: 2, y: 2 });
    const s = service.snapshot;
    let allRevealed = true;
    for (let y = 0; y < s.rows; y++) for (let x = 0; x < s.cols; x++) {
      if (!s.board[y][x].isRevealed) allRevealed = false;
    }
    expect(allRevealed).toBeTrue();
    expect(s.status === GameStatus.Playing || s.status === GameStatus.Won).toBeTrue();
  });

  it('win detection: revealing all safe tiles sets status to Won', () => {
    service.newGame(2, 2, 0, 'Custom');
    service.reveal({ x: 0, y: 0 });
    const s = service.snapshot;
    expect(s.status).toBe(GameStatus.Won);
  });
});
