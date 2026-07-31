<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import {
		simulateTalentBookRuns,
		simulateWeaponAscensionRuns,
		simulateArtifactDomainRuns,
		type TalentBookRunResult,
		type WeaponAscensionRunResult,
		type ArtifactDomainRunResult
	} from '$lib/utils/domainDropEngine';

	type DomainType = 'talent' | 'weapon' | 'artifact';

	let domainType: DomainType = $state('talent');
	let runs: number = $state(10);

	let talentResults = $state<{ runs: TalentBookRunResult[]; totals: { r2: number; r3: number; r4: number }; totalResin: number } | null>(null);
	let weaponResults = $state<{ runs: WeaponAscensionRunResult[]; totals: { r2: number; r3: number; r4: number; r5: number }; totalResin: number } | null>(null);
	let artifactResults = $state<{ runs: ArtifactDomainRunResult[]; totals: { r1: number; r2: number; r3: number; r4: number; r5: number }; totalArtifacts: number; totalFiveStar: number; totalFourSub: number; totalResin: number } | null>(null);

	const DOMAIN_INFO: Record<DomainType, { label: string; resin: number; desc: string }> = {
		talent:   { label: 'Domain of Mastery (Talent Book)', resin: 20, desc: 'Talent upgrade materials. Daily rotation.' },
		weapon:   { label: 'Domain of Forgery (Weapon Ascension)', resin: 20, desc: 'Weapon ascension materials. Daily rotation.' },
		artifact: { label: 'Domain of Blessing (Artifact)', resin: 20, desc: '5★ artifact farming. AR45+ guaranteed 1× 5★.' }
	};

	function doSim() {
		if (domainType === 'talent') {
			talentResults = simulateTalentBookRuns(runs);
		} else if (domainType === 'weapon') {
			weaponResults = simulateWeaponAscensionRuns(runs);
		} else {
			artifactResults = simulateArtifactDomainRuns(runs);
		}
	}

	// Auto-run once on mount
	$effect(() => {
		void domainType;
		void runs;
		doSim();
	});
</script>

<div class="space-y-5">

	<!-- ═══ Controls ═══ -->
	<section class="bg-[#1A2337]/80 backdrop-blur-sm rounded-xl border border-[#C9A45A]/25 shadow-xl p-5 space-y-4">
		<h2 class="font-heading text-sm font-semibold text-[#F2E6D0] uppercase tracking-wider">Domain Configuration</h2>

		<!-- Domain Type Selector -->
		<div class="space-y-2">
			<!-- svelte-ignore a11y_label_has_associated_control -->
			<label class="text-xs font-bold text-[#E6C77A] uppercase tracking-wider">Domain Type</label>
			<div class="grid grid-cols-3 gap-2">
				{#each Object.entries(DOMAIN_INFO) as [key, info]}
					<button
						onclick={() => domainType = key as DomainType}
						class="px-3 py-2 rounded-md text-[11px] font-bold transition-all {domainType === key ? 'bg-[#C9A45A]/20 text-[#E6C77A] border border-[#C9A45A]/40' : 'bg-[#0B1020]/60 text-[#8E97AA] border border-transparent hover:text-[#B8C1D3]'}"
					>
						{key === 'talent' ? 'Talent' : key === 'weapon' ? 'Weapon' : 'Artifact'}
					</button>
				{/each}
			</div>
			<div class="text-[11px] text-[#8E97AA] mt-1">{DOMAIN_INFO[domainType].desc}</div>
		</div>

		<!-- Runs -->
		<div class="space-y-2">
			<div class="flex justify-between items-center">
				<label for="runs" class="text-xs font-bold text-[#E6C77A] uppercase tracking-wider">Runs</label>
				<span class="text-xs font-mono text-[#F2E6D0] tabular-nums">{runs}× ({runs * 20} resin)</span>
			</div>
			<input
				id="runs"
				type="range"
				min="1"
				max="50"
				bind:value={runs}
				class="w-full accent-[#C9A45A]"
			/>
		</div>

		<button
			onclick={doSim}
			class="btn-press w-full px-4 py-3 rounded-md border border-[#C9A45A]/50 bg-gradient-to-r from-[#C9A45A] to-[#E6C77A] text-[#0B1020] font-heading font-semibold tracking-wider uppercase text-sm transition-all hover:shadow-[0_0_25px_rgba(230,199,122,0.45)]"
		>
			⌬ Simulate {runs} Run{runs > 1 ? 's' : ''}
		</button>
	</section>

	<!-- ═══ Result ═══ -->
	<section class="bg-[#1A2337]/80 backdrop-blur-sm rounded-xl border border-[#C9A45A]/25 shadow-xl p-5 space-y-4" in:fly={{ y: 10, duration: 300, easing: cubicOut }}>
		<h2 class="font-heading text-sm font-semibold text-[#F2E6D0] uppercase tracking-wider">Results</h2>

		{#if domainType === 'talent' && talentResults}
			{@const t = talentResults.totals}
			<div class="grid grid-cols-3 gap-2">
				<div class="text-center p-3 rounded-md bg-[#5E90D6]/10 border border-[#5E90D6]/30">
					<div class="text-[9px] text-[#5E90D6] uppercase tracking-wider">2★ Green</div>
					<div class="font-mono text-2xl font-bold text-[#5E90D6] tabular-nums">{t.r2}</div>
				</div>
				<div class="text-center p-3 rounded-md bg-[#8D72C9]/10 border border-[#8D72C9]/30">
					<div class="text-[9px] text-[#B495F0] uppercase tracking-wider">3★ Blue</div>
					<div class="font-mono text-2xl font-bold text-[#B495F0] tabular-nums">{t.r3}</div>
				</div>
				<div class="text-center p-3 rounded-md bg-[#C9A45A]/10 border border-[#C9A45A]/30">
					<div class="text-[9px] text-[#E6C77A] uppercase tracking-wider">4★ Purple</div>
					<div class="font-mono text-2xl font-bold text-[#E6C77A] tabular-nums">{t.r4}</div>
				</div>
			</div>
			<div class="text-[11px] text-[#8E97AA] bg-[#0B1020]/40 border border-[#24314A] rounded-md p-3 leading-relaxed">
				<span class="text-[#E6C77A] font-semibold">Per run average:</span>
				{(t.r2 / runs).toFixed(1)} green · {(t.r3 / runs).toFixed(1)} blue · {(t.r4 / runs).toFixed(2)} purple
				<br><span class="text-[#8E97AA]">Expected: ~2.2 green · ~2.0 blue · ~0.22 purple (90/10 per pack)</span>
			</div>

		{:else if domainType === 'weapon' && weaponResults}
			{@const t = weaponResults.totals}
			<div class="grid grid-cols-4 gap-2">
				<div class="text-center p-3 rounded-md bg-[#5E90D6]/10 border border-[#5E90D6]/30">
					<div class="text-[9px] text-[#5E90D6] uppercase">2★ Green</div>
					<div class="font-mono text-xl font-bold text-[#5E90D6]">{t.r2}</div>
				</div>
				<div class="text-center p-3 rounded-md bg-[#8D72C9]/10 border border-[#8D72C9]/30">
					<div class="text-[9px] text-[#B495F0] uppercase">3★ Blue</div>
					<div class="font-mono text-xl font-bold text-[#B495F0]">{t.r3}</div>
				</div>
				<div class="text-center p-3 rounded-md bg-[#C9A45A]/10 border border-[#C9A45A]/30">
					<div class="text-[9px] text-[#E6C77A] uppercase">4★ Purple</div>
					<div class="font-mono text-xl font-bold text-[#E6C77A]">{t.r4}</div>
				</div>
				<div class="text-center p-3 rounded-md bg-[#E0B25A]/10 border border-[#E0B25A]/30">
					<div class="text-[9px] text-[#E0B25A] uppercase">5★ Gold</div>
					<div class="font-mono text-xl font-bold text-[#E0B25A]">{t.r5}</div>
				</div>
			</div>
			<div class="text-[11px] text-[#8E97AA] bg-[#0B1020]/40 border border-[#24314A] rounded-md p-3 leading-relaxed">
				<span class="text-[#E6C77A] font-semibold">Per run average:</span>
				{(t.r2 / runs).toFixed(1)} green · {(t.r3 / runs).toFixed(1)} blue · {(t.r4 / runs).toFixed(2)} purple · {(t.r5 / runs).toFixed(3)} gold
				<br><span class="text-[#8E97AA]">Expected: ~2.2 green · ~2.4 blue · ~0.62 purple · ~0.062 gold (78/20/2 per pack)</span>
			</div>

		{:else if domainType === 'artifact' && artifactResults}
			{@const t = artifactResults.totals}
			<div class="grid grid-cols-3 gap-2 mb-3">
				<div class="text-center p-3 rounded-md bg-[#C9A45A]/10 border border-[#C9A45A]/30">
					<div class="text-[9px] text-[#E6C77A] uppercase">5★ Artifacts</div>
					<div class="font-mono text-2xl font-bold text-[#E6C77A]">{artifactResults.totalFiveStar}</div>
				</div>
				<div class="text-center p-3 rounded-md bg-[#8D72C9]/10 border border-[#8D72C9]/30">
					<div class="text-[9px] text-[#B495F0] uppercase">4★ Artifacts</div>
					<div class="font-mono text-2xl font-bold text-[#B495F0]">{t.r4}</div>
				</div>
				<div class="text-center p-3 rounded-md bg-[#6FAF6E]/10 border border-[#6FAF6E]/30">
					<div class="text-[9px] text-[#6FAF6E] uppercase">4-Substat Start</div>
					<div class="font-mono text-2xl font-bold text-[#6FAF6E]">{artifactResults.totalFourSub}</div>
				</div>
			</div>
			<div class="grid grid-cols-4 gap-2">
				<div class="text-center p-2 rounded-md bg-[#5E6478]/10 border border-[#5E6478]/30">
					<div class="text-[9px] text-[#5E6478] uppercase">2★</div>
					<div class="font-mono text-sm font-bold text-[#5E6478]">{t.r2}</div>
				</div>
				<div class="text-center p-2 rounded-md bg-[#5E90D6]/10 border border-[#5E90D6]/30">
					<div class="text-[9px] text-[#5E90D6] uppercase">3★</div>
					<div class="font-mono text-sm font-bold text-[#5E90D6]">{t.r3}</div>
				</div>
				<div class="text-center p-2 rounded-md bg-[#8D72C9]/10 border border-[#8D72C9]/30">
					<div class="text-[9px] text-[#B495F0] uppercase">4★</div>
					<div class="font-mono text-sm font-bold text-[#B495F0]">{t.r4}</div>
				</div>
				<div class="text-center p-2 rounded-md bg-[#C9A45A]/10 border border-[#C9A45A]/30">
					<div class="text-[9px] text-[#E6C77A] uppercase">5★</div>
					<div class="font-mono text-sm font-bold text-[#E6C77A]">{t.r5}</div>
				</div>
			</div>
			<div class="text-[11px] text-[#8E97AA] bg-[#0B1020]/40 border border-[#24314A] rounded-md p-3 leading-relaxed">
				<span class="text-[#E6C77A] font-semibold">Per run average:</span>
				{(artifactResults.totalArtifacts / runs).toFixed(1)} artifacts · {(artifactResults.totalFiveStar / runs).toFixed(2)} 5★ · {(artifactResults.totalFourSub / runs).toFixed(2)} 4-substat
				<br><span class="text-[#8E97AA]">Expected: ~7.1 arts · ~1.07 5★ (guaranteed) · ~20% start with 4 subs</span>
			</div>
		{/if}
	</section>

</div>
