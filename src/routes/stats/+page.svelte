<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { getTurnLog, getGameState, resetGame, initGameState } from '$lib/timer/state.svelte';
	import { COLOR_VALUES } from '$lib/db/schema';
	import type { TurnLogEntry, PlayerColor } from '$lib/db/schema';

	onMount(() => {
		initGameState();
	});

	let gameState = $derived(getGameState());
	let turnLog = $derived(getTurnLog());

	let stats = $derived.by(() => {
		const players = gameState?.players ?? [];
		const log = turnLog;

		if (log.length === 0) return null;

		const totalDuration = log.reduce((sum, t) => sum + t.durationMs, 0);
		const totalOvertime = log.reduce((sum, t) => sum + t.overtimeMs, 0);

		const playerStats = players.map((player, idx) => {
			const playerTurns = log.filter((t) => t.playerIndex === idx);
			const avgTime =
				playerTurns.length > 0
					? playerTurns.reduce((s, t) => s + t.durationMs, 0) / playerTurns.length
					: 0;
			const totalPlayerOvertime = playerTurns.reduce((s, t) => s + t.overtimeMs, 0);
			const turnsOverTime = playerTurns.filter((t) => t.overtimeMs > 0).length;
			const slowest =
				playerTurns.length > 0 ? Math.max(...playerTurns.map((t) => t.durationMs)) : 0;
			const fastest =
				playerTurns.length > 0 ? Math.min(...playerTurns.map((t) => t.durationMs)) : 0;

			return {
				player,
				avgTime,
				totalOvertime: totalPlayerOvertime,
				turnsOverTime,
				slowest,
				fastest,
				turnCount: playerTurns.length
			};
		});

		const slowestPlayer = playerStats.reduce((a, b) =>
			a.totalOvertime > b.totalOvertime ? a : b
		);

		return {
			totalDuration,
			totalOvertime,
			totalTurns: log.length,
			playerStats,
			slowestPlayer
		};
	});

	function formatDuration(ms: number): string {
		const seconds = Math.floor(ms / 1000);
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${String(secs).padStart(2, '0')}`;
	}

	function handleNewGame() {
		if (confirm('Start new game? Current game will be lost.')) {
			resetGame();
			goto('/');
		}
	}

	function handleBackToGame() {
		goto('/game');
	}

	function groupByRound(log: TurnLogEntry[]): Map<number, TurnLogEntry[]> {
		const groups = new Map<number, TurnLogEntry[]>();
		for (const entry of log) {
			if (!groups.has(entry.round)) groups.set(entry.round, []);
			groups.get(entry.round)!.push(entry);
		}
		return groups;
	}
</script>

<main class="stats container">
	<header class="stats-header">
		<h1>Game Stats</h1>
		{#if gameState && gameState.phase !== 'game_over'}
			<button class="btn-back" onclick={handleBackToGame}>← Back to Game</button>
		{/if}
	</header>

	{#if !stats}
		<p class="no-data">No turns completed yet.</p>
	{:else}
		<!-- Game Summary -->
		<section class="stats-section">
			<h2>Summary</h2>
			<div class="summary-grid">
				<div class="summary-item">
					<span class="summary-value">{formatDuration(stats.totalDuration)}</span>
					<span class="summary-label">Total Time</span>
				</div>
				<div class="summary-item">
					<span class="summary-value">{stats.totalTurns}</span>
					<span class="summary-label">Total Turns</span>
				</div>
				<div class="summary-item">
					<span class="summary-value overtime">+{formatDuration(stats.totalOvertime)}</span>
					<span class="summary-label">Total Overtime</span>
				</div>
				<div class="summary-item">
					<span class="summary-value">{stats.slowestPlayer.player.name}</span>
					<span class="summary-label">Most Overtime</span>
				</div>
			</div>
		</section>

		<!-- Per-Player Stats -->
		<section class="stats-section">
			<h2>Player Stats</h2>
			<div class="stats-table-wrapper">
				<table class="stats-table">
					<thead>
						<tr>
							<th>Player</th>
							<th>Avg Time</th>
							<th>Overtime</th>
							<th>Over Time</th>
							<th>Slowest</th>
							<th>Fastest</th>
						</tr>
					</thead>
					<tbody>
						{#each stats.playerStats as ps}
							<tr>
								<td>
									<span
										class="color-dot"
										class:color-dot-white={ps.player.color === 'white'}
										style="background-color: {COLOR_VALUES[ps.player.color]}"
									></span>
									{ps.player.name}
								</td>
								<td>{formatDuration(ps.avgTime)}</td>
								<td class:overtime={ps.totalOvertime > 0}
									>+{formatDuration(ps.totalOvertime)}</td
								>
								<td>{ps.turnsOverTime}</td>
								<td>{formatDuration(ps.slowest)}</td>
								<td>{formatDuration(ps.fastest)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>

		<!-- Turn-by-Turn Breakdown -->
		<section class="stats-section">
			<h2>Turn by Turn</h2>
			<div class="turn-log">
				{#each Array.from(groupByRound(turnLog).entries()) as [round, entries]}
					<div class="round-group">
						<h3>Round {round}</h3>
						<ul class="round-turns">
							{#each entries as entry}
								{@const player = gameState?.players[entry.playerIndex]}
								<li class="turn-entry">
									<span
										class="color-dot"
										class:color-dot-white={player?.color === 'white'}
										style="background-color: {player ? COLOR_VALUES[player.color] : '#ccc'}"
									></span>
									<span class="turn-player">{player?.name ?? 'Unknown'}</span>
									<span class="turn-duration">{formatDuration(entry.durationMs)}</span>
									{#if entry.overtimeMs > 0}
										<span class="turn-overtime overtime"
											>+{formatDuration(entry.overtimeMs)}</span
										>
									{/if}
								</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<div class="stats-actions">
		<button class="btn-start" onclick={handleNewGame}>New Game</button>
	</div>
</main>

<style>
	.stats {
		display: flex;
		flex-direction: column;
		min-height: 100dvh;
		padding: var(--space-lg) var(--space-md) var(--space-2xl);
	}

	/* Header */
	.stats-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-lg);
	}

	.stats-header h1 {
		font-family: var(--font-family-display);
		font-size: var(--font-size-large);
	}

	.btn-back {
		background-color: var(--color-surface-raised);
		color: var(--color-text);
		font-weight: 600;
		font-size: var(--font-size-small);
		border-radius: var(--radius-lg);
	}

	.btn-back:hover {
		background-color: var(--color-surface-hover);
	}

	/* Sections */
	.stats-section {
		margin-bottom: var(--space-xl);
	}

	.stats-section h2 {
		font-size: var(--font-size-xs);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-muted);
		margin-bottom: var(--space-md);
	}

	/* Summary grid */
	.summary-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-md);
	}

	.summary-item {
		background: var(--color-surface);
		padding: var(--space-md);
		border-radius: var(--radius-lg);
		text-align: center;
	}

	.summary-value {
		display: block;
		font-size: var(--font-size-large);
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}

	.summary-label {
		display: block;
		font-size: var(--font-size-small);
		color: var(--color-muted);
		margin-top: var(--space-xs);
	}

	/* Player stats table */
	.stats-table-wrapper {
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		margin: 0 calc(-1 * var(--space-md));
		padding: 0 var(--space-md);
	}

	.stats-table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--font-size-small);
		font-variant-numeric: tabular-nums;
		min-width: 480px;
	}

	.stats-table th,
	.stats-table td {
		padding: var(--space-sm) var(--space-md);
		text-align: left;
		border-bottom: 1px solid var(--color-border);
		white-space: nowrap;
	}

	.stats-table th {
		color: var(--color-muted);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-size: var(--font-size-xs);
		background-color: var(--color-surface);
		position: sticky;
		top: 0;
	}

	.stats-table td {
		color: var(--color-text);
	}

	.stats-table tbody tr:hover {
		background-color: var(--color-surface);
	}

	.stats-table td:first-child {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.stats-table .color-dot {
		width: 16px;
		height: 16px;
		min-height: 16px;
		min-width: 16px;
		padding: 0;
		cursor: default;
		border: 1px solid transparent;
	}

	.stats-table .color-dot-white {
		border-color: var(--color-muted);
	}

	.stats-table .color-dot:active {
		transform: none;
	}

	/* Turn-by-turn breakdown */
	.round-group {
		margin-bottom: var(--space-lg);
	}

	.round-group h3 {
		font-size: var(--font-size-small);
		font-weight: 700;
		color: var(--color-muted);
		margin-bottom: var(--space-sm);
	}

	.round-turns {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.turn-entry {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm);
		background: var(--color-surface);
		border-radius: var(--radius-md);
	}

	.turn-entry .color-dot {
		width: 16px;
		height: 16px;
		min-height: 16px;
		min-width: 16px;
		padding: 0;
		cursor: default;
		border: 1px solid transparent;
	}

	.turn-entry .color-dot-white {
		border-color: var(--color-muted);
	}

	.turn-entry .color-dot:active {
		transform: none;
	}

	.turn-player {
		font-weight: 600;
	}

	.turn-duration {
		margin-left: auto;
		font-variant-numeric: tabular-nums;
		font-weight: 600;
	}

	.turn-overtime {
		font-variant-numeric: tabular-nums;
		font-weight: 600;
	}

	/* Actions */
	.stats-actions {
		margin-top: auto;
		padding-top: var(--space-xl);
	}

	.btn-start {
		width: 100%;
		background-color: var(--color-accent);
		color: #1A1A2E;
		font-weight: 700;
		min-height: 48px;
		border-radius: var(--radius-lg);
	}

	.btn-start:hover {
		background-color: var(--color-accent-hover);
	}

	/* No data */
	.no-data {
		text-align: center;
		color: var(--color-muted);
		padding: var(--space-xl) 0;
	}

	/* Small screens */
	@media (max-width: 375px) {
		.stats {
			padding: var(--space-md) var(--space-sm) var(--space-xl);
		}

		.summary-grid {
			gap: var(--space-sm);
		}

		.summary-value {
			font-size: 1.25rem;
		}

		.turn-entry {
			padding: var(--space-xs) var(--space-sm);
		}
	}
</style>
