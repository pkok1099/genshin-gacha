<script lang="ts">
	import { fade } from 'svelte/transition';
	import ArtifactRngSim from './ArtifactRngSim.svelte';
	import WeaponBannerSim from './WeaponBannerSim.svelte';
	import TalentDropSim from './TalentDropSim.svelte';

	type Tab = 'artifact' | 'weapon' | 'talent';

	let activeTab: Tab = $state('artifact');

	const TABS: { id: Tab; label: string; icon: string; desc: string }[] = [
		{ id: 'artifact', label: 'Artifact Substat',  icon: '◈', desc: 'Roll artifact dari +0 → +20, simulasikan substat upgrade' },
		{ id: 'weapon',   label: 'Weapon Banner',     icon: '✦', desc: 'Gacha weapon dengan Epitomized Path & fate points' },
		{ id: 'talent',   label: 'Talent Drops',      icon: '✚', desc: 'Simulasikan weekly boss drop untuk talent material' }
	];
</script>

<svelte:head>
	<title>RNG Simulators — Genshin Impact</title>
</svelte:head>

<div class="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 space-y-6">

	<!-- ═══ Header ═══ -->
	<section class="space-y-2">
		<h1 class="font-heading text-3xl md:text-4xl font-bold text-[#F2E6D0]">Genshin RNG Simulators</h1>
		<p class="text-sm text-[#B8C1D3] max-w-2xl">
			Simulasi RNG lain di Genshin Impact selain wish banner. Pilih simulator di bawah.
		</p>
	</section>

	<!-- ═══ Tabs ═══ -->
	<section class="flex gap-1 p-1 rounded-lg bg-[#1A2337]/60 border border-[#24314A] overflow-x-auto">
		{#each TABS as tab}
			<button
				onclick={() => activeTab = tab.id}
				class="flex-1 min-w-[120px] px-3 py-2.5 rounded-md text-xs font-heading font-semibold uppercase tracking-wider transition-all {activeTab === tab.id ? 'bg-gradient-to-r from-[#C9A45A] to-[#E6C77A] text-[#0B1020] shadow-md' : 'text-[#B8C1D3] hover:text-[#F2E6D0] hover:bg-[#24314A]/60'}"
			>
				<span class="mr-1.5 opacity-80">{tab.icon}</span>
				{tab.label}
			</button>
		{/each}
	</section>

	<!-- ═══ Active Tab Description ═══ -->
	{#each TABS as tab}
		{#if activeTab === tab.id}
			<div class="text-xs text-[#8E97AA] flex items-center gap-2" in:fade>
				<span class="text-[#E6C77A]">{tab.icon}</span>
				<span>{tab.desc}</span>
			</div>
		{/if}
	{/each}

	<!-- ═══ Content ═══ -->
	{#if activeTab === 'artifact'}
		<ArtifactRngSim />
	{:else if activeTab === 'weapon'}
		<WeaponBannerSim />
	{:else if activeTab === 'talent'}
		<TalentDropSim />
	{/if}

</div>
