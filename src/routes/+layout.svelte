<script lang="ts">
	import '../app.css';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import { registerModal } from '$lib/components/modal';
	import { initLocale, getLocale } from '$lib/i18n';

	let { children } = $props();
	let modalRef: ConfirmModal;

	initLocale();

	$effect(() => {
		if (modalRef) {
			registerModal(modalRef);
		}
	});

	$effect(() => {
		document.documentElement.lang = getLocale();
	});
</script>

<svelte:head>
	<link rel="manifest" href="/manifest.webmanifest" />
</svelte:head>

{@render children()}

<ConfirmModal bind:this={modalRef} />
