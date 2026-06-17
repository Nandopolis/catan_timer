export async function requestNotificationPermission(): Promise<void> {
	try {
		if ('Notification' in window && Notification.permission === 'default') {
			await Notification.requestPermission();
		}
	} catch {
		// Best-effort: silently ignore
	}
}

export function notifyTimerExpired(playerName: string): void {
	try {
		if ('Notification' in window && Notification.permission === 'granted') {
			new Notification(`⏰ ${playerName}'s turn time has expired!`, {
				icon: '/favicon.svg'
			});
		}
	} catch {
		// Best-effort: silently ignore
	}
}
