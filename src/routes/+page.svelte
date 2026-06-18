<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { startNewGame } from '$lib/timer/state.svelte';
	import { COLOR_VALUES } from '$lib/db/schema';
	import type { PlayerConfig, PlayerColor } from '$lib/db/schema';
	import * as m from '$lib/paraglide/messages.js';
	import { getLocale, setLocale } from '$lib/i18n';

	const PLAYER_COLORS: PlayerColor[] = ['red', 'blue', 'white', 'green', 'brown', 'yellow'];

	const PRESETS = [
		{ id: 'casual', label: m['setup.presetCasual'](), sublabel: '5:00', ms: 5 * 60 * 1000 },
		{ id: 'normal', label: m['setup.presetNormal'](), sublabel: '3:00', ms: 3 * 60 * 1000 },
		{ id: 'competitive', label: m['setup.presetCompetitive'](), sublabel: '1:30', ms: 90 * 1000 }
	];

	let playerCount = $state(4);
	let selectedPresetId = $state('normal');
	let useCustom = $state(false);
	let customMinutes = $state(3);
	let customSeconds = $state(0);

	let players = $state<PlayerConfig[]>(
		Array.from({ length: 6 }, (_, i) => ({
			index: i,
			name: '',
			color: PLAYER_COLORS[i]
		}))
	);

	function cycleColor(playerIndex: number) {
		const currentColor = players[playerIndex].color;
		const currentIdx = PLAYER_COLORS.indexOf(currentColor);
		const usedColors = players.slice(0, playerCount).map((p) => p.color);

		for (let i = 1; i <= PLAYER_COLORS.length; i++) {
			const nextIdx = (currentIdx + i) % PLAYER_COLORS.length;
			const nextColor = PLAYER_COLORS[nextIdx];
			if (!usedColors.includes(nextColor) || nextColor === currentColor) {
				players[playerIndex] = { ...players[playerIndex], color: nextColor };
				break;
			}
		}
	}

	function selectPreset(preset: (typeof PRESETS)[number]) {
		selectedPresetId = preset.id;
		useCustom = false;
	}

	function getSelectedPreset() {
		return PRESETS.find((p) => p.id === selectedPresetId) ?? PRESETS[1];
	}

	function handleStart() {
		const activePlayers = players.slice(0, playerCount).map((p, i) => ({
			...p,
			name: p.name.trim() || m['setup.playerDefault']({ playerNumber: i + 1 })
		}));
		const durationMs = useCustom
			? (customMinutes * 60 + customSeconds) * 1000
			: getSelectedPreset().ms;
		startNewGame(activePlayers, durationMs);
		goto(base + '/game');
	}

	function formatCustomDisplay(): string {
		return `${customMinutes}:${String(customSeconds).padStart(2, '0')}`;
	}
</script>

<main class="setup">
	<header class="setup-header">
		<h1 class="setup-title">{m['setup.title']()}</h1>
		<p class="setup-subtitle">{m['setup.subtitle']()}</p>
	</header>

	<div class="language-switcher">
		<button
			class:active={getLocale() === 'en'}
			onclick={() => setLocale('en')}
			type="button"
		>
			EN
		</button>
		<button
			class:active={getLocale() === 'es'}
			onclick={() => setLocale('es')}
			type="button"
		>
			ES
		</button>
	</div>

	<section class="setup-section">
		<h2 class="section-label">{m['setup.players']()}</h2>
		<div class="btn-group">
			{#each [3, 4, 5, 6] as count}
				<button
					class="btn-select"
					class:active={playerCount === count}
					onclick={() => (playerCount = count)}
				>
					{count}
				</button>
			{/each}
		</div>
	</section>

	<section class="setup-section">
		<h2 class="section-label">{m['setup.turnDuration']()}</h2>
		<div class="btn-group">
			{#each PRESETS as preset}
				<button
					class="btn-select"
					class:active={preset.id === selectedPresetId && !useCustom}
					onclick={() => selectPreset(preset)}
				>
					<span class="preset-label">{preset.label}</span>
					<span class="preset-time">{preset.sublabel}</span>
				</button>
			{/each}
			<button
				class="btn-select"
				class:active={useCustom}
				onclick={() => (useCustom = true)}
			>
				<span class="preset-label">{m['setup.presetCustom']()}</span>
				<span class="preset-time">{useCustom ? formatCustomDisplay() : m['setup.customPlaceholder']()}</span>
			</button>
		</div>

		{#if useCustom}
			<div class="custom-duration">
				<label class="custom-field">
					<span class="custom-label">{m['setup.customMin']()}</span>
					<input
						type="number"
						bind:value={customMinutes}
						min={0}
						max={10}
						step={1}
					/>
				</label>
				<span class="custom-sep">:</span>
				<label class="custom-field">
					<span class="custom-label">{m['setup.customSec']()}</span>
					<input
						type="number"
						bind:value={customSeconds}
						min={0}
						max={45}
						step={15}
					/>
				</label>
			</div>
		{/if}
	</section>

	<section class="setup-section">
		<h2 class="section-label">{m['setup.playerNames']()}</h2>
		<ul class="player-list">
			{#each players.slice(0, playerCount) as player, i}
				<li class="player-row">
					<button
						class="color-dot"
						class:color-dot-white={player.color === 'white'}
						style="background-color: var(--color-player-{player.color})"
						aria-label={m['setup.changeColorForPlayer']({ playerNumber: i + 1 })}
						onclick={() => cycleColor(i)}
					></button>
					<input
						type="text"
						class="player-name"
						placeholder={m['setup.playerPlaceholder']({ playerNumber: i + 1 })}
						bind:value={players[i].name}
						maxlength={20}
					/>
				</li>
			{/each}
		</ul>
	</section>

	<div class="setup-actions">
		<button class="btn-start" onclick={handleStart}>
			{m['setup.startGame']()}
		</button>
	</div>
</main>

<style>
	.setup {
		max-width: 28rem;
		margin: 0 auto;
		padding: var(--space-lg) var(--space-md) var(--space-2xl);
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
		min-height: 100dvh;
	}

	/* Header */
	.setup-header {
		text-align: center;
		padding: var(--space-md) 0 var(--space-sm);
	}

	.setup-title {
		font-family: var(--font-family-display);
		font-size: var(--font-size-large);
		color: var(--color-accent);
		letter-spacing: -0.01em;
		line-height: 1.1;
	}

	.setup-subtitle {
		font-size: var(--font-size-small);
		color: var(--color-muted);
		margin-top: var(--space-xs);
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	/* Language switcher */
	.language-switcher {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
	}

	.language-switcher button {
		padding: 0.5rem 1rem;
		border-radius: var(--radius-md, 8px);
		border: 1px solid var(--color-border);
		background-color: var(--color-surface);
		color: var(--color-muted);
		cursor: pointer;
		font-weight: 500;
		font-size: var(--font-size-small);
		transition: all 0.2s;
	}

	.language-switcher button.active {
		background-color: var(--color-accent);
		color: #1A1A2E;
		border-color: var(--color-accent);
	}

	.language-switcher button:hover:not(.active) {
		background-color: var(--color-surface-raised);
		color: var(--color-text);
	}

	/* Sections */
	.setup-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.section-label {
		font-size: var(--font-size-xs);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-muted);
	}

	/* Button group */
	.btn-group {
		display: flex;
		gap: var(--space-sm);
	}

	.btn-group > * {
		flex: 1;
	}

	/* Selectable button (player count, duration presets) */
	.btn-select {
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		color: var(--color-muted);
		font-weight: 600;
		font-size: var(--font-size-body);
		flex-direction: column;
		gap: 0;
	}

	.btn-select:hover {
		background-color: var(--color-surface-raised);
		color: var(--color-text);
	}

	.btn-select.active {
		background-color: var(--color-accent);
		border-color: var(--color-accent);
		color: #1A1A2E;
	}

	/* Preset button inner labels */
	.preset-label {
		display: block;
		font-size: var(--font-size-small);
		font-weight: 600;
	}

	.preset-time {
		display: block;
		font-size: var(--font-size-xs);
		color: var(--color-muted);
		margin-top: 2px;
	}

	.btn-select.active .preset-time {
		color: rgba(26, 26, 46, 0.6);
	}

	/* Custom duration */
	.custom-duration {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding-top: var(--space-xs);
	}

	.custom-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		flex: 1;
	}

	.custom-label {
		font-size: var(--font-size-xs);
		color: var(--color-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.custom-duration input {
		text-align: center;
		font-variant-numeric: tabular-nums;
		font-size: var(--font-size-large);
		font-weight: 600;
		padding: var(--space-sm);
	}

	.custom-sep {
		font-size: var(--font-size-large);
		font-weight: 700;
		color: var(--color-muted);
		padding-top: 1.25rem;
	}

	/* Player list */
	.player-list {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.player-row {
		display: flex;
		align-items: center;
		gap: var(--space-md);
	}

	.color-dot {
		width: 24px;
		height: 24px;
		border-radius: var(--radius-full);
		flex-shrink: 0;
		border: 2px solid transparent;
		transition: transform 0.1s ease, border-color 0.15s ease;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
		min-height: 24px;
		min-width: 24px;
		padding: 0;
		position: relative;
	}

	.color-dot::after {
		content: '';
		position: absolute;
		inset: -12px;
	}

	.color-dot:active {
		transform: scale(0.85);
	}

	.color-dot:hover {
		border-color: var(--color-muted);
	}

	.color-dot-white {
		border-color: var(--color-muted);
	}

	.color-dot-white:hover {
		border-color: var(--color-muted);
	}

	.player-name {
		flex: 1;
	}

	/* Start button */
	.setup-actions {
		margin-top: auto;
		padding-top: var(--space-md);
	}

	.btn-start {
		background-color: var(--color-accent);
		color: #1A1A2E;
		font-size: var(--font-size-body);
		font-weight: 700;
		min-height: 48px;
		width: 100%;
		border-radius: var(--radius-lg);
		letter-spacing: 0.02em;
	}

	.btn-start:hover {
		background-color: var(--color-accent-hover);
	}

	/* Small screens */
	@media (max-width: 375px) {
		.setup {
			padding: var(--space-md) var(--space-sm) var(--space-xl);
		}

		.btn-group {
			flex-wrap: wrap;
		}

		.btn-select {
			flex: 1 1 calc(33% - var(--space-sm) / 2);
		}

		.custom-duration input {
			font-size: 1.25rem;
		}
	}
</style>
