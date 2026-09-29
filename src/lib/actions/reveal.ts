// Scroll-reveal action: fades/slides an element in once it enters the viewport.
// Respects prefers-reduced-motion and falls back to visible when unsupported.
export function reveal(node: HTMLElement, options?: { delay?: number }) {
	node.classList.add('reveal');
	if (options?.delay) node.style.setProperty('--d', `${options.delay}ms`);

	const show = () => node.classList.add('in');

	if (
		typeof IntersectionObserver === 'undefined' ||
		(typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)
	) {
		show();
		return;
	}

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					show();
					observer.disconnect();
				}
			}
		},
		{ threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
	);
	observer.observe(node);

	return {
		destroy() {
			observer.disconnect();
		}
	};
}
