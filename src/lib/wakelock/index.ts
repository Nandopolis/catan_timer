let wakeLock: WakeLockSentinel | null = null;

export async function requestWakeLock(): Promise<void> {
	try {
		if ('wakeLock' in navigator) {
			wakeLock = await navigator.wakeLock.request('screen');
		}
	} catch {
		// Best-effort: silently ignore if unavailable or denied
	}
}

export async function releaseWakeLock(): Promise<void> {
	try {
		if (wakeLock) {
			await wakeLock.release();
			wakeLock = null;
		}
	} catch {
		// Silently ignore
	}
}

export function handleVisibilityChange(): void {
	if (document.visibilityState === 'visible') {
		requestWakeLock();
	}
}

// Register listener
if (typeof document !== 'undefined') {
	document.addEventListener('visibilitychange', handleVisibilityChange);
}
