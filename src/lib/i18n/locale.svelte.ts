import {
	getLocale as getParaglideLocale,
	setLocale as setParaglideLocale,
	baseLocale,
	locales
} from '$lib/paraglide/runtime.js';

const LOCALE_STORAGE_KEY = 'catan-timer-locale';
const supportedLocales = ['en', 'es'] as const;
type SupportedLocale = (typeof supportedLocales)[number];

let currentLocale = $state<SupportedLocale>(
	typeof window !== 'undefined' ? detectLocale() : 'en'
);

export function getLocale(): SupportedLocale {
	return currentLocale;
}

export function setLocale(locale: SupportedLocale): void {
	currentLocale = locale;
	try {
		localStorage.setItem(LOCALE_STORAGE_KEY, locale);
	} catch {
		// localStorage may be unavailable (private mode, quota)
	}
	setParaglideLocale(locale, { reload: false });
}

export function detectLocale(): SupportedLocale {
	// 1. Check localStorage
	try {
		const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
		if (stored && isSupportedLocale(stored)) return stored;
	} catch {
		// localStorage may be unavailable
	}

	// 2. Check navigator.language / navigator.languages
	if (typeof navigator !== 'undefined') {
		const browserLocales = [navigator.language, ...(navigator.languages || [])];
		for (const lang of browserLocales) {
			if (!lang) continue;
			const base = lang.split('-')[0];
			if (isSupportedLocale(base)) return base;
		}
	}

	// 3. Fallback to English
	return 'en';
}

function isSupportedLocale(value: string): value is SupportedLocale {
	return supportedLocales.includes(value as SupportedLocale);
}

export function initLocale(): void {
	if (typeof window === 'undefined') return;
	const detected = detectLocale();
	currentLocale = detected;
	setParaglideLocale(detected, { reload: false });
}
