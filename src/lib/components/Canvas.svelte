<script lang="ts">
	import { onMount } from 'svelte';
	import Node from './Node.svelte';
	import ConnectionLayer from './ConnectionLayer.svelte';
	import { canvas, clampZoom } from '$lib/stores/canvas.svelte';
	import { settings } from '$lib/stores/settings.svelte';
	import { workspace } from '$lib/stores/workspace.svelte';
	import { findNode, forEachNode } from '$lib/utils/tree';
	import { GRID_SPACING } from '$lib/utils/grid';

	const GRID_DOT = 'color-mix(in srgb, var(--fg) 7%, transparent)';
	const MARQUEE_THRESHOLD = 4;

	let container = $state<HTMLDivElement | null>(null);
	let panning = $state(false);
	let lastX = 0;
	let lastY = 0;

	let marqueeStart = $state<{ x: number; y: number } | null>(null);
	let marqueeCurrent = $state<{ x: number; y: number } | null>(null);
	let marqueeSelecting = $state(false);
	let marqueeActive = $state(false);

	const touchPoints = new Map<number, { x: number; y: number }>();
	let pinchStart: {
		dist: number;
		zoom: number;
		x: number;
		y: number;
		mid: { x: number; y: number };
	} | null = null;

	const root = $derived(workspace.getActiveMap()?.rootNode ?? null);

	const gridStyle = $derived.by(() => {
		if (!settings.gridEnabled) return '';
		const size = GRID_SPACING * canvas.zoom;
		if (size <= 0) return '';
		const px = ((canvas.x % size) + size) % size;
		const py = ((canvas.y % size) + size) % size;
		return `background-image: radial-gradient(circle, ${GRID_DOT} 1.2px, transparent 1.3px); background-size: ${size}px ${size}px; background-position: ${px}px ${py}px;`;
	});

	const marqueeStyle = $derived.by(() => {
		if (!marqueeActive || !marqueeStart || !marqueeCurrent) return '';
		const x = Math.min(marqueeStart.x, marqueeCurrent.x);
		const y = Math.min(marqueeStart.y, marqueeCurrent.y);
		const w = Math.abs(marqueeCurrent.x - marqueeStart.x);
		const h = Math.abs(marqueeCurrent.y - marqueeStart.y);
		return `left:${x}px; top:${y}px; width:${w}px; height:${h}px;`;
	});

	// Keep a node selected for keyboard-first use, but only when the map changed
	// or the current selection no longer exists. A deliberate deselect (Escape,
	// tapping the background) must stay cleared.
	let lastMapId: string | null = null;
	$effect(() => {
		const map = workspace.getActiveMap();
		if (!map) return;
		const selected = canvas.selectedNodeId;
		if (map.id !== lastMapId) {
			lastMapId = map.id;
			canvas.selectNode(map.rootNode.id);
			// Selecting a map always recenters on its root. An explicit node jump
			// (pendingCenterId) takes precedence.
			if (!canvas.pendingCenterId) {
				if (canvas.viewport.width > 0 && canvas.viewport.height > 0) canvas.centerOnNode(map.rootNode);
				else canvas.pendingCenterId = map.rootNode.id;
			}
		} else if (selected && !findNode(map.rootNode, selected)) {
			// Prune multi-selection entries that no longer exist, keeping the
			// primary anchor if it's still present.
			const ids = canvas.selectedNodeIds.filter((id) => findNode(map.rootNode, id));
			if (ids.length === 0) canvas.clearSelection();
			else canvas.selectNodes(ids, canvas.selectedNodeId);
		}
	});

	// Center on a node requested while the canvas was hidden (e.g. jumping from a
	// kanban card link) once the viewport has a real size.
	$effect(() => {
		const id = canvas.pendingCenterId;
		if (!id) return;
		const map = workspace.getActiveMap();
		const node = map && findNode(map.rootNode, id);
		if (!node) return;
		if (canvas.viewport.width === 0 || canvas.viewport.height === 0) return;
		canvas.centerOnNode(node);
		canvas.selectNode(id);
		canvas.pendingCenterId = null;
	});

	onMount(() => {
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(container!);
		requestAnimationFrame(() => {
			const map = workspace.getActiveMap();
			if (map) canvas.centerOnNode(map.rootNode);
			else canvas.resetView();
		});
		return () => ro.disconnect();
	});

	function measure() {
		if (container) canvas.viewport = { width: container.clientWidth, height: container.clientHeight };
	}

	function startPan(e: PointerEvent) {
		panning = true;
		lastX = e.clientX;
		lastY = e.clientY;
		container?.setPointerCapture(e.pointerId);
	}

	function beginPinch() {
		const points = [...touchPoints.values()];
		if (points.length < 2) return;
		pinchStart = {
			dist: distance(points[0], points[1]),
			zoom: canvas.zoom,
			x: canvas.x,
			y: canvas.y,
			mid: midpoint(points[0], points[1])
		};
	}

	function updatePinch() {
		const points = [...touchPoints.values()];
		if (!pinchStart || points.length < 2) return;
		const dist = distance(points[0], points[1]);
		const mid = midpoint(points[0], points[1]);
		if (pinchStart.dist <= 0) return;
		const targetZoom = clampZoom(pinchStart.zoom * (dist / pinchStart.dist));
		// Keep the world point under the gesture's start midpoint pinned to the new midpoint.
		const wx = (pinchStart.mid.x - pinchStart.x) / pinchStart.zoom;
		const wy = (pinchStart.mid.y - pinchStart.y) / pinchStart.zoom;
		canvas.x = mid.x - wx * targetZoom;
		canvas.y = mid.y - wy * targetZoom;
		canvas.zoom = targetZoom;
	}

	function onPointerDown(e: PointerEvent) {
		if (e.pointerType === 'touch') {
			e.preventDefault();
			touchPoints.set(e.pointerId, { x: e.clientX, y: e.clientY });
			if (touchPoints.size === 2) {
				panning = false;
				beginPinch();
				return;
			}
			if (touchPoints.size === 1) {
				canvas.clearSelection();
				panning = true;
				lastX = e.clientX;
				lastY = e.clientY;
				container?.setPointerCapture(e.pointerId);
			}
			return;
		}
		if (e.button === 1) {
			e.preventDefault();
			startPan(e);
			return;
		}
		if (e.button === 0 && canvas.spaceDown) {
			startPan(e);
			return;
		}
		if (e.button === 0) {
			canvas.clearSelection();
			const rect = container?.getBoundingClientRect();
			const ox = rect?.left ?? 0;
			const oy = rect?.top ?? 0;
			marqueeSelecting = true;
			marqueeActive = false;
			marqueeStart = { x: e.clientX - ox, y: e.clientY - oy };
			marqueeCurrent = { x: e.clientX - ox, y: e.clientY - oy };
			container?.setPointerCapture(e.pointerId);
		}
	}

	function onPointerMove(e: PointerEvent) {
		if (e.pointerType === 'touch') {
			const point = touchPoints.get(e.pointerId);
			if (!point) return;
			point.x = e.clientX;
			point.y = e.clientY;
			if (touchPoints.size >= 2 && pinchStart) {
				updatePinch();
				return;
			}
			if (panning) {
				canvas.panBy(e.clientX - lastX, e.clientY - lastY);
				lastX = e.clientX;
				lastY = e.clientY;
			}
			return;
		}
		if (marqueeSelecting && marqueeStart) {
			const rect = container?.getBoundingClientRect();
			const ox = rect?.left ?? 0;
			const oy = rect?.top ?? 0;
			marqueeCurrent = { x: e.clientX - ox, y: e.clientY - oy };
			const dx = marqueeCurrent.x - marqueeStart.x;
			const dy = marqueeCurrent.y - marqueeStart.y;
			if (!marqueeActive && Math.hypot(dx, dy) < MARQUEE_THRESHOLD) return;
			marqueeActive = true;
			selectNodesInMarquee();
			return;
		}
		if (!panning) return;
		canvas.panBy(e.clientX - lastX, e.clientY - lastY);
		lastX = e.clientX;
		lastY = e.clientY;
	}

	function onPointerUp(e: PointerEvent) {
		if (e.pointerType === 'touch') {
			touchPoints.delete(e.pointerId);
			if (pinchStart && touchPoints.size < 2) pinchStart = null;
			if (touchPoints.size === 1) {
				// Keep panning with the remaining finger.
				const [point] = [...touchPoints.values()];
				panning = true;
				lastX = point.x;
				lastY = point.y;
			} else if (touchPoints.size === 0) {
				panning = false;
				if (container?.hasPointerCapture(e.pointerId)) container.releasePointerCapture(e.pointerId);
			}
			return;
		}
		if (marqueeSelecting) {
			marqueeSelecting = false;
			marqueeActive = false;
			marqueeStart = null;
			marqueeCurrent = null;
			if (container?.hasPointerCapture(e.pointerId)) container.releasePointerCapture(e.pointerId);
			return;
		}
		if (!panning) return;
		panning = false;
		if (container?.hasPointerCapture(e.pointerId)) container.releasePointerCapture(e.pointerId);
	}

	function selectNodesInMarquee() {
		const root = workspace.getActiveMap()?.rootNode;
		const start = marqueeStart;
		const current = marqueeCurrent;
		if (!root || !start || !current) return;
		const tl = canvas.screenToWorld(Math.min(start.x, current.x), Math.min(start.y, current.y));
		const br = canvas.screenToWorld(Math.max(start.x, current.x), Math.max(start.y, current.y));
		const sel: string[] = [];
		forEachNode(root, (node) => {
			const size = canvas.nodeSizes[node.id] ?? { w: 0, h: 0 };
			const hw = size.w / 2;
			const hh = size.h / 2;
			const nx0 = node.position.x - hw;
			const ny0 = node.position.y - hh;
			const nx1 = node.position.x + hw;
			const ny1 = node.position.y + hh;
			if (nx1 >= tl.x && nx0 <= br.x && ny1 >= tl.y && ny0 <= br.y) sel.push(node.id);
		});
		canvas.selectNodes(sel);
	}

	function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
		return Math.hypot(a.x - b.x, a.y - b.y);
	}

	function midpoint(a: { x: number; y: number }, b: { x: number; y: number }) {
		return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
	}

	function onWheel(e: WheelEvent) {
		e.preventDefault();
		if (e.ctrlKey || e.metaKey) {
			const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
			canvas.zoomAt(e.clientX, e.clientY, factor);
		} else {
			canvas.panBy(-e.deltaX, -e.deltaY);
		}
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	bind:this={container}
	class="canvas-root relative h-full w-full overflow-hidden touch-none"
	class:cursor-grab={canvas.spaceDown}
	class:cursor-grabbing={panning}
	style={gridStyle}
	role="application"
	aria-label="Mind map canvas"
	onpointerdown={onPointerDown}
	onpointermove={onPointerMove}
	onpointerup={onPointerUp}
	onpointercancel={onPointerUp}
	onwheel={onWheel}
	onmousedown={(e) => {
		if (e.button === 1) e.preventDefault();
	}}
	oncontextmenu={(e) => e.preventDefault()}
>
	{#if root}
		<div
			data-world
			class="absolute left-0 top-0 origin-top-left"
			style="transform: translate({canvas.x}px, {canvas.y}px) scale({canvas.zoom})"
		>
			<ConnectionLayer {root} />
			<Node node={root} depth={0} />
		</div>
	{/if}

	{#if marqueeActive}
		<div class="marquee" style={marqueeStyle}></div>
	{/if}
</div>

<style>
	.marquee {
		position: absolute;
		z-index: 50;
		pointer-events: none;
		border: 1.5px solid var(--accent);
		border-radius: 4px;
		background: color-mix(in srgb, var(--accent) 12%, transparent);
	}
</style>
