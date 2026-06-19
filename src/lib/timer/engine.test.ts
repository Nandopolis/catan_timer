import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { GameState, PlayerConfig } from '$lib/db/schema';
import {
  getRemainingMs, isExpired, getOvertimeMs, formatTime,
  advanceTurn, pauseGame, resumeGame, startGame, endGame
} from './engine';

// Mock performance.now()
let perfNow = 0;
vi.stubGlobal('performance', {
  now: () => perfNow
});

function createState(overrides: Partial<GameState> = {}): GameState {
  return {
    phase: 'countdown',
    players: [
      { name: 'Alice', color: 'red' },
      { name: 'Bob', color: 'blue' },
      { name: 'Charlie', color: 'green' }
    ],
    durationMs: 180000,
    currentPlayerIndex: 0,
    round: 1,
    turnStartTimestamp: 0,
    turnStartWallClock: Date.now(),
    pausedAt: null,
    pausedDurationMs: 0,
    turnLog: [],
    ...overrides
  };
}

describe('getRemainingMs', () => {
  it('returns full duration for fresh state', () => {
    perfNow = 0;
    const state = createState();
    expect(getRemainingMs(state)).toBe(180000);
  });

  it('returns reduced duration after elapsed time', () => {
    perfNow = 60000;
    const state = createState();
    expect(getRemainingMs(state)).toBe(120000);
  });

  it('accounts for paused duration', () => {
    perfNow = 60000;
    const state = createState({ pausedDurationMs: 10000 });
    expect(getRemainingMs(state)).toBe(130000);
  });
});

describe('isExpired', () => {
  it('returns false when time remaining', () => {
    perfNow = 60000;
    const state = createState();
    expect(isExpired(state)).toBe(false);
  });

  it('returns true when expired', () => {
    perfNow = 200000;
    const state = createState();
    expect(isExpired(state)).toBe(true);
  });
});

describe('getOvertimeMs', () => {
  it('returns 0 when not expired', () => {
    perfNow = 60000;
    const state = createState();
    expect(getOvertimeMs(state)).toBe(0);
  });

  it('returns positive overtime when expired', () => {
    perfNow = 200000;
    const state = createState();
    expect(getOvertimeMs(state)).toBe(20000);
  });
});

describe('formatTime', () => {
  it('formats countdown as M:SS', () => {
    expect(formatTime(180000)).toBe('3:00');
    expect(formatTime(45000)).toBe('0:45');
    expect(formatTime(61000)).toBe('1:01');
  });

  it('formats overtime as M:SS', () => {
    expect(formatTime(-45000)).toBe('0:45');
  });

  it('formats long overtime as H:MM:SS', () => {
    expect(formatTime(-3600000)).toBe('1:00:00');
    expect(formatTime(-3661000)).toBe('1:01:01');
  });
});

describe('advanceTurn', () => {
  it('advances to next player', () => {
    perfNow = 50000;
    const state = createState();
    const next = advanceTurn(state);
    expect(next.currentPlayerIndex).toBe(1);
    expect(next.turnStartTimestamp).toBe(50000);
  });

  it('increments round when cycling back to first player', () => {
    const state = createState({ currentPlayerIndex: 2 });
    const next = advanceTurn(state);
    expect(next.currentPlayerIndex).toBe(0);
    expect(next.round).toBe(2);
  });

  it('resets paused state', () => {
    const state = createState({ pausedAt: 1000, pausedDurationMs: 5000 });
    const next = advanceTurn(state);
    expect(next.pausedAt).toBeNull();
    expect(next.pausedDurationMs).toBe(0);
  });

  it('does not mutate input', () => {
    const state = createState();
    const originalIndex = state.currentPlayerIndex;
    advanceTurn(state);
    expect(state.currentPlayerIndex).toBe(originalIndex);
  });
});

describe('pauseGame / resumeGame', () => {
  it('pause sets phase to paused', () => {
    perfNow = 50000;
    const state = createState();
    const paused = pauseGame(state);
    expect(paused.phase).toBe('paused');
    expect(paused.pausedAt).toBe(50000);
  });

  it('resume from countdown returns to countdown', () => {
    perfNow = 50000;
    const state = createState();
    const paused = pauseGame(state);
    perfNow = 60000;
    const resumed = resumeGame(paused);
    expect(resumed.phase).toBe('countdown');
    expect(resumed.pausedDurationMs).toBe(10000);
  });

  it('resume from overtime returns to overtime', () => {
    perfNow = 200000;
    const state = createState();
    const paused = pauseGame(state);
    perfNow = 210000;
    const resumed = resumeGame(paused);
    expect(resumed.phase).toBe('overtime');
  });
});

describe('startGame', () => {
  it('creates valid initial state', () => {
    const players: PlayerConfig[] = [
      { name: 'A', color: 'red' }
    ];
    perfNow = 1000;
    const state = startGame(players, 120000);
    expect(state.phase).toBe('countdown');
    expect(state.players).toEqual(players);
    expect(state.durationMs).toBe(120000);
    expect(state.currentPlayerIndex).toBe(0);
    expect(state.round).toBe(1);
    expect(state.turnStartTimestamp).toBe(1000);
  });
});

describe('endGame', () => {
  it('sets phase to game_over', () => {
    const state = createState();
    const ended = endGame(state);
    expect(ended.phase).toBe('game_over');
  });
});
