// Closes a popover when a pointer press lands outside `node`. The opening
// click has already happened before the node mounts, so it does not self-close.
export function clickOutside(node: HTMLElement, callback: () => void) {
	let handler = callback;
	const onPointerDown = (event: PointerEvent) => {
		const target = event.target as Node | null;
		if (target && !node.contains(target)) handler();
	};
	document.addEventListener('pointerdown', onPointerDown, true);
	return {
		update(next: () => void) {
			handler = next;
		},
		destroy() {
			document.removeEventListener('pointerdown', onPointerDown, true);
		}
	};
}
