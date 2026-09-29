import { rmSync } from 'node:fs';

// Building on top of a previous build can leave stale, hashed client chunks
// behind. A stale chunk keeps the old `__sveltekit_<token>` app token while the
// freshly generated HTML gets a new one, which crashes hydration and leaves the
// workspace blank. Start every production build from a clean slate.
for (const dir of ['build', '.svelte-kit']) {
	rmSync(dir, { recursive: true, force: true });
}

console.log('Cleaned build/ and .svelte-kit/');
