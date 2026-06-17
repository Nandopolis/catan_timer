import type { GameState, PlayerConfig } from '$lib/db/schema';

export function getRemainingMs(state: GameState): number {
	return state.durationMs - (performance.now() - state.turnStartTimestamp) + state.pausedDurationMs;
}

export function isExpired(state: GameState): boolean {
	return getRemainingMs(state) <= 0;
}

export function getOvertimeMs(state: GameState): number {
	return isExpired(state) ? Math.abs(getRemainingMs(state)) : 0;
}

export function formatTime(ms: number, isOvertime: boolean): string {
	const absMs = Math.abs(ms);
	const totalSeconds = Math.floor(absMs / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	const prefix = isOvertime ? '+' : '';

	if (hours > 0) {
		return `${prefix}${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
	}
	return `${prefix}${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function shouldShowOvertime(state: GameState): boolean {
	return state.phase === 'overtime';
}

export function advanceTurn(state: GameState): GameState {
	const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
	const nextRound = nextPlayerIndex === 0 ? state.round + 1 : state.round;

	return {
		...state,
		currentPlayerIndex: nextPlayerIndex,
		round: nextRound,
		turnStartTimestamp: performance.now(),
		turnStartWallClock: Date.now(),
		pausedAt: null,
		pausedDurationMs: 0,
		phase: 'countdown' as const
	};
}

export function pauseGame(state: GameState): GameState {
	return {
		...state,
		phase: 'paused' as const,
		pausedAt: performance.now()
	};
}

export function resumeGame(state: GameState): GameState {
	if (state.pausedAt === null) return state;
	const additionalPaused = performance.now() - state.pausedAt;
	const newPausedDurationMs = state.pausedDurationMs + additionalPaused;

	const resumedState = {
		...state,
		pausedDurationMs: newPausedDurationMs,
		pausedAt: null
	};

	// Determine phase based on whether timer is expired after resume
	const remaining = getRemainingMs(resumedState);
	return {
		...resumedState,
		phase: remaining <= 0 ? 'overtime' : 'countdown'
	};
}

export function startGame(players: PlayerConfig[], durationMs: number): GameState {
	return {
		phase: 'countdown',
		players,
		durationMs,
		currentPlayerIndex: 0,
		round: 1,
		turnStartTimestamp: performance.now(),
		turnStartWallClock: Date.now(),
		pausedAt: null,
		pausedDurationMs: 0,
		turnLog: []
	};
}

export function endGame(state: GameState): GameState {
	return { ...state, phase: 'game_over' };
}
