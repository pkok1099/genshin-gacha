<script lang="ts">
	import { fade } from 'svelte/transition';
	import ArtifactRngSim from './ArtifactRngSim.svelte';
	import WeaponBannerSim from './WeaponBannerSim.svelte';
	import TalentDropSim from './TalentDropSim.svelte';
	import DomainSim from './DomainSim.svelte';
	import NormalBossSim from './NormalBossSim.svelte';
	import StrongboxSim from './StrongboxSim.svelte';
	import CookingSim from './CookingSim.svelte';
	import ParametricSim from './ParametricSim.svelte';

	type Tab = 'artifact' | 'weapon' | 'talent' | 'domain' | 'boss' | 'strongbox' | 'cooking' | 'parametric';

	let activeTab: Tab = $state('artifact');

	const TABS: { id: Tab; label: string; icon: string; desc: string; category: string }[] = [
		{ id: 'artifact',   label: 'Artifact Substat', icon: '◈', desc: 'Roll artifact +0 → +20, simulasikan substat upgrade',            category: 'Wish & Artifact' },
		{ id: 'weapon',     label: 'Weapon Banner',    icon: '✦', desc: 'Gacha weapon dengan Epitomized Path & fate points',                category: 'Wish & Artifact' },
		{ id: 'strongbox',  label: 'Strongbox',        icon: '▣', desc: 'Trade 3× 5★ artifact → 1 random (66/34 substat odds, better than domain)', category: 'Wish & Artifact' },
		{ id: 'domain',     label: 'Domain Drops',     icon: '⌬', desc: 'Talent book / Weapon ascension / Artifact domain (20 resin)',      category: 'Domain & Boss' },
		{ id: 'boss',       label: 'Normal Boss',      icon: '✺', desc: 'Boss drops: 1 guaranteed 5★ artifact + ascension gems (40 resin)', category: 'Domain & Boss' },
		{ id: 'talent',     label: 'Talent Drops',     icon: '✚', desc: 'Weekly boss talent material drops (post-5.0 guaranteed)',          category: 'Domain & Boss' },
		{ id: 'cooking',    label: 'Cooking',          icon: '♨', desc: 'Special dish chance + 12% dupe talent (Jean, Hu Tao, dll)',       category: 'Crafting' },
		{ id: 'parametric', label: 'Parametric',       icon: '◈', desc: 'Parametric Transformer weekly reward (7-day cooldown gadget)',     category: 'Crafting' }
	];

	// Group tabs by category for display
	const CATEGORIES = ['Wish & Artifact', 'Domain & Boss', 'Crafting'];
	let tabsByCategory = $derived(
		CATEGORIES.map((cat) => ({
			category: cat,
			tabs: TABS.filter((t) => t.category === cat)
		}))
	);

	let activeTabInfo = $derived(TABS.find((t) => t.id === activeTab));
</script>

<svelte:head>
	<title>RNG Simulators — Genshin Impact</title>
</svelte:head>

<div class="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 space-y-6">

	<!-- ═══ Header ═══ -->
	<section class="space-y-2">
		<h1 class="font-heading text-3xl md:text-4xl font-bold text-[#F2E6D0]">Genshin RNG Simulators</h1>
		<p class="text-sm text-[#B8C1D3] max-w-2xl">
			Simulasi RNG permanen di Genshin Impact. Semua drop rate mengikuti data resmi (Genshin Wiki Loot System).
		</p>
	</section>

	<!-- ═══ Tabs (grouped by category) ═══ -->
	<div class="space-y-3">
		{#each tabsByCategory as group}
			<div class="space-y-2">
				<div class="text-[10px] text-[#8E97AA] uppercase tracking-wider font-semibold">{group.category}</div>
				<div class="flex gap-1 p-1 rounded-lg bg-[#1A2337]/60 border border-[#24314A] overflow-x-auto">
					{#each group.tabs as tab}
						<button
							onclick={() => activeTab = tab.id}
							class="flex-1 min-w-[110px] px-3 py-2.5 rounded-md text-xs font-heading font-semibold uppercase tracking-wider transition-all whitespace-nowrap {activeTab === tab.id ? 'bg-gradient-to-r from-[#C9A45A] to-[#E6C77A] text-[#0B1020] shadow-md' : 'text-[#B8C1D3] hover:text-[#F2E6D0] hover:bg-[#24314A]/60'}"
						>
							<span class="mr-1.5 opacity-80">{tab.icon}</span>
							{tab.label}
						</button>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<!-- ═══ Active Tab Description ═══ -->
	{#if activeTabInfo}
		<div class="text-xs text-[#8E97AA] flex items-center gap-2" in:fade>
			<span class="text-[#E6C77A]">{activeTabInfo.icon}</span>
			<span>{activeTabInfo.desc}</span>
		</div>
	{/if}

	<!-- ═══ Content ═══ -->
	{#if activeTab === 'artifact'}
		<ArtifactRngSim />
	{:else if activeTab === 'weapon'}
		<WeaponBannerSim />
	{:else if activeTab === 'strongbox'}
		<StrongboxSim />
	{:else if activeTab === 'domain'}
		<DomainSim />
	{:else if activeTab === 'boss'}
		<NormalBossSim />
	{:else if activeTab === 'talent'}
		<TalentDropSim />
	{:else if activeTab === 'cooking'}
		<CookingSim />
	{:else if activeTab === 'parametric'}
		<ParametricSim />
	{/if}

</div>
