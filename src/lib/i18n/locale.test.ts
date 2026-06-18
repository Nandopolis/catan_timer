import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock idb so IndexedDB operations don't fail in Node
vi.mock('idb', () => ({
	openDB: vi.fn(async () => ({
		clear: vi.fn(async () => {}),
		put: vi.fn(async () => {}),
		get: vi.fn(async () => undefined),
		add: vi.fn(async () => 1),
		getAll: vi.fn(async () => [])
	}))
}));

// Mock paraglide runtime
vi.mock('$lib/paraglide/runtime.js', () => ({
	getLocale: vi.fn(() => 'en'),
	setLocale: vi.fn(),
	baseLocale: 'en',
	locales: ['en', 'es']
}));

const storage: Record<string, string> = {};

// Set up localStorage mock before importing locale module
(globalThis as any).localStorage = {
	getItem: (key: string) => storage[key] ?? null,
	setItem: (key: string, value: string) => {
		storage[key] = value;
	},
	removeItem: (key: string) => {
		delete storage[key];
	}
};

import { clearAllData } from '$lib/db';
import { getLocale, setLocale, detectLocale, initLocale } from './locale.svelte.js';
import { setLocale as setParaglideLocale } from '$lib/paraglide/runtime.js';

describe('detectLocale', () => {
	beforeEach(() => {
		Object.keys(storage).forEach((k) => delete storage[k]);
		vi.stubGlobal('navigator', { language: 'en-US', languages: ['en-US'] });
	});

	it("returns 'es' when navigator.language is 'es-ES'", () => {
		vi.stubGlobal('navigator', { language: 'es-ES', languages: ['es-ES'] });
		expect(detectLocale()).toBe('es');
	});

	it("returns 'es' when navigator.language is 'es-MX'", () => {
		vi.stubGlobal('navigator', { language: 'es-MX', languages: ['es-MX'] });
		expect(detectLocale()).toBe('es');
	});

	it("returns 'en' when navigator.language is 'en-US'", () => {
		vi.stubGlobal('navigator', { language: 'en-US', languages: ['en-US'] });
		expect(detectLocale()).toBe('en');
	});

	it("falls back to 'en' for unsupported languages like 'fr-FR'", () => {
		vi.stubGlobal('navigator', { language: 'fr-FR', languages: ['fr-FR'] });
		expect(detectLocale()).toBe('en');
	});
});

describe('setLocale and getLocale', () => {
	beforeEach(() => {
		Object.keys(storage).forEach((k) => delete storage[k]);
		vi.stubGlobal('navigator', { language: 'en-US', languages: ['en-US'] });
		vi.clearAllMocks();
	});

	it("persists to localStorage", () => {
		setLocale('es');
		expect(storage['catan-timer-locale']).toBe('es');
	});

	it('getLocale returns the set locale', () => {
		setLocale('es');
		expect(getLocale()).toBe('es');
	});

	it('always uses { reload: false }', () => {
		setLocale('es');
		expect(setParaglideLocale).toHaveBeenCalledWith('es', { reload: false });
	});
});

describe('clearAllData isolation', () => {
	beforeEach(() => {
		Object.keys(storage).forEach((k) => delete storage[k]);
	});

	it("does NOT clear 'catan-timer-locale'", async () => {
		storage['catan-timer-locale'] = 'es';
		await clearAllData();
		expect(storage['catan-timer-locale']).toBe('es');
	});
});
