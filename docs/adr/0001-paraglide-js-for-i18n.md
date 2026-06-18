# Paraglide JS for i18n

We chose Paraglide JS v2 as our i18n library for Catan Timer. Paraglide compiles translations to type-safe JavaScript at build time, tree-shaking unused messages and producing near-zero runtime overhead. This aligns with our static PWA build (adapter-static) where bundle size matters for mobile users.

We evaluated three alternatives:
- **svelte-i18n**: Mature but runtime-based (~3KB), no type safety on keys
- **typesafe-i18n**: Lightweight and type-safe but less ecosystem support
- **Paraglide JS**: Compile-time, type-safe, SvelteKit-native, tree-shaken

Paraglide won because it generates actual JavaScript functions from message files, enabling IDE autocomplete and compile-time validation. The trade-off is that adding new locales requires a rebuild — acceptable for a static PWA.

We use client-side locale detection (`navigator.language` → localStorage) with `{ reload: false }` to avoid disrupting the running timer. No server-side locale negotiation or URL-based routing.
