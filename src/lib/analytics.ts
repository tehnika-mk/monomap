import { env } from '$env/dynamic/public';

// Analytics is opt-in per build. Self-hosted and static builds leave
// PUBLIC_GA_ID empty (see Dockerfile / .env), so nothing is requested from
// Google — important for a local-first app that markets itself as private.

declare global {
	interface Window {
		dataLayer?: unknown[];
		gtag?: (...args: unknown[]) => void;
	}
}

let started = false;

export function initAnalytics(): void {
	const id = env.PUBLIC_GA_ID?.trim();
	if (started || !id) return;
	started = true;

	const script = document.createElement('script');
	script.async = true;
	script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
	script.dataset.monomapAnalytics = 'ga';
	document.head.appendChild(script);

	window.dataLayer = window.dataLayer ?? [];
	window.gtag = (...args: unknown[]) => {
		window.dataLayer?.push(args);
	};
	window.gtag('js', new Date());
	window.gtag('config', id);
}
