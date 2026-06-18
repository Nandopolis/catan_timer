import ConfirmModal from './ConfirmModal.svelte';

let modalRef: ConfirmModal | null = null;

export function registerModal(modal: ConfirmModal) {
	modalRef = modal;
}

export function confirmAction(title: string, message: string): Promise<boolean> {
	if (!modalRef) {
		throw new Error('ConfirmModal not registered. Ensure <ConfirmModal /> is mounted in +layout.svelte.');
	}
	return modalRef.confirm(title, message);
}
