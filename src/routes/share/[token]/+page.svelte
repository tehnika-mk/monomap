<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { dueStatus } from '$lib/utils/due';
	import SharedMap from '$lib/components/SharedMap.svelte';
	import type { KanbanBoard, MapData } from '$lib/types';

	let loading = $state(true);
	let notFound = $state(false);
	let kind = $state<'board' | 'map'>('board');
	let title = $state('');
	let board = $state<KanbanBoard | null>(null);
	let map = $state<MapData | null>(null);
	let updatedAt = $state<number | null>(null);

	onMount(() => {
		const parts = window.location.pathname.split('/').filter(Boolean);
		const token = parts[parts.length - 1];
		if (!token) {
			notFound = true;
			loading = false;
			return;
		}
		void (async () => {
			try {
				const { data, error } = await supabase.functions.invoke('share', {
					body: { action: 'resolve', token }
				});
				if (error || !data?.data) throw new Error(error?.message ?? 'Not found');
				kind = data.kind === 'map' ? 'map' : 'board';
				title = (data.title as string) ?? '';
				updatedAt = (data.updatedAt as number) ?? null;
				if (kind === 'map') map = data.data as MapData;
				else board = data.data as KanbanBoard;
			} catch (err) {
				console.warn('share resolve failed', err);
				notFound = true;
			} finally {
				loading = false;
			}
		})();
	});

	function formatUpdated(ts: number | null): string {
		if (!ts) return '';
		return new Date(ts).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function doneCount(card: { checklist?: { done: boolean }[] }): number | null {
		const list = card.checklist ?? [];
		return list.length > 0 ? list.filter((i) => i.done).length : null;
	}

	function dueClass(dueDate: number): string {
		const status = dueStatus(dueDate);
		if (status === 'overdue') return 'overdue';
		if (status === 'soon') return 'soon';
		return '';
	}

	function formatDue(dueDate: number): string {
		return new Date(dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
	}
</script>

<svelte:head>
	<title>{title ? `${title} · MonoMap` : 'MonoMap — Shared'}</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="page">
	<header class="header">
		<span class="brand">
			<svg width="18" height="18" viewBox="0 0 32 32" fill="none" aria-hidden="true">
				<circle cx="16" cy="16" r="8" fill="var(--accent)" />
				<circle cx="16" cy="16" r="4.5" fill="var(--canvas)" />
			</svg>
			MonoMap
		</span>
		{#if !loading && !notFound && title}
			<span class="shared-tag">Shared {kind} · read-only</span>
		{/if}
	</header>

	<main class="main">
		{#if loading}
			<p class="status">Loading board…</p>
		{:else if notFound || (!board && !map)}
			<p class="status">This share link is not valid anymore.</p>
			<a class="cta" href="/">Open MonoMap ↗</a>
		{:else}
			<h1 class="title">{title}</h1>
			{#if updatedAt}
				<p class="updated">Last updated {formatUpdated(updatedAt)}</p>
			{/if}
			{#if map}
				<SharedMap {map} />
			{:else if board}
				<div class="strip">
				{#each board.columns as column (column.id)}
					<section class="column">
						<header class="column-head">
							<span class="column-title">{column.title}</span>
							<span class="count">{column.cards.length}</span>
						</header>
						<div class="cards">
							{#each column.cards as card (card.id)}
								<article class="card">
									<h3 class="card-title">{card.title}</h3>
									{#if card.labels && card.labels.length > 0}
										<div class="labels">
											{#each card.labels as label}
												<span
													class="label"
													style={`background:${label.color}22;color:${label.color};border-color:${label.color}55`}
												>
													{label.text}
												</span>
											{/each}
										</div>
									{/if}
									{#if card.description}
										<p class="desc">{card.description}</p>
									{/if}
									<div class="meta">
										{#if card.dueDate}
											<span class={`due ${dueClass(card.dueDate)}`}>{formatDue(card.dueDate)}</span>
										{/if}
										{#if doneCount(card) !== null}
											<span class="checklist">
												✓ {(card.checklist ?? []).filter((i) => i.done).length}/{card.checklist!.length}
											</span>
										{/if}
									</div>
								</article>
							{:else}
								<p class="empty">No cards</p>
							{/each}
						</div>
					</section>
				{/each}
			</div>
			{/if}
			<footer class="footer">
				<a href="/" rel="noopener noreferrer">Made with MonoMap — free mind map &amp; kanban app ↗</a>
			</footer>
		{/if}
	</main>
</div>

<style>
	.page {
		min-height: 100dvh;
		background: var(--canvas);
		color: var(--fg);
		font-family: var(--font-body);
		display: flex;
		flex-direction: column;
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 14px clamp(16px, 4vw, 40px);
		border-bottom: 1px solid var(--edge);
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-family: 'IBM Plex Mono', ui-monospace, monospace;
		font-size: calc(13.5px + var(--font-bump));
		font-weight: 600;
		letter-spacing: 0.04em;
	}

	.shared-tag {
		font-family: 'IBM Plex Mono', ui-monospace, monospace;
		font-size: calc(11px + var(--font-bump));
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.main {
		flex: 1;
		width: 100%;
		max-width: 1360px;
		margin: 0 auto;
		padding: 40px clamp(20px, 4vw, 48px) 72px;
	}

	.status {
		text-align: center;
		color: var(--muted);
		margin-top: 80px;
		font-size: calc(15px + var(--font-bump));
	}

	.cta {
		display: block;
		width: fit-content;
		margin: 20px auto 0;
		color: var(--accent);
		font-size: calc(13.5px + var(--font-bump));
		text-decoration: none;
		font-weight: 500;
	}

	.title {
		font-family: 'IBM Plex Mono', ui-monospace, monospace;
		font-size: clamp(22px, 4vw, 32px);
		margin: 0;
	}

	.updated {
		color: var(--muted);
		font-size: calc(12.5px + var(--font-bump));
		margin: 6px 0 0;
	}

	.strip {
		display: flex;
		gap: 16px;
		align-items: flex-start;
		margin-top: 28px;
		overflow-x: auto;
		padding-bottom: 16px;
	}

	.column {
		flex: 1 1 260px;
		min-width: 250px;
		max-width: 320px;
		background: var(--surface);
		border: 1px solid var(--edge);
		border-radius: var(--r-md);
		padding: 10px;
	}

	.column-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 2px 4px 10px;
	}

	.column-title {
		font-size: calc(13px + var(--font-bump));
		font-weight: 600;
	}

	.count {
		font-size: calc(11px + var(--font-bump));
		color: var(--muted);
		background: var(--surface-2);
		border-radius: var(--r-xs);
		padding: 1px 7px;
	}

	.cards {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.card {
		background: var(--surface-2);
		border: 1px solid var(--edge);
		border-radius: var(--r-md);
		padding: 10px 12px;
	}

	.card-title {
		font-size: calc(13px + var(--font-bump));
		font-weight: 500;
		margin: 0;
		line-height: 1.4;
	}

	.labels {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
		margin-top: 8px;
	}

	.label {
		font-size: calc(10.5px + var(--font-bump));
		font-weight: 500;
		border: 1px solid transparent;
		border-radius: var(--r-xs);
		padding: 1px 8px;
	}

	.desc {
		font-size: calc(12px + var(--font-bump));
		color: var(--muted);
		line-height: 1.5;
		margin: 8px 0 0;
		white-space: pre-wrap;
	}

	.meta {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 8px;
	}

	.due {
		font-size: calc(11px + var(--font-bump));
		color: var(--muted);
		background: var(--surface);
		border: 1px solid var(--edge);
		border-radius: var(--r-sm);
		padding: 1px 7px;
	}

	.due.overdue {
		color: #dc2626;
		border-color: color-mix(in srgb, #ef4444 45%, var(--edge));
		background: color-mix(in srgb, #ef4444 8%, var(--surface));
	}

	.due.soon {
		color: #b45309;
		border-color: color-mix(in srgb, #eab308 50%, var(--edge));
		background: color-mix(in srgb, #eab308 10%, var(--surface));
	}

	.checklist {
		font-size: calc(11px + var(--font-bump));
		color: var(--muted);
	}

	.empty {
		font-size: calc(12px + var(--font-bump));
		color: var(--muted);
		text-align: center;
		padding: 8px 0;
	}

	.footer {
		text-align: center;
		padding: 26px;
		border-top: 1px solid var(--edge);
	}

	.footer a {
		font-size: calc(12.5px + var(--font-bump));
		color: var(--muted);
		text-decoration: none;
	}

	.footer a:hover {
		color: var(--fg);
	}
</style>
