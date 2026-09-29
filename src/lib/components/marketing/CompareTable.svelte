<script lang="ts">
	export interface CompareCell {
		text: string;
		mark?: 'yes' | 'no' | 'partial';
	}

	export interface CompareRow {
		label: string;
		monomap: CompareCell | string;
		competitor: CompareCell | string;
	}

	let {
		caption,
		competitor,
		rows
	}: { caption: string; competitor: string; rows: CompareRow[] } = $props();

	function normalize(value: CompareCell | string): CompareCell {
		return typeof value === 'string' ? { text: value } : value;
	}

	function glyph(mark: CompareCell['mark']): string {
		if (mark === 'yes') return '✓';
		if (mark === 'no') return '–';
		return '~';
	}
</script>

{#snippet cell(value: CompareCell | string)}
	{@const c = normalize(value)}
	{#if c.mark}
		<span class="mark {c.mark}" aria-hidden="true">{glyph(c.mark)}</span>
	{/if}
	<span class="cell-text">{c.text}</span>
{/snippet}

<div class="compare-wrap">
	<table>
		<caption class="sr-only">{caption}</caption>
		<thead>
			<tr>
				<th scope="col">Feature</th>
				<th scope="col" class="monomap-col">MonoMap</th>
				<th scope="col">{competitor}</th>
			</tr>
		</thead>
		<tbody>
			{#each rows as row (row.label)}
				<tr>
					<th scope="row">{row.label}</th>
					<td class="monomap-col">{@render cell(row.monomap)}</td>
					<td>{@render cell(row.competitor)}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.compare-wrap {
		overflow-x: auto;
		max-width: 860px;
		margin: 32px auto 0;
		border: 1px solid var(--edge);
		border-radius: var(--r-lg);
		background: var(--surface);
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: calc(14px + var(--font-bump));
	}
	th,
	td {
		padding: 13px 18px;
		border-bottom: 1px solid var(--edge);
		text-align: left;
		vertical-align: top;
	}
	thead th {
		color: var(--muted);
		font-family: var(--font-mono);
		font-size: calc(12px + var(--font-bump));
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	tbody th {
		color: var(--fg);
		font-weight: 500;
	}
	.monomap-col {
		background: color-mix(in srgb, var(--accent) 7%, transparent);
	}
	thead .monomap-col {
		color: var(--accent);
	}
	tr:last-child th,
	tr:last-child td {
		border-bottom: 0;
	}
	.mark {
		display: inline-block;
		width: 1.1em;
		font-weight: 700;
	}
	.mark.yes {
		color: var(--accent);
	}
	.mark.no {
		color: var(--muted);
	}
	.mark.partial {
		color: var(--warn);
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
