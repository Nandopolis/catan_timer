export type PlayerColor = 'red' | 'blue' | 'white' | 'green' | 'brown' | 'yellow';

export interface PlayerConfig {
	index: number;
	name: string;
	color: PlayerColor;
}

export interface TurnLogEntry {
	playerIndex: number;
	round: number;
	startedAt: number; // Date.now() timestamp
	endedAt: number; // Date.now() timestamp
	durationMs: number; // performance.now()-based
	overtimeMs: number;
	wasPaused: boolean;
	pausedDurationMs: number;
	metadata: Record<string, unknown>; // extensible for future VP tracking
}

export type GamePhase = 'setup' | 'countdown' | 'overtime' | 'paused' | 'game_over';

export interface GameState {
	phase: GamePhase;
	players: PlayerConfig[];
	durationMs: number;
	currentPlayerIndex: number;
	round: number;
	turnStartTimestamp: number; // performance.now()
	turnStartWallClock: number; // Date.now()
	pausedAt: number | null; // performance.now()
	pausedDurationMs: number;
	turnLog: TurnLogEntry[];
}

export const COLOR_VALUES: Record<PlayerColor, string> = {
	red: '#C0392B',
	blue: '#2980B9',
	white: '#ECF0F1',
	green: '#27AE60',
	brown: '#8B5E3C',
	yellow: '#F1C40F'
};
