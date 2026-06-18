<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import {
		getGameState,
		getDisplayTime,
		getCurrentPlayer,
		getCurrentRound,
		getIsPaused,
		getIsExpired,
		pause,
		resume,
		endTurn,
		endCurrentGame,
		resetGame,
		initGameState
	} from '$lib/timer/state.svelte';
	import { COLOR_VALUES } from '$lib/db/schema';
	import type { PlayerColor } from '$lib/db/schema';

	let gameState = $derived(getGameState());
	let displayTime = $derived(getDisplayTime());
	let currentPlayer = $derived(getCurrentPlayer());
	let currentRound = $derived(getCurrentRound());
	let isPaused = $derived(getIsPaused());
	let isExpired = $derived(getIsExpired());

	let pulseActive = $state(false);
	let prevExpired = $state(false);

	onMount(() => {
		initGameState();
	});

	// Trigger pulse animation when overtime starts
	$effect(() => {
		if (isExpired && !prevExpired) {
			pulseActive = true;
			const timer = setTimeout(() => (pulseActive = false), 2000);
			return () => clearTimeout(timer);
		}
		prevExpired = isExpired;
	});

	let endTurnDisabled = $state(false);

	async function handleEndTurn() {
		if (endTurnDisabled || !gameState) return;
		endTurnDisabled = true;
		await endTurn();
		setTimeout(() => {
			endTurnDisabled = false;
		}, 300);
	}

	function handleEndGame() {
		if (confirm('End game? Current progress will be saved.')) {
			endCurrentGame();
			goto('/stats');
		}
	}

	function handleNewGame() {
		if (confirm('Start new game? Current game will be lost.')) {
			resetGame();
			goto('/');
		}
	}

	function playerColorVar(color: PlayerColor): string {
		return `var(--color-player-${color})`;
	}

	function endTurnTextColor(color: PlayerColor): string {
		return color === 'white' || color === 'yellow' ? '#1A1A2E' : '#FFFFFF';
	}
</script>

<main class="game">
	<header class="game-header">
		<span class="round-badge">Round {currentRound}</span>
		<button class="btn-icon" onclick={() => goto('/stats')} aria-label="View stats">
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
				<rect x="2" y="10" width="4" height="8" rx="1" fill="currentColor" />
				<rect x="8" y="6" width="4" height="12" rx="1" fill="currentColor" />
				<rect x="14" y="2" width="4" height="16" rx="1" fill="currentColor" />
			</svg>
		</button>
	</header>

	<section
		class="timer-section"
		class:overtime={isExpired}
		class:overtime-pulse={pulseActive}
		class:paused={isPaused}
		style:color={currentPlayer ? playerColorVar(currentPlayer.color) : 'inherit'}
	>
		<div class="timer-display">{displayTime}</div>
		<div class="player-name">{currentPlayer?.name ?? ''}</div>
		{#if isPaused}
			<div class="paused-label">PAUSED</div>
		{/if}
	</section>

	<section class="players-section">
		<ul class="player-chips">
			{#each gameState?.players ?? [] as player, i}
				<li class="player-chip" class:active={i === gameState?.currentPlayerIndex}>
					<span
						class="color-dot"
						class:color-dot-white={player.color === 'white'}
						style="background-color: {COLOR_VALUES[player.color]}"
					></span>
					<span class="player-chip-name">{player.name}</span>
				</li>
			{/each}
		</ul>
	</section>

	<section class="controls-section">
		<button
			class="btn-end-turn"
			onclick={handleEndTurn}
			disabled={endTurnDisabled || isPaused}
			style:background-color={currentPlayer ? COLOR_VALUES[currentPlayer.color] : 'var(--color-accent)'}
			style:color={currentPlayer ? endTurnTextColor(currentPlayer.color) : '#1A1A2E'}
		>
			End Turn
		</button>
		<div class="controls-row">
			<button class="btn-pause" onclick={() => (isPaused ? resume() : pause())}>
				{isPaused ? 'Resume' : 'Pause'}
			</button>
			<button class="btn-end-game" onclick={handleEndGame}>End Game</button>
			<button class="btn-new-game" onclick={handleNewGame}>New Game</button>
		</div>
	</section>

</main>

<style>
	.game {
		display: flex;
		flex-direction: column;
		min-height: 100dvh;
		padding: var(--space-md);
	}

	/* Header */
	.game-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.round-badge {
		font-size: var(--font-size-small);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-muted);
		background-color: var(--color-surface);
		padding: var(--space-xs) var(--space-sm);
		border-radius: var(--radius-full);
	}

	.btn-icon {
		color: var(--color-muted);
		min-height: 48px;
		min-width: 48px;
		padding: var(--space-xs);
		border-radius: var(--radius-md);
	}

	.btn-icon:hover {
		background-color: var(--color-surface);
		color: var(--color-text);
	}

	/* Timer section */
	.timer-section {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-sm);
		padding: var(--space-lg) 0;
		transition: color 0.3s ease;
		position: relative;
	}

	.timer-section .timer-display {
		font-family: var(--font-family-display);
		letter-spacing: -0.02em;
	}

	.timer-section.overtime .timer-display {
		color: var(--color-danger);
	}

	.timer-section.paused .timer-display,
	.timer-section.paused .player-name {
		opacity: 0.4;
	}

	.paused-label {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: var(--font-size-timer);
		font-weight: 700;
		letter-spacing: 0.15em;
		color: var(--color-text);
		pointer-events: none;
	}

	.player-name {
		font-size: var(--font-size-large);
		font-family: var(--font-family-display);
		font-weight: 400;
		letter-spacing: -0.01em;
	}

	.timer-section.overtime .player-name {
		color: var(--color-danger);
	}

	/* Player chips */
	.players-section {
		padding: var(--space-md) 0;
	}

	.player-chips {
		list-style: none;
		display: flex;
		justify-content: center;
		gap: var(--space-sm);
		flex-wrap: wrap;
	}

	.player-chip {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-xs) var(--space-sm);
		border-radius: var(--radius-full);
		border: 2px solid transparent;
		background-color: var(--color-surface);
		transition: border-color 0.15s ease, background-color 0.15s ease;
	}

	.player-chip.active {
		border-color: var(--color-accent);
		background-color: var(--color-surface-raised);
	}

	.player-chip .color-dot {
		width: 16px;
		height: 16px;
		min-height: 16px;
		min-width: 16px;
		padding: 0;
		cursor: default;
		border: 1px solid transparent;
	}

	.player-chip .color-dot-white {
		border-color: var(--color-muted);
	}

	.player-chip .color-dot:hover {
		border-color: transparent;
	}

	.player-chip .color-dot-white:hover {
		border-color: var(--color-muted);
	}

	.player-chip .color-dot:active {
		transform: none;
	}

	.player-chip-name {
		font-size: var(--font-size-small);
		font-weight: 600;
		white-space: nowrap;
	}

	/* Controls */
	.controls-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		padding-top: var(--space-md);
	}

	.controls-row {
		display: flex;
		gap: var(--space-sm);
	}

	.controls-row > * {
		flex: 1;
	}

	.btn-end-turn {
		width: 100%;
		min-height: 56px;
		font-size: var(--font-size-body);
		font-weight: 700;
		border-radius: var(--radius-lg);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		transition: opacity 0.15s ease, transform 0.1s ease;
	}

	.btn-end-turn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-end-turn:not(:disabled):active {
		transform: scale(0.97);
	}

	.btn-pause {
		background-color: var(--color-surface-raised);
		color: var(--color-text);
		font-weight: 700;
		border-radius: var(--radius-lg);
	}

	.btn-pause:hover {
		background-color: var(--color-surface-hover);
	}

	.btn-end-game {
		background-color: var(--color-surface);
		color: var(--color-danger);
		font-weight: 600;
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-border);
	}

	.btn-end-game:hover {
		background-color: var(--color-surface-raised);
	}

	.btn-new-game {
		background-color: var(--color-surface);
		color: var(--color-muted);
		font-weight: 600;
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-border);
	}

	.btn-new-game:hover {
		background-color: var(--color-surface-raised);
		color: var(--color-text);
	}

	/* Small screens */
	@media (max-width: 375px) {
		.game {
			padding: var(--space-sm);
		}

		.player-chip-name {
			font-size: var(--font-size-xs);
		}

		.controls-row {
			flex-wrap: wrap;
		}

		.controls-row > * {
			flex: 1 1 calc(50% - var(--space-sm) / 2);
		}
	}

	/* Landscape layout */
	@media (orientation: landscape) and (min-width: 768px) {
		.game {
			flex-direction: row;
			flex-wrap: wrap;
			align-items: center;
			justify-content: center;
			gap: var(--space-lg);
		}

		.game-header {
			width: 100%;
			flex: 0 0 auto;
		}

		.timer-section {
			flex: 1 1 50%;
			min-height: auto;
			padding: var(--space-md) 0;
		}

		.players-section {
			flex: 0 0 auto;
			padding: 0;
		}

		.player-chips {
			flex-direction: column;
			align-items: flex-start;
		}

		.controls-section {
			width: 100%;
			flex: 0 0 auto;
		}
	}
</style>
