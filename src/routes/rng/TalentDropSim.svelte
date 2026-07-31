<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import {
		simulateTalentDrops,
		getAvailableBosses,
		getTalentRequirementForMax,
		type TalentSimulation
	} from '$lib/utils/talentDropEngine';

	let weeks: number = $state(4);
	let claimsPerWeek: number = $state(3);
	let bossName: string = $state(getAvailableBosses()[0]!);
	let simulation: TalentSimulation | null = $state(null);

	const BOSSES = getAvailableBosses();
	const REQ = getTalentRequirementForMax();

	function doSim() {
		simulation = simulateTalentDrops(weeks, claimsPerWeek, bossName);
	}

	function rarityColor(r: number): string {
		if (r === 5) return 'text-[#E6C77A] bg-[#C9A45A]/15 border-[#C9A45A]/40';
		if (r === 4) return 'text-[#B495F0] bg-[#8D72C9]/15 border-[#8D72C9]/40';
		return 'text-[#5E90D6] bg-[#5E90D6]/15 border-[#5E90D6]/40';
	}

	function rarityText(r: number): string {
		if (r === 5) return 'T4 / Top-tier';
		if (r === 4) return 'T3 / Mid-tier';
		return 'T2 / Low-tier';
	}

	function surplusColor(value: number): string {
		if (value >= 0) return 'text-[#6FAF6E]';
		return 'text-[#E8745A]';
	}
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-5">

	<!-- ═══ Controls ═══ -->
	<section class="bg-[#1A2337]/80 backdrop-blur-sm rounded-xl border border-[#C9A45A]/25 shadow-xl p-5 space-y-4">
		<h2 class="font-heading text-sm font-semibold text-[#F2E6D0] uppercase tracking-wider">Configuration</h2>

		<!-- Boss -->
		<div class="space-y-2">
			<label for="boss" class="text-xs font-bold text-[#E6C77A] uppercase tracking-wider">Weekly Boss</label>
			<select
				id="boss"
				bind:value={bossName}
				class="w-full px-3 py-2 rounded-md bg-[#0B1020] border border-[#24314A] text-[#F2E6D0] text-sm focus:outline-none focus:border-[#C9A45A]/60"
			>
				{#each BOSSES as b}
					<option value={b}>{b}</option>
				{/each}
			</select>
		</div>

		<!-- Weeks -->
		<div class="space-y-2">
			<div class="flex justify-between items-center">
				<label for="weeks" class="text-xs font-bold text-[#E6C77A] uppercase tracking-wider">Weeks</label>
				<span class="text-xs font-mono text-[#F2E6D0] tabular-nums">{weeks} minggu</span>
			</div>
			<input
				id="weeks"
				type="range"
				min="1"
				max="12"
				bind:value={weeks}
				class="w-full accent-[#C9A45A]"
			/>
			<div class="flex justify-between text-[10px] text-[#8E97AA]">
				<span>1</span>
				<span>6</span>
				<span>12</span>
			</div>
		</div>

		<!-- Claims per week -->
		<div class="space-y-2">
			<div class="flex justify-between items-center">
				<label for="claims" class="text-xs font-bold text-[#E6C77A] uppercase tracking-wider">Claims per Week</label>
				<span class="text-xs font-mono text-[#F2E6D0] tabular-nums">{claimsPerWeek}× claim/minggu</span>
			</div>
			<input
				id="claims"
				type="range"
				min="1"
				max="6"
				bind:value={claimsPerWeek}
				class="w-full accent-[#C9A45A]"
			/>
			<div class="text-[10px] text-[#8E97AA]">3 claim pertama per minggu dijamin drop 5★ (post-5.0 patch).</div>
		</div>

		<button
			onclick={doSim}
			class="w-full px-4 py-3 rounded-md border border-[#C9A45A]/50 bg-gradient-to-r from-[#C9A45A] to-[#E6C77A] text-[#0B1020] font-heading font-semibold tracking-wider uppercase text-sm transition-all hover:shadow-[0_0_25px_rgba(230,199,122,0.45)]"
		>
			✚ Simulate Drops
		</button>

		<!-- Mechanics info -->
		<div class="text-[10px] text-[#8E97AA] bg-[#0B1020]/40 border border-[#24314A] rounded-md p-3 leading-relaxed">
			<span class="text-[#E6C77A] font-semibold">Drop Mechanics:</span>
			• 3 drops per claim (3×3 = 9 drop/minggu default)
			• 3 claim pertama per minggu: 1 slot dijamin 5★ (post-5.0)
			• Slot lain: legacy rates — 5★ 16.7%, 4★ 33.3%, 3★ 50%
			• Untuk max 1 talent (Lv.1→10): butuh {REQ.r5}× 5★ + {REQ.r4}× 4★ + {REQ.r3}× 3★
		</div>
	</section>

	<!-- ═══ Result ═══ -->
	<section class="bg-[#1A2337]/80 backdrop-blur-sm rounded-xl border border-[#C9A45A]/25 shadow-xl p-5 space-y-4">
		<h2 class="font-heading text-sm font-semibold text-[#F2E6D0] uppercase tracking-wider">Drop Results</h2>

		{#if simulation}
			{#key simulation}
				<div class="space-y-4" in:fly={{ y: 10, duration: 300, easing: cubicOut }}>
					<!-- Totals -->
					<div class="grid grid-cols-3 gap-2">
						<div class="text-center p-3 rounded-md bg-[#C9A45A]/10 border border-[#C9A45A]/30">
							<div class="text-[9px] text-[#E6C77A] uppercase tracking-wider">5★ Books</div>
							<div class="font-mono text-2xl font-bold text-[#E6C77A] tabular-nums">{simulation.totals.r5}</div>
							<div class="text-[9px] text-[#8E97AA] mt-0.5">/ {REQ.r5} needed</div>
						</div>
						<div class="text-center p-3 rounded-md bg-[#8D72C9]/10 border border-[#8D72C9]/30">
							<div class="text-[9px] text-[#B495F0] uppercase tracking-wider">4★ Books</div>
							<div class="font-mono text-2xl font-bold text-[#B495F0] tabular-nums">{simulation.totals.r4}</div>
							<div class="text-[9px] text-[#8E97AA] mt-0.5">/ {REQ.r4} needed</div>
						</div>
						<div class="text-center p-3 rounded-md bg-[#5E90D6]/10 border border-[#5E90D6]/30">
							<div class="text-[9px] text-[#5E90D6] uppercase tracking-wider">3★ Books</div>
							<div class="font-mono text-2xl font-bold text-[#5E90D6] tabular-nums">{simulation.totals.r3}</div>
							<div class="text-[9px] text-[#8E97AA] mt-0.5">/ {REQ.r3} needed</div>
						</div>
					</div>

					<!-- Surplus/Deficit -->
					<div class="rounded-md border border-[#24314A] bg-[#0B1020]/40 p-3">
						<div class="text-[10px] text-[#8E97AA] uppercase tracking-wider mb-2">Surplus vs Max 1 Talent</div>
						<div class="grid grid-cols-3 gap-2 text-center">
							<div>
								<div class="text-[9px] text-[#8E97AA]">5★</div>
								<div class="font-mono text-sm font-bold {surplusColor(simulation.surplusDeficit.r5)} tabular-nums">
									{simulation.surplusDeficit.r5 >= 0 ? '+' : ''}{simulation.surplusDeficit.r5}
								</div>
							</div>
							<div>
								<div class="text-[9px] text-[#8E97AA]">4★</div>
								<div class="font-mono text-sm font-bold {surplusColor(simulation.surplusDeficit.r4)} tabular-nums">
									{simulation.surplusDeficit.r4 >= 0 ? '+' : ''}{simulation.surplusDeficit.r4}
								</div>
							</div>
							<div>
								<div class="text-[9px] text-[#8E97AA]">3★</div>
								<div class="font-mono text-sm font-bold {surplusColor(simulation.surplusDeficit.r3)} tabular-nums">
									{simulation.surplusDeficit.r3 >= 0 ? '+' : ''}{simulation.surplusDeficit.r3}
								</div>
							</div>
						</div>
					</div>

					<!-- Verdict -->
					<div class="text-[11px] text-[#8E97AA] bg-[#0B1020]/40 border border-[#24314A] rounded-md p-3 leading-relaxed">
						<span class="text-[#E6C77A] font-semibold">Verdict:</span>
						{#if simulation.surplusDeficit.r5 >= 0 && simulation.surplusDeficit.r4 >= 0 && simulation.surplusDeficit.r3 >= 0}
							<span class="text-[#6FAF6E] font-semibold">Cukup untuk max 1 talent!</span> Sisa {simulation.surplusDeficit.r5 + simulation.surplusDeficit.r4 + simulation.surplusDeficit.r3} book bisa dipakai untuk talent lain.
						{:else if simulation.surplusDeficit.r5 >= 0 && simulation.surplusDeficit.r4 >= 0}
							<span class="text-[#E0B25A]">Hampir cukup.</span> Butuh {Math.abs(simulation.surplusDeficit.r3)}× 3★ book lagi — gampang didapat.
						{:else}
							<span class="text-[#E8745A]">Belum cukup.</span> Butuh {Math.abs(simulation.surplusDeficit.r5)}× 5★ book lagi. Lanjutkan farm beberapa minggu.
						{/if}
					</div>

					<!-- Detailed Log -->
					<div class="space-y-1.5">
						<div class="text-[10px] text-[#8E97AA] uppercase tracking-wider">Drop Log</div>
						<div class="max-h-64 overflow-y-auto space-y-1 pr-1">
							{#each simulation.results as result}
								<div class="text-[11px] px-2 py-1.5 rounded bg-[#0B1020]/40 border border-[#24314A]/40 flex items-center gap-2">
									<span class="font-mono text-[#8E97AA] w-16 shrink-0">#{result.claimNumber}</span>
									<span class="text-[9px] {result.hasGuaranteed5Star ? 'text-[#E6C77A]' : 'text-[#5E6478]'} font-bold uppercase shrink-0">
										{result.hasGuaranteed5Star ? 'GUAR' : 'RNG'}
									</span>
									<div class="flex gap-1">
										{#each result.drops as drop}
											<span class="px-1.5 py-0.5 rounded border text-[9px] font-mono font-bold {rarityColor(drop.rarity)}" title={rarityText(drop.rarity)}>
												★{drop.rarity}{drop.isGuaranteed ? '✓' : ''}
											</span>
										{/each}
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/key}
		{:else}
			<div class="text-center py-12 text-[#8E97AA] text-sm">
				<div class="text-4xl text-[#C9A45A]/40 mb-3">✚</div>
				Klik <span class="text-[#E6C77A] font-semibold">Simulate Drops</span> untuk mulai.
			</div>
		{/if}
	</section>

</div>
