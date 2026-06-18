<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';

	let visible = $state(false);
	let titleText = $state('');
	let messageText = $state('');
	let resolvePromise: ((value: boolean) => void) | null = null;

	export function confirm(title: string, message: string): Promise<boolean> {
		titleText = title;
		messageText = message;
		visible = true;
		return new Promise((resolve) => {
			resolvePromise = resolve;
		});
	}

	function handleConfirm() {
		visible = false;
		resolvePromise?.(true);
		resolvePromise = null;
	}

	function handleCancel() {
		visible = false;
		resolvePromise?.(false);
		resolvePromise = null;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!visible) return;
		if (e.key === 'Escape') {
			e.preventDefault();
			handleCancel();
		}
		if (e.key === 'Enter') {
			e.preventDefault();
			handleConfirm();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if visible}
	<div class="modal-backdrop" onclick={handleCancel} role="presentation"></div>
	<div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="confirm-title" tabindex="-1">
		<h3 id="confirm-title">{titleText}</h3>
		<p>{messageText}</p>
		<div class="modal-actions">
			<button type="button" class="btn-cancel" onclick={handleCancel}>{m['common.cancel']()}</button>
			<button type="button" class="btn-confirm" onclick={handleConfirm}>{m['common.confirm']()}</button>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		z-index: 100;
	}

	.modal-content {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: var(--color-surface);
		border-radius: var(--radius-lg);
		padding: var(--space-lg);
		max-width: 400px;
		width: 90%;
		box-shadow: var(--shadow-md);
		z-index: 101;
	}

	.modal-content h3 {
		font-size: var(--font-size-large);
		font-weight: 700;
		color: var(--color-text);
		margin-bottom: var(--space-sm);
	}

	.modal-content p {
		font-size: var(--font-size-body);
		color: var(--color-muted);
		line-height: 1.5;
	}

	.modal-actions {
		display: flex;
		gap: var(--space-sm);
		margin-top: var(--space-lg);
	}

	.modal-actions button {
		flex: 1;
		min-height: 48px;
		font-weight: 600;
		border-radius: var(--radius-md);
		border: none;
		cursor: pointer;
		transition: transform 0.1s ease, opacity 0.15s ease, background-color 0.15s ease;
	}

	.modal-actions button:active {
		transform: scale(0.97);
	}

	.btn-cancel {
		background: var(--color-surface-raised);
		color: var(--color-text);
	}

	.btn-cancel:hover {
		background: var(--color-surface-hover);
	}

	.btn-confirm {
		background: var(--color-primary);
		color: #ffffff;
	}

	.btn-confirm:hover {
		opacity: 0.9;
	}
</style>
