<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { openStrongboxes, STRONGBOX_CONSTANTS, type StrongboxResult } from '$lib/utils/artifactStrongboxEngine';
	import { getStatLabel, formatValue, type ArtifactSlot } from '$lib/utils/artifactRng';

	let count: number = $state(10);
	let slot: ArtifactSlot | 'any' = $state('any');
	let result: StrongboxResult | null = $state(null);

	function doSim() {
		result = openStrongboxes(count, slot === 'any' ? undefined : slot);
	}

	$effect(() => {
		void count;
		void slot;
		doSim();
	});

	const SLOTS: { id: ArtifactSlot | 'any'; label: string }[] = [
		{ id: 'any',     label: 'Any Slot' },
		{ id: 'flower',  label: 'Flower' },
		{ id: 'plume',   label: 'Plume' },
		{ id: 'sands',   label: 'Sands' },
		{ id: 'goblet',  label: 'Goblet' },
		{ id: 'circlet', label: 'Circlet' }
	];

	function statColor(key: string): string {
		if (key === 'critRate' || key === 'critDmg') return 'text-[#E6C77A]';
		if (key === 'atkPct' || key === 'atk') return 'text-[#E8745A]';
		if (key === 'hpPct' || key === 'hp') return 'text-[#4A8FE0]';
		if (key === 'defPct' || key === 'def') return 'text-[#E0B25A]';
		if (key === 'elementalMastery') return 'text-[#6FAF6E]';
		if (key === 'energyRecharge') return 'text-[#5FC9B8]';
		return 'text-[#B8C1D3]';
	}
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-5">

	<!-- ═══ Controls ═══ -->
	<section class="bg-[#1A2337]/80 backdrop-blur-sm rounded-xl border border-[#C9A45A]/25 shadow-xl p-5 space-y-4">
		<h2 class="font-heading text-sm font-semibold text-[#F2E6D0] uppercase tracking-wider">Mystic Offering</h2>
		<p class="text-xs text-[#8E97AA] leading-relaxed">
			Trade <span class="text-[#E6C77A] font-mono">3× 5★ artifact</span> → 1 random 5★ from chosen set. AR45+.
		</p>

		<!-- Slot -->
		<div class="space-y-2">
			<!-- svelte-ignore a11y_label_has_associated_control -->
			<label class="text-xs font-bold text-[#E6C77A] uppercase tracking-wider">Slot (Optional)</label>
			<div class="grid grid-cols-3 gap-1">
				{#each SLOTS as s}
					<button
						onclick={() => slot = s.id}
						class="px-2 py-2 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all {slot === s.id ? 'bg-[#C9A45A]/20 text-[#E6C77A] border border-[#C9A45A]/40' : 'bg-[#0B1020]/60 text-[#8E97AA] border border-transparent hover:text-[#B8C1D3]'}"
					>
						{s.label}
					</button>
				{/each}
			</div>
		</div>

		<!-- Count -->
		<div class="space-y-2">
			<div class="flex justify-between items-center">
				<label for="count" class="text-xs font-bold text-[#E6C77A] uppercase tracking-wider">Strongboxes</label>
				<span class="text-xs font-mono text-[#F2E6D0] tabular-nums">{count}× (cost: {count * 3} artifacts)</span>
			</div>
			<input
				id="count"
				type="range"
				min="1"
				max="30"
				bind:value={count}
				class="w-full accent-[#C9A45A]"
			/>
		</div>

		<button
			onclick={doSim}
			class="w-full px-4 py-3 rounded-md border border-[#C9A45A]/50 bg-gradient-to-r from-[#C9A45A] to-[#E6C77A] text-[#0B1020] font-heading font-semibold tracking-wider uppercase text-sm transition-all hover:shadow-[0_0_25px_rgba(230,199,122,0.45)]"
		>
			▣ Open {count} Strongbox{count > 1 ? 'es' : ''}
		</button>

		<!-- Comparison -->
		<div class="text-[10px] text-[#8E97AA] bg-[#0B1020]/40 border border-[#24314A] rounded-md p-3 leading-relaxed">
			<span class="text-[#E6C77A] font-semibold">4-Substat Odds:</span>
			<br>Strongbox: <span class="text-[#6FAF6E] font-mono">{(STRONGBOX_CONSTANTS.FOUR_SUBSTAT_CHANCE * 100)}%</span>
			<br>Domain: <span class="text-[#E8745A] font-mono">{(STRONGBOX_CONSTANTS.DOMAIN_FOUR_SUBSTAT_CHANCE * 100)}%</span>
			<br><span class="text-[#6FAF6E]">→ Strongbox {(STRONGBOX_CONSTANTS.FOUR_SUBSTAT_CHANCE / STRONGBOX_CONSTANTS.DOMAIN_FOUR_SUBSTAT_CHANCE).toFixed(2)}× better!</span>
		</div>
	</section>

	<!-- ═══ Result ═══ -->
	<section class="bg-[#1A2337]/80 backdrop-blur-sm rounded-xl border border-[#C9A45A]/25 shadow-xl p-5 space-y-4" in:fly={{ y: 10, duration: 300, easing: cubicOut }}>
		<h2 class="font-heading text-sm font-semibold text-[#F2E6D0] uppercase tracking-wider">Strongbox Results</h2>

		{#if result}
			<!-- Summary -->
			<div class="grid grid-cols-3 gap-2">
				<div class="text-center p-3 rounded-md bg-[#C9A45A]/10 border border-[#C9A45A]/30">
					<div class="text-[9px] text-[#E6C77A] uppercase">Opened</div>
					<div class="font-mono text-xl font-bold text-[#E6C77A]">{result.strongboxesOpened}</div>
				</div>
				<div class="text-center p-3 rounded-md bg-[#6FAF6E]/10 border border-[#6FAF6E]/30">
					<div class="text-[9px] text-[#6FAF6E] uppercase">4-Substat</div>
					<div class="font-mono text-xl font-bold text-[#6FAF6E]">{result.fourSubstatCount}</div>
				</div>
				<div class="text-center p-3 rounded-md bg-[#0B1020]/60 border border-[#24314A]">
					<div class="text-[9px] text-[#8E97AA] uppercase">Rate</div>
					<div class="font-mono text-xl font-bold text-[#F2E6D0]">{(result.fourSubstatRate * 100).toFixed(1)}%</div>
				</div>
			</div>

			<!-- Artifact list -->
			<div class="space-y-1.5 max-h-96 overflow-y-auto pr-1">
				<div class="text-[10px] text-[#8E97AA] uppercase tracking-wider">Artifacts</div>
				{#each result.artifacts as art, i}
					<div class="px-3 py-2 rounded-md bg-[#0B1020]/60 border border-[#C9A45A]/20">
						<div class="flex items-center justify-between mb-1">
							<span class="text-[10px] text-[#E6C77A] font-mono">#{i + 1} · {art.slot} · ★5</span>
							<span class="text-[10px] font-bold {art.initialSubstats.length === 4 ? 'text-[#6FAF6E]' : 'text-[#8E97AA]'}">
								{art.initialSubstats.length} subs
							</span>
						</div>
						<div class="text-[11px] text-[#F2E6D0] font-semibold mb-1">
							{getStatLabel(art.mainStat.key)}: <span class="text-[#E6C77A] font-mono">{formatValue(art.mainStat)}</span>
						</div>
						<div class="flex flex-wrap gap-1.5">
							{#each art.finalSubstats as sub}
								<span class="text-[10px] px-1.5 py-0.5 rounded bg-[#24314A]/60 border border-[#24314A]">
									<span class="{statColor(sub.key)}">{getStatLabel(sub.key)}</span>
									<span class="font-mono {statColor(sub.key)} font-bold">{formatValue(sub)}</span>
								</span>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>

</div>
