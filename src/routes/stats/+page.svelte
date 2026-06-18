<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { getTurnLog, getGameState, resetGame, initGameState } from '$lib/timer/state.svelte';
	import { formatTime } from '$lib/timer/engine';
	import { COLOR_VALUES } from '$lib/db/schema';
	import * as m from '$lib/paraglide/messages.js';
	import { confirmAction } from '$lib/components/modal.js';
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

	async function handleNewGame() {
		const confirmed = await confirmAction(
			m['stats.confirmNewGameTitle'](),
			m['stats.confirmNewGame']()
		);
		if (confirmed) {
			resetGame();
			goto(base + '/');
		}
	}

	function handleBackToGame() {
		goto(base + '/game');
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
		<h1>{m['stats.title']()}</h1>
		{#if gameState && gameState.phase !== 'game_over'}
			<button class="btn-back" onclick={handleBackToGame}>{m['stats.backToGame']()}</button>
		{/if}
	</header>

	{#if !stats}
		<p class="no-data">{m['stats.noTurns']()}</p>
	{:else}
		<!-- Game Summary -->
		<section class="stats-section">
			<h2>{m['stats.summary']()}</h2>
			<div class="summary-grid">
				<div class="summary-item">
					<span class="summary-value">{formatTime(stats.totalDuration)}</span>
					<span class="summary-label">{m['stats.totalTime']()}</span>
				</div>
				<div class="summary-item">
					<span class="summary-value">{stats.totalTurns}</span>
					<span class="summary-label">{m['stats.totalTurns']()}</span>
				</div>
				<div class="summary-item">
					<span class="summary-value overtime">{m['common.overtimePrefix']()}{formatTime(stats.totalOvertime)}</span>
					<span class="summary-label">{m['stats.totalOvertime']()}</span>
				</div>
				<div class="summary-item">
					<span class="summary-value">{stats.slowestPlayer.player.name}</span>
					<span class="summary-label">{m['stats.mostOvertime']()}</span>
				</div>
			</div>
		</section>

		<!-- Per-Player Stats -->
		<section class="stats-section">
			<h2>{m['stats.playerStats']()}</h2>
			<div class="stats-table-wrapper">
				<table class="stats-table">
					<thead>
						<tr>
							<th>{m['stats.player']()}</th>
							<th>{m['stats.avgTime']()}</th>
							<th>{m['stats.overtime']()}</th>
							<th>{m['stats.turnsOver']()}</th>
							<th>{m['stats.slowest']()}</th>
							<th>{m['stats.fastest']()}</th>
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
								<td>{formatTime(ps.avgTime)}</td>
								<td class:overtime={ps.totalOvertime > 0}
									>{m['common.overtimePrefix']()}{formatTime(ps.totalOvertime)}</td
								>
								<td>{ps.turnsOverTime}</td>
								<td>{formatTime(ps.slowest)}</td>
								<td>{formatTime(ps.fastest)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>

		<!-- Turn-by-Turn Breakdown -->
		<section class="stats-section">
			<h2>{m['stats.turnByTurn']()}</h2>
			<div class="turn-log">
				{#each Array.from(groupByRound(turnLog).entries()) as [round, entries]}
					<div class="round-group">
						<h3>{m['stats.round']({ round })}</h3>
						<ul class="round-turns">
							{#each entries as entry}
								{@const player = gameState?.players[entry.playerIndex]}
								<li class="turn-entry">
									<span
										class="color-dot"
										class:color-dot-white={player?.color === 'white'}
										style="background-color: {player ? COLOR_VALUES[player.color] : '#ccc'}"
									></span>
									<span class="turn-player">{player?.name ?? m['stats.unknown']()}</span>
									<span class="turn-duration">{formatTime(entry.durationMs)}</span>
									{#if entry.overtimeMs > 0}
										<span class="turn-overtime overtime"
											>{m['common.overtimePrefix']()}{formatTime(entry.overtimeMs)}</span
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
		<button class="btn-start" onclick={handleNewGame}>{m['stats.newGame']()}</button>
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
