<script lang="ts">
	import { onMount } from 'svelte';
	import { getBannerStore } from '$lib/stores/bannerStore.svelte';
	import { getGameState, type WishResult } from '$lib/stores/gameState.svelte';
	import BannerCard from '$lib/components/BannerCard.svelte';
	import PityBar from '$lib/components/PityBar.svelte';
	import WishAnimation from '$lib/components/WishAnimation.svelte';
	import { characterIconBigUrl, slugifyName } from '$lib/services/characterApi';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	const banners = getBannerStore();
	const game = getGameState();

	let pendingResults: WishResult[] = $state([]);
	let showAnimation = $state(false);
	let pullError = $state('');
	let splashFailed = $state(false);

	onMount(() => {
		if (banners.banners.length === 0 && !banners.isLoading) {
			banners.fetchBanners();
		}
	});

	function handleSinglePull() {
		pullError = '';
		const result = game.doSinglePull();
		if (!result.ok) {
			pullError = result.reason === 'no_banner' ? 'Pilih banner dulu.' : 'Primogem tidak cukup.';
			return;
		}
		pendingResults = [result.wish];
		showAnimation = true;
	}

	function handleTenPull() {
		pullError = '';
		const result = game.doTenPull();
		if (!result.ok) {
			pullError = result.reason === 'no_banner' ? 'Pilih banner dulu.' : 'Primogem tidak cukup untuk 10-pull (butuh 1,600).';
			return;
		}
		pendingResults = result.wishes;
		showAnimation = true;
	}

	function closeAnimation() {
		showAnimation = false;
		pendingResults = [];
	}

	// Pull button disabled state
	let canSingle = $derived(game.primogem >= game.COST_SINGLE && banners.currentBanner !== null);
	let canTen = $derived(game.primogem >= game.COST_TEN && banners.currentBanner !== null);
</script>

<svelte:head>
	<title>Wish — Genshin Impact Simulator</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 space-y-6">

	<!-- ═══ Banner Stage ═══ -->
	<section class="relative overflow-hidden rounded-2xl border border-[#C9A45A]/25 bg-gradient-to-b from-[#1A2337] via-[#141C2F] to-[#0B1020] min-h-[420px] md:min-h-[480px]">
		<!-- Decorative gradient -->
		<div class="absolute inset-0 pointer-events-none">
			<div class="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-64 opacity-40"
				style="background: radial-gradient(ellipse at center top, rgba(230,199,122,0.35), transparent 60%);"></div>
		</div>

		<div class="relative grid grid-cols-1 md:grid-cols-2 gap-6 p-5 md:p-8 h-full">

			<!-- Featured splash -->
			<div class="relative h-64 md:h-80 lg:h-96 flex items-end justify-center">
				{#if banners.featured5Star}
					{#key banners.featured5Star.name}
						<div class="absolute inset-0 flex items-end justify-center" in:fly={{ y: 20, duration: 500, easing: cubicOut }}>
							<div class="absolute inset-0 opacity-50"
								style="background: radial-gradient(ellipse at center 80%, rgba(230,199,122,0.5), transparent 65%);"></div>

							{#if !splashFailed}
								<img
									src={characterIconBigUrl(slugifyName(banners.featured5Star.name))}
									alt={banners.featured5Star.name}
									class="relative h-full w-full object-contain object-bottom drop-shadow-2xl"
									onerror={(e: Event) => {
										const img = e.currentTarget as HTMLImageElement;
										const fb = banners.featured5Star?.icon;
										if (fb && img.src !== fb) {
											img.src = fb;
										} else {
											splashFailed = true;
										}
									}}
								/>
							{:else}
								<div class="relative h-full w-full flex items-end justify-center">
									<div class="text-6xl text-[#E6C77A] mb-12">✦</div>
								</div>
							{/if}
						</div>
					{/key}
				{:else if banners.isLoading}
					<div class="absolute inset-0 flex items-center justify-center text-[#8E97AA] text-sm animate-pulse">
						Memuat banner…
					</div>
				{:else}
					<div class="absolute inset-0 flex items-center justify-center text-[#8E97AA] text-sm">
						Tidak ada banner tersedia.
					</div>
				{/if}
			</div>

			<!-- Pull panel -->
			<div class="relative flex flex-col justify-between space-y-4">
				<div class="space-y-3">
					<div class="flex items-center gap-2">
						<span class="text-[10px] px-2 py-0.5 rounded border border-[#C9A45A]/30 bg-[#C9A45A]/10 text-[#E6C77A] uppercase tracking-wider">
							{banners.featured5Star?.element ?? '—'}
						</span>
						<span class="text-[10px] text-[#8E97AA] font-mono">v{banners.currentBanner?.version ?? '—'}</span>
						{#if banners.countdownText}
							<span class="text-[10px] text-[#E8745A] font-mono ml-auto">⏳ {banners.countdownText}</span>
						{/if}
					</div>

					<h2 class="font-heading text-3xl md:text-4xl font-bold text-[#F2E6D0] leading-tight">
						{banners.featured5Star?.name ?? 'No Banner'}
					</h2>
					<div class="text-[#C9A45A] tracking-widest text-sm">★ ★ ★ ★ ★</div>

					{#if banners.featured4Stars.length > 0}
						<div class="flex flex-wrap gap-1.5 pt-1">
							{#each banners.featured4Stars as c4}
								<span class="text-[10px] px-2 py-0.5 rounded bg-[#8D72C9]/15 text-[#B495F0] border border-[#8D72C9]/30">
									{c4.name}
								</span>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Pull buttons -->
				<div class="space-y-2">
					{#if pullError}
						<div class="text-xs text-[#E8745A] bg-[#8B3A3A]/15 border border-[#8B3A3A]/40 rounded-md px-3 py-2" in:fade>
							{pullError}
						</div>
					{/if}

					<div class="grid grid-cols-2 gap-3">
						<button
							onclick={handleSinglePull}
							disabled={!canSingle}
							class="relative group bg-gradient-to-br from-[#24314A] to-[#1A2337] hover:from-[#2A3856] hover:to-[#24314A] text-[#E6C77A] font-heading font-semibold py-4 px-4 rounded-lg border border-[#C9A45A]/30 transition-all text-sm flex flex-col items-center justify-center gap-0.5 overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#C9A45A]/60 hover:shadow-[0_0_20px_rgba(201,164,90,0.25)]"
						>
							<span class="text-base tracking-wider uppercase">✦ 1× Wish</span>
							<span class="text-[10px] text-[#8E97AA] font-mono">{game.COST_SINGLE} Primo</span>
						</button>
						<button
							onclick={handleTenPull}
							disabled={!canTen}
							class="relative group bg-gradient-to-br from-[#C9A45A] to-[#8D72C9] hover:from-[#E6C77A] hover:to-[#B495F0] text-[#0B1020] font-heading font-bold py-4 px-4 rounded-lg border border-[#E6C77A]/50 transition-all text-sm flex flex-col items-center justify-center gap-0.5 overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_30px_rgba(230,199,122,0.45)]"
						>
							<span class="text-base tracking-wider uppercase">✦✦ 10× Wish</span>
							<span class="text-[10px] text-[#0B1020]/70 font-mono font-semibold">{game.COST_TEN} Primo</span>
						</button>
					</div>

					<!-- Quick info -->
					<div class="grid grid-cols-3 gap-2 text-center text-[10px] pt-2">
						<div class="bg-[#0B1020]/60 p-2 rounded-md border border-[#24314A]">
							<div class="text-[#8E97AA] uppercase tracking-wider">Base 5★</div>
							<div class="font-mono text-[#E6C77A] font-bold">0.6%</div>
						</div>
						<div class="bg-[#0B1020]/60 p-2 rounded-md border border-[#24314A]">
							<div class="text-[#8E97AA] uppercase tracking-wider">Soft Pity</div>
							<div class="font-mono text-[#E8745A] font-bold">74+</div>
						</div>
						<div class="bg-[#0B1020]/60 p-2 rounded-md border border-[#24314A]">
							<div class="text-[#8E97AA] uppercase tracking-wider">Hard Pity</div>
							<div class="font-mono text-[#E8745A] font-bold">90</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- ═══ Banner Carousel ═══ -->
	<section class="space-y-3">
		<div class="flex justify-between items-center">
			<h3 class="font-heading text-sm font-semibold text-[#F2E6D0] uppercase tracking-wider">Pilih Banner</h3>
			<button
				onclick={() => banners.fetchBanners()}
				class="text-[10px] text-[#8E97AA] hover:text-[#E6C77A] transition-colors flex items-center gap-1"
				disabled={banners.isLoading}
			>
				<svg class="w-3 h-3 {banners.isLoading ? 'animate-spin' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
				</svg>
				Sync
			</button>
		</div>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
			{#each banners.banners as banner (banner.id)}
				<BannerCard
					{banner}
					selected={banners.selectedBannerId === String(banner.id)}
					onclick={() => banners.selectBanner(String(banner.id))}
				/>
			{/each}
		</div>
	</section>

	<!-- ═══ Pity + Recent ═══ -->
	<section class="grid grid-cols-1 lg:grid-cols-3 gap-4">
		<div class="lg:col-span-1">
			<PityBar
				pity5={game.pity5}
				pity4={game.pity4}
				guaranteed5={game.guaranteed5}
				guaranteed4={game.guaranteed4}
			/>
		</div>

		<div class="lg:col-span-2 bg-[#1A2337]/80 backdrop-blur-sm rounded-xl border border-[#C9A45A]/20 shadow-xl p-4 space-y-3">
			<div class="flex items-center justify-between">
				<h3 class="font-heading text-sm font-semibold text-[#F2E6D0] uppercase tracking-wider">Pull Terakhir</h3>
				<a href="/history" class="text-[10px] text-[#C9A45A] hover:text-[#E6C77A] uppercase tracking-wider">Lihat semua →</a>
			</div>
			{#if game.wishHistory.length === 0}
				<div class="text-[#8E97AA] italic text-center py-8 text-sm">Belum ada wish. Tekan tombol pull di atas!</div>
			{:else}
				<div class="grid grid-cols-5 md:grid-cols-10 gap-2">
					{#each game.wishHistory.slice(-10).reverse() as item (item.id)}
						<div class="aspect-[3/4] rounded-md overflow-hidden border {item.rarity === 5 ? 'border-[#E6C77A] gold-glow' : item.rarity === 4 ? 'border-[#B495F0] purple-glow' : 'border-[#5E90D6]'} bg-[#0B1020] relative group">
							<img
								src={item.icon}
								alt={item.name}
								class="w-full h-full object-cover"
								onerror={(e: Event) => {
									const img = e.currentTarget as HTMLImageElement;
									if (item.fallbackIcon && img.src !== item.fallbackIcon) {
										img.src = item.fallbackIcon;
									} else {
										img.style.opacity = '0.2';
									}
								}}
							/>
							<div class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#0B1020] to-transparent p-1 text-center">
								<div class="text-[8px] text-[#E6C77A] font-bold leading-none">{'★'.repeat(item.rarity)}</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</section>

</div>

<!-- ═══ Wish Animation Modal ═══ -->
{#if showAnimation}
	<WishAnimation results={pendingResults} onClose={closeAnimation} />
{/if}
