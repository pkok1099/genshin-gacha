<script lang="ts">
        import { onMount } from 'svelte';
        import { getGachaStore } from '$lib/stores/gacha';
        import BannerCard from '$lib/components/BannerCard.svelte';
        import PullButton from '$lib/components/PullButton.svelte';
        import ResultModal from '$lib/components/ResultModal.svelte';
        import PityCounter from '$lib/components/PityCounter.svelte';
        import WishHistory from '$lib/components/WishHistory.svelte';

        const store = getGachaStore();

        onMount(() => {
                store.fetchBanners();
        });
</script>

<svelte:head>
        <title>Genshin Impact Gacha Simulator</title>
        <meta name="description" content="Simulasi gacha Genshin Impact dengan pity system real-time" />
</svelte:head>

<div class="min-h-screen bg-[#0d1117] text-slate-100">
        <!-- Background Pattern -->
        <div class="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/20 via-transparent to-transparent pointer-events-none"></div>

        <div class="relative z-10 max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">

                <!-- Header -->
                <header class="text-center space-y-2 py-4">
                        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                                <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                                Genshin Impact v{store.currentBanner?.version ?? '—'} • Live Banner Data
                        </div>
                        <h1 class="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-purple-300">
                                Wish Simulator
                        </h1>
                        <p class="text-slate-500 text-sm max-w-lg mx-auto">
                                Simulasi gacha dengan pity system akurat sesuai game asli. Data banner diambil real-time dari API.
                        </p>
                </header>

                <!-- Loading State -->
                {#if store.isLoading}
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {#each [0, 1] as _}
                                        <div class="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 animate-pulse">
                                                <div class="flex gap-4 items-center">
                                                        <div class="w-20 h-20 bg-slate-700 rounded-xl"></div>
                                                        <div class="flex-1 space-y-3">
                                                                <div class="h-4 w-16 bg-slate-700 rounded-full"></div>
                                                                <div class="h-6 w-32 bg-slate-700 rounded"></div>
                                                                <div class="h-3 w-20 bg-slate-700 rounded"></div>
                                                        </div>
                                                </div>
                                        </div>
                                {/each}
                        </div>
                {:else if store.apiError}
                        <!-- Error State -->
                        <div class="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-6 py-4 rounded-2xl text-sm flex items-center gap-3">
                                <svg class="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>
                                <div>
                                        <p class="font-bold">Gagal memuat data banner</p>
                                        <p class="text-rose-400/80 text-xs mt-1">{store.apiError}</p>
                                </div>
                                <button onclick={() => store.fetchBanners()} class="ml-auto text-xs bg-rose-500/20 hover:bg-rose-500/30 px-3 py-1.5 rounded-lg border border-rose-500/30 transition-all">
                                        Coba Lagi
                                </button>
                        </div>
                {:else}
                        <!-- ═══ Banner Selection ═══ -->
                        <section class="space-y-4">
                                <div class="flex justify-between items-center">
                                        <h2 class="text-lg font-bold text-slate-200">Banner Aktif</h2>
                                        <button onclick={() => store.fetchBanners()} class="text-[11px] bg-slate-800 hover:bg-slate-700 text-amber-300 px-3 py-1.5 rounded-lg border border-amber-500/30 transition-all flex items-center gap-1.5">
                                                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                                Sync
                                        </button>
                                </div>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {#each store.banners as banner, i}
                                                <BannerCard
                                                        {banner}
                                                        selected={store.selectedBannerIdx === i}
                                                        onclick={() => { store.selectedBannerIdx = i; }}
                                                />
                                        {/each}
                                </div>
                        </section>

                        <!-- ═══ Pull Section ═══ -->
                        <section class="space-y-4">
                                <div class="bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-amber-500/20 p-6 rounded-3xl shadow-2xl space-y-5">
                                        <!-- Featured Character Display -->
                                        {#if store.featured5Star}
                                                <div class="text-center">
                                                        <div class="text-amber-400 font-bold text-xs tracking-wider uppercase mb-1">Featured Character</div>
                                                        <div class="text-2xl font-black text-amber-300">{store.featured5Star.name}</div>
                                                        <div class="text-xs text-slate-500 italic">"{store.featured5Star.element}" • ★5 Rate-Up</div>
                                                </div>
                                        {/if}

                                        <!-- Pull Buttons -->
                                        <PullButton
                                                disabled={!store.currentBanner}
                                                onSinglePull={() => store.doSinglePull()}
                                                onTenPull={() => store.doTenPull()}
                                        />

                                        <!-- Quick Info -->
                                        <div class="grid grid-cols-3 gap-3 text-center text-xs">
                                                <div class="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                                                        <div class="text-slate-500">Base Rate 5★</div>
                                                        <div class="text-amber-400 font-bold font-mono">0.6%</div>
                                                </div>
                                                <div class="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                                                        <div class="text-slate-500">Soft Pity</div>
                                                        <div class="text-rose-400 font-bold font-mono">Pull 74+</div>
                                                </div>
                                                <div class="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                                                        <div class="text-slate-500">Hard Pity</div>
                                                        <div class="text-rose-400 font-bold font-mono">Pull 90</div>
                                                </div>
                                        </div>
                                </div>
                        </section>

                        <!-- ═══ Stats & History ═══ -->
                        <section class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <!-- Pity Counter -->
                                <div class="lg:col-span-1 space-y-4">
                                        <PityCounter state={store.state} />

                                        <!-- Reset Button -->
                                        <button
                                                onclick={() => { if (confirm('Reset semua data wish?')) store.resetState(); }}
                                                class="w-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-300 font-semibold py-2.5 px-4 rounded-xl transition-all border border-slate-700/50 text-xs"
                                        >
                                                Reset Semua Data
                                        </button>
                                </div>

                                <!-- Wish History -->
                                <div class="lg:col-span-2">
                                        <WishHistory history={store.state.history} />
                                </div>
                        </section>
                {/if}

                <!-- Footer -->
                <footer class="text-center text-xs text-slate-700 pt-4 pb-8 space-y-1">
                        <p>Data banner dari <a href="https://api.ennead.cc" target="_blank" rel="noopener" class="text-amber-500/50 hover:text-amber-400 transition-colors">api.ennead.cc</a> • Karakter & gambar dari <a href="https://genshin.jmp.blue" target="_blank" rel="noopener" class="text-amber-500/50 hover:text-amber-400 transition-colors">genshin.jmp.blue</a></p>
                        <p>Genshin Impact © HoYoverse — Ini adalah simulasi fan-made, bukan resmi</p>
                </footer>
        </div>
</div>

<!-- Result Modal Overlay -->
{#if store.showResultModal}
        <ResultModal
                results={store.lastPullResults}
                onClose={() => store.closeModal()}
        />
{/if}
