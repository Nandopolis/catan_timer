export async function requestNotificationPermission(): Promise<void> {
	try {
		if ('Notification' in window && Notification.permission === 'default') {
			await Notification.requestPermission();
		}
	} catch {
		// Best-effort: silently ignore
	}
}

import * as m from '$lib/paraglide/messages.js';

export function notifyTimerExpired(playerName: string): void {
	try {
		if ('Notification' in window && Notification.permission === 'granted') {
			new Notification(m['notifications.turnExpired']({ playerName }), {
				icon: '/favicon.svg'
			});
		}
	} catch {
		// Best-effort: silently ignore
	}
}
