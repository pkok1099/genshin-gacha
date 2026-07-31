<script lang="ts">
        import { getGameState } from '$lib/stores/gameState.svelte';
        import { calculateLuckStats } from '$lib/utils/luckScore';
        import WishHistoryTable from '$lib/components/WishHistoryTable.svelte';
        import LuckStats from '$lib/components/LuckStats.svelte';
        import LuckChart from '$lib/components/LuckChart.svelte';
        import ThemedModal from '$lib/components/ThemedModal.svelte';
        import { fade } from 'svelte/transition';
        import { t, localeKey } from '$lib/i18n/index.svelte';
        import { playTick, playError } from '$lib/audio/synth.svelte';

        // Re-render on locale change
        void localeKey();

        const game = getGameState();

        let stats = $derived(calculateLuckStats(game.wishHistory));

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
                <div class="flex gap-2">
                        <a
                                href="/wish"
                                class="btn-press px-4 py-2 rounded-md border border-[#C9A45A]/40 bg-gradient-to-r from-[#24314A] to-[#1A2337] text-[#E6C77A] text-xs font-semibold uppercase tracking-wider transition-all hover:shadow-[0_0_20px_rgba(201,164,90,0.25)]"
                        >
                                ← {t('nav.wish')}
                        </a>
                        <button
                                onclick={openReset}
                                class="btn-press px-4 py-2 rounded-md border border-[#8B3A3A]/40 bg-[#8B3A3A]/15 text-[#E8745A] text-xs font-semibold uppercase tracking-wider hover:bg-[#8B3A3A]/25 transition-all"
                        >
                                {t('history.btn.reset')}
                        </button>
                </div>
        </section>

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
                <!-- ═══ Stats + Table ═══ -->
                <section class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div class="lg:col-span-1">
                                <LuckStats {stats} />
                        </div>
                        <div class="lg:col-span-2">
                                <WishHistoryTable history={game.wishHistory} />
                        </div>
                </section>

                <!-- ═══ Charts ═══ -->
                <section>
                        <h2 class="font-heading text-xl font-semibold text-[#F2E6D0] mb-3">{t('history.section.distribution')}</h2>
                        <LuckChart history={game.wishHistory} {stats} />
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
