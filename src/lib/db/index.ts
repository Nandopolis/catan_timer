import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { GamePhase, GameState, SetupPreferences, TurnLogEntry } from './schema';

const DB_NAME = 'catan-timer';
const DB_VERSION = 2;
const GAME_STATE_KEY = 'current';
const SETUP_PREFS_KEY = 'last';
const LOCALSTORAGE_CRITICAL_KEY = 'catan-timer-critical';

/**
 * Minimal subset of GameState needed to resume a turn after a hard reload.
 * Mirrored to localStorage so the UI can rehydrate before IndexedDB opens.
 */
export interface CriticalState {
	currentPlayerIndex: number;
	round: number;
	phase: GamePhase;
	turnStartTimestamp: number;
	turnStartWallClock: number;
	pausedAt: number | null;
	pausedDurationMs: number;
}

interface CatanTimerDB extends DBSchema {
	gameState: {
		key: string;
		value: GameState;
	};
	turnLog: {
		key: number;
		value: TurnLogEntry;
	};
	setupPreferences: {
		key: string;
		value: SetupPreferences;
	};
}

let dbPromise: Promise<IDBPDatabase<CatanTimerDB>> | null = null;

function getDB(): Promise<IDBPDatabase<CatanTimerDB>> {
	if (!dbPromise) {
		dbPromise = openDB<CatanTimerDB>(DB_NAME, DB_VERSION, {
		upgrade(db, oldVersion) {
			if (!db.objectStoreNames.contains('gameState')) {
				db.createObjectStore('gameState');
			}
			if (!db.objectStoreNames.contains('turnLog')) {
				db.createObjectStore('turnLog', { autoIncrement: true });
			}
			if (oldVersion < 2 && !db.objectStoreNames.contains('setupPreferences')) {
				db.createObjectStore('setupPreferences');
			}
		}
		});
	}
	return dbPromise;
}

function pickCritical(state: GameState): CriticalState {
	return {
		currentPlayerIndex: state.currentPlayerIndex,
		round: state.round,
		phase: state.phase,
		turnStartTimestamp: state.turnStartTimestamp,
		turnStartWallClock: state.turnStartWallClock,
		pausedAt: state.pausedAt,
		pausedDurationMs: state.pausedDurationMs
	};
}

export async function saveGameState(state: GameState): Promise<void> {
	const db = await getDB();
	// Svelte 5 $state creates deeply-nested Proxy objects that IndexedDB's
	// structuredClone cannot serialize. Deep-clone via JSON round-trip to
	// strip all proxies before persisting.
	const plain: GameState = JSON.parse(JSON.stringify(state));
	await db.put('gameState', plain, GAME_STATE_KEY);
	try {
		localStorage.setItem(LOCALSTORAGE_CRITICAL_KEY, JSON.stringify(pickCritical(state)));
	} catch {
		// localStorage may be unavailable (private mode, quota); IndexedDB is the source of truth.
	}
}

export async function loadGameState(): Promise<GameState | null> {
	const db = await getDB();
	const state = await db.get('gameState', GAME_STATE_KEY);
	return state ?? null;
}

export async function saveSetupPreferences(prefs: SetupPreferences): Promise<void> {
	const db = await getDB();
	const plain: SetupPreferences = JSON.parse(JSON.stringify(prefs));
	await db.put('setupPreferences', plain, SETUP_PREFS_KEY);
}

export async function loadSetupPreferences(): Promise<SetupPreferences | null> {
	const db = await getDB();
	return (await db.get('setupPreferences', SETUP_PREFS_KEY)) ?? null;
}

export async function saveTurnLogEntry(entry: TurnLogEntry): Promise<number> {
	const db = await getDB();
	return await db.add('turnLog', entry);
}

export async function loadTurnLog(): Promise<TurnLogEntry[]> {
	const db = await getDB();
	return await db.getAll('turnLog');
}

export async function clearAllData(): Promise<void> {
	const db = await getDB();
	await db.clear('gameState');
	await db.clear('turnLog');
	try {
		localStorage.removeItem(LOCALSTORAGE_CRITICAL_KEY);
	} catch {
		// ignore — localStorage may be unavailable
	}
}

/**
 * Returns the small slice of GameState required to rehydrate the active turn.
 * Tries localStorage first (sync, survives IndexedDB eviction), then falls
 * back to reconstructing the subset from the full IndexedDB GameState.
 */
export async function loadCriticalState(): Promise<CriticalState | null> {
	try {
		const raw = localStorage.getItem(LOCALSTORAGE_CRITICAL_KEY);
		if (raw) {
			return JSON.parse(raw) as CriticalState;
		}
	} catch {
		// fall through to IndexedDB
	}

	const state = await loadGameState();
	return state ? pickCritical(state) : null;
}
