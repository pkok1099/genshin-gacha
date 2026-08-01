<script lang="ts">
        import { getGameState, type WishMode } from '$lib/stores/gameState.svelte';
        import { calculateLuckStats } from '$lib/utils/luckScore';
        import WishHistoryTable from '$lib/components/WishHistoryTable.svelte';
        import LuckStats from '$lib/components/LuckStats.svelte';
        import LuckChart from '$lib/components/LuckChart.svelte';
        import BannerSummary from '$lib/components/BannerSummary.svelte';
        import LuckComparison from '$lib/components/LuckComparison.svelte';
        import PityHeatmap from '$lib/components/PityHeatmap.svelte';
        import AchievementTracker from '$lib/components/AchievementTracker.svelte';
        import ThemedModal from '$lib/components/ThemedModal.svelte';
        import { fade, fly } from 'svelte/transition';
        import { cubicOut } from 'svelte/easing';
        import { t, localeKey } from '$lib/i18n/index.svelte';
        import { playTick, playError } from '$lib/audio/synth.svelte';

        // Re-render on locale change
        void localeKey();

        const game = getGameState();

        // ── Per-banner filter ──────────────────────────────────────────────────
        // 'all' shows every pull; 'character' / 'standard' / 'novice' filter to
        // pulls made on that banner. We classify each WishResult by its bannerId:
        //   - bannerId === 'standard' → Standard Wish
        //   - bannerId === 'novice'   → Novice Wish
        //   - anything else (numeric banner API id) → Character Event
        // (See gameState.pushResultsToHistory — Character Event pulls use the
        // banner's dynamic API id, while Standard/Novice use literal strings.)
        type BannerFilter = 'all' | WishMode;
        let bannerFilter: BannerFilter = $state('all');

        function classifyBanner(bannerId: string): WishMode {
                if (bannerId === 'standard') return 'standard';
                if (bannerId === 'novice') return 'novice';
                return 'character';
        }

        let filteredHistory = $derived(
                bannerFilter === 'all'
                        ? game.wishHistory
                        : game.wishHistory.filter((r) => classifyBanner(r.bannerId) === bannerFilter)
        );

        // Per-banner counts for the filter tabs — derived so they update when
        // history changes (the previous `const BANNER_TABS` captured counts
        // once at init and went stale; Svelte flagged it as a warning).
        let bannerTabs = $derived([
                { key: 'all' as BannerFilter,       label: 'Semua',      icon: '✦', accent: 'text-[#F2E6D0]', count: game.wishHistory.length },
                { key: 'character' as BannerFilter, label: 'Char Event', icon: '✦', accent: 'text-[#E6C77A]', count: game.wishHistory.filter((r) => classifyBanner(r.bannerId) === 'character').length },
                { key: 'standard' as BannerFilter,  label: 'Standard',   icon: '◈', accent: 'text-[#B8C1D3]', count: game.wishHistory.filter((r) => classifyBanner(r.bannerId) === 'standard').length },
                { key: 'novice' as BannerFilter,    label: 'Novice',     icon: '✚', accent: 'text-[#B495F0]', count: game.wishHistory.filter((r) => classifyBanner(r.bannerId) === 'novice').length }
        ]);

        let stats = $derived(calculateLuckStats(filteredHistory));

        let confirmReset = $state(false);

        function doReset() {
                game.resetHistoryOnly();
                confirmReset = false;
                playError();
        }

        function openReset() {
                confirmReset = true;
                playTick();
        }

        // ── Export / Import wish history ───────────────────────────────────────
        // Export: serialize the full wish history (+ metadata envelope) to a
        // JSON file and trigger a browser download.
        // Import: read a JSON file (envelope or bare array), validate each
        // entry, and replace the current history. We use a hidden <input
        // type="file"> triggered by a button click so we stay in Svelte's
        // reactivity model (no ad-hoc DOM listeners).
        let importToast: { kind: 'ok' | 'err'; msg: string } | null = $state(null);
        let fileInput: HTMLInputElement | null = $state(null);

        function handleExport() {
                const envelope = game.exportHistory();
                const json = JSON.stringify(envelope, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                const date = new Date().toISOString().slice(0, 10);
                a.href = url;
                a.download = `genshin-wish-history-${date}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                playTick();
                importToast = { kind: 'ok', msg: `Exported ${envelope.history.length} pulls to JSON file.` };
                setTimeout(() => { importToast = null; }, 3000);
        }

        function handleImportClick() {
                fileInput?.click();
        }

        function handleFileChange(e: Event) {
                const input = e.currentTarget as HTMLInputElement;
                const file = input.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                        try {
                                const parsed = JSON.parse(String(reader.result));
                                const count = game.importHistory(parsed);
                                if (count > 0) {
                                        playTick();
                                        importToast = { kind: 'ok', msg: `Imported ${count} pulls from ${file.name}.` };
                                } else {
                                        playError();
                                        importToast = { kind: 'err', msg: `No valid wish entries found in ${file.name}.` };
                                }
                        } catch (err) {
                                playError();
                                importToast = { kind: 'err', msg: `Failed to parse JSON: ${(err as Error).message}` };
                        }
                        // Reset the input so the same file can be re-imported.
                        input.value = '';
                        setTimeout(() => { importToast = null; }, 4000);
                };
                reader.onerror = () => {
                        playError();
                        importToast = { kind: 'err', msg: 'Failed to read file.' };
                        setTimeout(() => { importToast = null; }, 4000);
                };
                reader.readAsText(file);
        }
</script>

<svelte:head>
        <title>{t('history.title')} — Genshin Impact Simulator</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 space-y-6">

        <!-- ═══ Header ═══ -->
        <section class="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                        <h1 class="font-heading text-3xl md:text-4xl font-bold text-[#F2E6D0]">{t('history.title')}</h1>
                        <p class="text-sm text-[#B8C1D3] mt-1">
                                {t('history.subtitle', { count: game.totalWishes.toLocaleString('en-US') })}
                        </p>
                </div>
                <div class="flex gap-2 flex-wrap">
                        <a
                                href="/wish"
                                class="btn-press px-4 py-2 rounded-md border border-[#C9A45A]/40 bg-gradient-to-r from-[#24314A] to-[#1A2337] text-[#E6C77A] text-xs font-semibold uppercase tracking-wider transition-all hover:shadow-[0_0_20px_rgba(201,164,90,0.25)]"
                        >
                                ← {t('nav.wish')}
                        </a>
                        <button
                                onclick={handleExport}
                                disabled={game.wishHistory.length === 0}
                                class="btn-press px-4 py-2 rounded-md border border-[#24314A] bg-[#0B1020]/60 text-[#B8C1D3] hover:text-[#E6C77A] hover:border-[#C9A45A]/40 text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                title="Download wish history as JSON file"
                        >
                                ⤓ Export
                        </button>
                        <button
                                onclick={handleImportClick}
                                class="btn-press px-4 py-2 rounded-md border border-[#24314A] bg-[#0B1020]/60 text-[#B8C1D3] hover:text-[#E6C77A] hover:border-[#C9A45A]/40 text-xs font-semibold uppercase tracking-wider transition-all"
                                title="Import wish history from JSON file (replaces current)"
                        >
                                ⤒ Import
                        </button>
                        <button
                                onclick={openReset}
                                class="btn-press px-4 py-2 rounded-md border border-[#8B3A3A]/40 bg-[#8B3A3A]/15 text-[#E8745A] text-xs font-semibold uppercase tracking-wider hover:bg-[#8B3A3A]/25 transition-all"
                        >
                                {t('history.btn.reset')}
                        </button>
                </div>
        </section>

        <!-- Hidden file input for import -->
        <input
                type="file"
                accept="application/json,.json"
                onchange={handleFileChange}
                bind:this={fileInput}
                class="hidden"
        />

        <!-- Import/export toast -->
        {#if importToast}
                <div
                        class="fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border shadow-xl text-sm font-semibold {importToast.kind === 'ok'
                                ? 'bg-[#1A2337] border-[#6FAF6E]/50 text-[#6FAF6E]'
                                : 'bg-[#1A2337] border-[#E8745A]/50 text-[#E8745A]'}"
                        in:fly={{ y: -20, duration: 200, easing: cubicOut }}
                >
                        {importToast.kind === 'ok' ? '✓ ' : '✗ '}{importToast.msg}
                </div>
        {/if}

        {#if game.wishHistory.length === 0}
                <!-- Empty state -->
                <div class="bg-[#1A2337]/80 border border-[#C9A45A]/20 rounded-xl p-12 text-center space-y-4" in:fade>
                        <div class="text-6xl text-[#C9A45A]/40">✦</div>
                        <div>
                                <h2 class="font-heading text-xl font-semibold text-[#F2E6D0]">{t('history.empty.title')}</h2>
                                <p class="text-sm text-[#8E97AA] mt-1 max-w-md mx-auto">
                                        {t('history.empty.body')}
                                </p>
                        </div>
                        <a
                                href="/wish"
                                class="btn-press inline-flex items-center gap-2 px-6 py-3 rounded-md border border-[#C9A45A]/50 bg-gradient-to-r from-[#C9A45A] to-[#E6C77A] text-[#0B1020] font-heading font-semibold tracking-wider uppercase text-sm transition-all hover:shadow-[0_0_30px_rgba(230,199,122,0.45)]"
                        >
                                {t('history.empty.cta')}
                        </a>
                </div>
        {:else}
                <!-- ═══ Per-Banner Summary ═══ -->
                <BannerSummary />

                <!-- ═══ Banner Filter ═══ -->
                <section class="space-y-2">
                        <h2 class="font-heading text-sm font-semibold text-[#E6C77A] uppercase tracking-wider">Filter Banner</h2>
                        <div class="flex gap-1 p-1 rounded-lg bg-[#1A2337]/60 border border-[#24314A] overflow-x-auto">
                                {#each bannerTabs as tab}
                                        <button
                                                onclick={() => bannerFilter = tab.key}
                                                class="flex-1 min-w-[90px] px-3 py-2 rounded-md text-xs font-heading font-semibold uppercase tracking-wider transition-all {bannerFilter === tab.key
                                                        ? 'bg-gradient-to-r from-[#C9A45A] to-[#E6C77A] text-[#0B1020] shadow-md'
                                                        : 'text-[#B8C1D3] hover:text-[#F2E6D0] hover:bg-[#24314A]/60'}"
                                        >
                                                <span class="mr-1">{tab.icon}</span>
                                                {tab.label}
                                                <span class="ml-1 font-mono text-[10px] {bannerFilter === tab.key ? 'text-[#0B1020]/70' : 'text-[#8E97AA]'}">({tab.count})</span>
                                        </button>
                                {/each}
                        </div>
                        {#if bannerFilter !== 'all'}
                                {@const activeTab = bannerTabs.find(t => t.key === bannerFilter)}
                                <div class="text-[10px] text-[#8E97AA]">
                                        Menampilkan <span class="font-mono text-[#E6C77A]">{filteredHistory.length}</span> pull dari banner <span class="font-semibold {activeTab?.accent}">{activeTab?.label}</span>. Statistik dan chart di bawah juga difilter.
                                </div>
                        {/if}
                </section>

                <!-- ═══ Stats + Table ═══ -->
                <section class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div class="lg:col-span-1">
                                <LuckStats {stats} />
                        </div>
                        <div class="lg:col-span-2">
                                <WishHistoryTable history={filteredHistory} />
                        </div>
                </section>

                <!-- ═══ Charts ═══ -->
                <section>
                        <h2 class="font-heading text-xl font-semibold text-[#F2E6D0] mb-3">{t('history.section.distribution')}</h2>
                        <LuckChart history={filteredHistory} {stats} />
                </section>

                <!-- ═══ Pity Heatmap ═══ -->
                <section>
                        <PityHeatmap />
                </section>

                <!-- ═══ Luck Comparison (per-banner) ═══ -->
                <section>
                        <LuckComparison />
                </section>

                <!-- ═══ Achievements ═══ -->
                <section>
                        <AchievementTracker />
                </section>
        {/if}

</div>

<!-- Reset confirmation -->
<ThemedModal open={confirmReset} title={t('history.modal.reset.title')} onClose={() => confirmReset = false}>
        <p class="text-sm text-[#B8C1D3] mb-1">
                {t('history.modal.reset.body', { count: game.wishHistory.length })}
        </p>
        <p class="text-xs text-[#8E97AA] mb-4">{t('history.modal.reset.sub')}</p>
        <div class="flex gap-2">
                <button
                        onclick={() => confirmReset = false}
                        class="btn-press flex-1 px-3 py-2 rounded-md border border-[#24314A] bg-[#0B1020]/60 text-[#8E97AA] hover:text-[#B8C1D3] text-sm transition-colors"
                >
                        {t('common.cancel')}
                </button>
                <button
                        onclick={doReset}
                        class="btn-press flex-1 px-3 py-2 rounded-md border border-[#8B3A3A]/60 bg-gradient-to-r from-[#8B3A3A] to-[#E8745A] text-[#0B1020] text-sm font-bold transition-all"
                >
                        {t('history.modal.reset.confirm')}
                </button>
        </div>
</ThemedModal>
