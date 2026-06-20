import type { GameState, PlayerConfig, TurnLogEntry } from '$lib/db/schema';
import {
	getRemainingMs,
	isExpired,
	getOvertimeMs,
	formatTime,
	advanceTurn,
	pauseGame,
	resumeGame,
	startGame,
	endGame
} from './engine';
import { saveGameState, loadGameState, saveTurnLogEntry, clearAllData } from '$lib/db';
import { alarmManager } from '$lib/audio';
import { requestWakeLock, releaseWakeLock } from '$lib/wakelock';
import { requestNotificationPermission, notifyTimerExpired } from '$lib/notifications';

// Reactive state
let gameState = $state<GameState | null>(null);
let currentTime = $state(performance.now());
let alarmTriggered = $state(false);

// Derived values
const remainingMs = $derived(
	gameState
		? gameState.durationMs - (currentTime - gameState.turnStartTimestamp) + gameState.pausedDurationMs
		: 0
);
const expired = $derived(remainingMs <= 0);
const overtimeMs = $derived(expired ? Math.abs(remainingMs) : 0);
const displayTime = $derived(
	gameState ? formatTime(expired ? -overtimeMs : remainingMs) : '0:00'
);
const currentPlayer = $derived(
	gameState ? gameState.players[gameState.currentPlayerIndex] : null
);
const currentRound = $derived(gameState?.round ?? 0);
const isPaused = $derived(gameState?.phase === 'paused');
const isHandoff = $derived(gameState?.phase === 'handoff');

// Timer loop management
let stopTimerLoop: (() => void) | null = null;

function startTimerLoopInternal() {
	stopTimerLoop?.();

	let rafId: number;
	const tick = () => {
		if (gameState && gameState.phase !== 'paused' && gameState.phase !== 'handoff' && gameState.phase !== 'game_over') {
			currentTime = performance.now();

			const remaining = gameState.durationMs - (currentTime - gameState.turnStartTimestamp) + gameState.pausedDurationMs;
			if (!alarmTriggered && remaining <= 0 && gameState.phase === 'countdown') {
				gameState = { ...gameState, phase: 'overtime' };
				alarmTriggered = true;
				alarmManager.playAlarm();
				if (currentPlayer) {
					notifyTimerExpired(currentPlayer.name);
				}
				saveGameState(gameState);
			}
		}
		rafId = requestAnimationFrame(tick);
	};
	rafId = requestAnimationFrame(tick);
	stopTimerLoop = () => {
		cancelAnimationFrame(rafId);
		stopTimerLoop = null;
	};
}

export function initGameState() {
	loadGameState().then((state) => {
		if (state && state.phase !== 'setup' && state.phase !== 'game_over') {
			// Rebase performance timestamps using wall clock for page refresh recovery.
			// performance.now() resets on navigation, so we use the stable Date.now()
			// wall-clock reference to reconstruct elapsed time.
			const elapsedWallClock = Date.now() - state.turnStartWallClock;
			const rebasedTurnStart = performance.now() - elapsedWallClock;

			let rebasedPausedAt: number | null = state.pausedAt;
			if (state.pausedAt !== null) {
				const pauseOffset = state.pausedAt - state.turnStartTimestamp;
				rebasedPausedAt = rebasedTurnStart + pauseOffset;
			}

			gameState = {
				...state,
				turnStartTimestamp: rebasedTurnStart,
				pausedAt: rebasedPausedAt
			};

			if (gameState.phase === 'overtime') {
				alarmTriggered = true;
			} else if (gameState.phase === 'paused') {
				alarmTriggered = isExpired(gameState);
			} else {
				alarmTriggered = false;
			}

			alarmManager.init();
			requestWakeLock();
			requestNotificationPermission();
			startTimerLoopInternal();
		}
	});
}

export async function startNewGame(players: PlayerConfig[], durationMs: number) {
	alarmTriggered = false;
	gameState = startGame(players, durationMs);
	await saveGameState(gameState);
	alarmManager.init();
	await requestWakeLock();
	await requestNotificationPermission();
	startTimerLoopInternal();
}

export async function endTurn() {
	if (!gameState) return;

	const entry: TurnLogEntry = {
		playerIndex: gameState.currentPlayerIndex,
		round: gameState.round,
		startedAt: gameState.turnStartWallClock,
		endedAt: Date.now(),
		durationMs: gameState.durationMs - getRemainingMs(gameState),
		overtimeMs: getOvertimeMs(gameState),
		wasPaused: gameState.pausedDurationMs > 0,
		pausedDurationMs: gameState.pausedDurationMs,
		metadata: {}
	};

	gameState = advanceTurn(gameState);
	gameState = { ...gameState, phase: 'handoff' as const, turnLog: [...gameState.turnLog, entry] };
	alarmTriggered = false;
	await saveGameState(gameState);
	await saveTurnLogEntry(entry);
}

export async function startTurn() {
	if (!gameState || gameState.phase !== 'handoff') return;

	gameState = {
		...gameState,
		turnStartTimestamp: performance.now(),
		turnStartWallClock: Date.now(),
		phase: 'countdown' as const
	};
	alarmTriggered = false;
	await saveGameState(gameState);
}

export async function pause() {
	if (!gameState) return;
	gameState = pauseGame(gameState);
	await saveGameState(gameState);
}

export async function resume() {
	if (!gameState) return;
	gameState = resumeGame(gameState);
	await saveGameState(gameState);
}

export async function endCurrentGame() {
	if (!gameState) return;
	gameState = endGame(gameState);
	await saveGameState(gameState);
	await releaseWakeLock();
	stopTimerLoop?.();
}

export async function resetGame() {
	gameState = null;
	alarmTriggered = false;
	await clearAllData();
	await releaseWakeLock();
	stopTimerLoop?.();
}

// Export reactive getters
export function getGameState() {
	return gameState;
}
export function getDisplayTime() {
	return displayTime;
}
export function getCurrentPlayer() {
	return currentPlayer;
}
export function getCurrentRound() {
	return currentRound;
}
export function getIsPaused() {
	return isPaused;
}
export function getIsHandoff() {
	return isHandoff;
}
export function getIsExpired() {
	return expired;
}
export function getTurnLog() {
	return gameState?.turnLog ?? [];
}
