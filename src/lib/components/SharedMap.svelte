<script lang="ts">
	import { onMount, tick } from 'svelte';
	import type { MapData, MindNode } from '$lib/types';
	import { calculateBezierPath, type Rect } from '$lib/utils/bezier';
	import { forEachNode, getEdges } from '$lib/utils/tree';

	let { map }: { map: MapData } = $props();

	let containerEl = $state<HTMLDivElement | null>(null);
	let sizes = $state<Record<string, { w: number; h: number }>>({});
	let ready = $state(false);

	const nodes = $derived.by(() => {
		const list: MindNode[] = [];
		forEachNode(map.rootNode, (node) => list.push(node));
		return list;
	});

	const edges = $derived(getEdges(map.rootNode));

	const bounds = $derived.by(() => {
		if (!ready) return null;
		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;
		for (const node of nodes) {
			const size = sizes[node.id];
			if (!size) continue;
			minX = Math.min(minX, node.position.x - size.w / 2);
			minY = Math.min(minY, node.position.y - size.h / 2);
			maxX = Math.max(maxX, node.position.x + size.w / 2);
			maxY = Math.max(maxY, node.position.y + size.h / 2);
		}
		if (!Number.isFinite(minX)) return null;
		const pad = 80;
		return { x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 };
	});

	function rectFor(node: MindNode): Rect {
		const size = sizes[node.id] ?? { w: 0, h: 0 };
		return { cx: node.position.x, cy: node.position.y, w: size.w, h: size.h };
	}

	const paths = $derived(
		edges.map(({ parent, child }) => ({
			id: child.id,
			d: calculateBezierPath(rectFor(parent), rectFor(child)),
			color: child.style?.color
		}))
	);

	// Fit the whole map into the viewport once node sizes are measured.
	const transform = $derived.by(() => {
		const b = bounds;
		const el = containerEl;
		if (!b || !el) return '';
		const cw = el.clientWidth || 1;
		const ch = el.clientHeight || 1;
		const scale = Math.min(cw / b.w, ch / b.h, 1.4);
		const tx = cw / 2 - scale * (b.x + b.w / 2);
		const ty = ch / 2 - scale * (b.y + b.h / 2);
		return `translate(${tx}px, ${ty}px) scale(${scale})`;
	});

	async function measure() {
		await tick();
		const el = containerEl;
		if (!el) return;
		const next: Record<string, { w: number; h: number }> = {};
		el.querySelectorAll<HTMLElement>('[data-mnode]').forEach((n) => {
			next[n.dataset.mnode!] = { w: n.offsetWidth, h: n.offsetHeight };
		});
		sizes = next;
		ready = true;
	}

	onMount(() => {
		const run = () => void measure();
		requestAnimationFrame(run);
		if (document.fonts?.ready) {
			void document.fonts.ready.then(() => requestAnimationFrame(run));
		}
	});
</script>

<div class="shared-map" bind:this={containerEl} role="img" aria-label={`Mind map: ${map.title}`}>
	<div class="world" class:ready style:transform={transform}>
		{#if bounds}
			<svg
				class="edges"
				style:left="{bounds.x}px"
				style:top="{bounds.y}px"
				style:width="{bounds.w}px"
				style:height="{bounds.h}px"
				viewBox="{bounds.x} {bounds.y} {bounds.w} {bounds.h}"
				aria-hidden="true"
			>
				{#each paths as p (p.id)}
					<path
						d={p.d}
						stroke={p.color ? `color-mix(in srgb, ${p.color} 75%, var(--edge))` : 'var(--edge)'}
						stroke-width="2"
						stroke-linecap="round"
						fill="none"
					/>
				{/each}
			</svg>
		{/if}
		{#each nodes as node (node.id)}
			<div
				class="mnode"
				class:has-color={!!node.style?.color}
				data-mnode={node.id}
				style:left="{node.position.x}px"
				style:top="{node.position.y}px"
				style:--node-color={node.style?.color}
			>
				{#if node.style?.icon}<span class="mnode-icon">{node.style.icon}</span>{/if}
				<span class="mnode-text">{node.text || 'Empty'}</span>
				{#if node.notes}<span class="mnode-note" title="Has notes">📝</span>{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.shared-map {
		position: relative;
		width: 100%;
		height: 60vh;
		min-height: 360px;
		overflow: hidden;
		border: 1px solid var(--edge);
		border-radius: var(--r-lg);
		background: var(--canvas);
		background-image: radial-gradient(
			color-mix(in srgb, var(--fg) 6%, transparent) 1px,
			transparent 1px
		);
		background-size: 26px 26px;
	}

	.world {
		position: absolute;
		top: 0;
		left: 0;
		transform-origin: 0 0;
		opacity: 0;
	}

	.world.ready {
		opacity: 1;
	}

	.edges {
		position: absolute;
		overflow: visible;
	}

	.mnode {
		position: absolute;
		transform: translate(-50%, -50%);
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		border-radius: var(--r-md);
		background: var(--node-bg, var(--surface));
		border: 1.5px solid var(--node-edge, var(--edge));
		box-shadow: var(--node-shadow);
		color: var(--fg);
		max-width: 360px;
	}

	.mnode.has-color {
		border-color: color-mix(in srgb, var(--node-color) 55%, var(--node-edge, var(--edge)));
		background: color-mix(in srgb, var(--node-color) 7%, var(--node-bg, var(--surface)));
	}

	.mnode-icon {
		font-size: calc(13px + var(--font-bump));
		line-height: 1;
	}

	.mnode-text {
		font-size: calc(13px + var(--font-bump));
		font-weight: 500;
		line-height: 1.4;
		white-space: pre;
	}

	.mnode-note {
		font-size: calc(10px + var(--font-bump));
		line-height: 1;
		opacity: 0.7;
	}
</style>
