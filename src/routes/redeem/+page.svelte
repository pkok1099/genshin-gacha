<script lang="ts">
        import { onMount } from 'svelte';
        import { fetchRedeemCodes, type RedeemCode } from '$lib/services/redeemApi';
        import { getGameState } from '$lib/stores/gameState.svelte';
        import RedeemCard from '$lib/components/RedeemCard.svelte';
        import ThemedInput from '$lib/components/ThemedInput.svelte';
        import ThemedModal from '$lib/components/ThemedModal.svelte';
        import { fade, fly } from 'svelte/transition';
        import { cubicOut } from 'svelte/easing';
        import { t, localeKey } from '$lib/i18n/index.svelte';
        import { playSuccess, playTick } from '$lib/audio/synth.svelte';
        import { toast } from '$lib/stores/toast.svelte';

        // Re-render on locale change
        void localeKey();

        const game = getGameState();

        let codes: RedeemCode[] = $state([]);
        let isLoading = $state(false);
        let apiError = $state('');
        let manualCode = $state('');
        let manualPrimo = $state<number | null>(null);
        let showManualModal = $state(false);
        let copiedManual = $state(false);
        let lastRedeemedAmount = $state<number | null>(null);
        let lastRedeemedAt = $state(0);

        onMount(() => {
                loadCodes();
        });

        async function loadCodes() {
                isLoading = true;
                apiError = '';
                try {
                        codes = await fetchRedeemCodes();
                } catch (err) {
                        console.error('[redeem] fetch failed:', err);
                        apiError = err instanceof Error ? err.message : 'Unknown error';
                } finally {
                        isLoading = false;
                }
        }

        function handleRedeem(code: RedeemCode, primoAmount: number) {
                // Dedup: if this code was already redeemed, don't add primogems again.
                if (game.isRedeemed(code.code)) {
                        toast.info('Already Claimed', `Code ${code.code} sudah pernah diklaim.`);
                        return;
                }
                if (primoAmount > 0) {
                        game.addPrimogem(primoAmount);
                        game.markRedeemed(code.code);
                        lastRedeemedAmount = primoAmount;
                        lastRedeemedAt = Date.now();
                        playSuccess();
                }
        }

        async function copyManual() {
                if (!manualCode.trim()) return;
                try {
                        await navigator.clipboard.writeText(manualCode.trim());
                        copiedManual = true;
                        setTimeout(() => { copiedManual = false; }, 1500);
                        playTick();
                } catch {
                        // ignore
                }
        }

        function submitManual() {
                const code = manualCode.trim();
                if (!code) return;
                manualPrimo = 0;
                showManualModal = true;
                playTick();
        }

        function confirmManualRedeem() {
                if (manualPrimo !== null && manualPrimo > 0) {
                        // Cap at 99,999,999 to prevent absurd values from
                        // hand-typed input (e.g. 999999999 would break the
                        // primogem display and skew all per-pull calculations).
                        const capped = Math.min(99_999_999, manualPrimo);
                        game.addPrimogem(capped);
                        lastRedeemedAmount = capped;
                        lastRedeemedAt = Date.now();
                        playSuccess();
                        if (capped !== manualPrimo) {
                                toast.warning('Capped', `Primogem capped to 99,999,999 (you entered ${manualPrimo.toLocaleString('en-US')}).`);
                        }
                }
                showManualModal = false;
                manualCode = '';
                manualPrimo = null;
        }

        let activeCodes = $derived(codes.filter((c) => !c.isExpired));
        let expiredCodes = $derived(codes.filter((c) => c.isExpired));
</script>

<svelte:head>
        <title>{t('redeem.title')} — Genshin Impact Simulator</title>
        <meta name="description" content="Cek kode redeem Genshin Impact yang aktif dan klaim hadiah primogem kamu." />
        <meta property="og:title" content="{t('redeem.title')} — Genshin Impact Simulator" />
        <meta property="og:description" content="Cek kode redeem Genshin Impact yang aktif dan klaim hadiah primogem kamu." />
        <meta name="twitter:title" content="{t('redeem.title')} — Genshin Impact Simulator" />
        <meta property="og:image" content="https://xiaoxiaohui.my.id/screenshot.png" />
        <meta property="og:image:alt" content="Genshin Impact Wish Simulator" />
        <meta name="twitter:image" content="https://xiaoxiaohui.my.id/screenshot.png" />
</svelte:head>

<div class="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 space-y-6">

        <!-- ═══ Header ═══ -->
        <section class="space-y-2">
                <h1 class="font-heading text-3xl md:text-4xl font-bold text-[#F2E6D0]">{t('redeem.title')}</h1>
                <p class="text-sm text-[#B8C1D3] max-w-2xl">{t('redeem.subtitle')}</p>
        </section>

        <!-- ═══ Last redeemed toast ═══ -->
        {#if lastRedeemedAmount !== null && Date.now() - lastRedeemedAt < 5000}
                <div class="bg-[#6FAF6E]/15 border border-[#6FAF6E]/40 text-[#6FAF6E] px-4 py-3 rounded-md text-sm flex items-center gap-3" in:fly={{ y: -10, duration: 200, easing: cubicOut }} out:fade>
                        <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{t('redeem.toast.success', { amount: lastRedeemedAmount.toLocaleString('en-US') })}</span>
                </div>
        {/if}

        <!-- ═══ Manual Input ═══ -->
        <section class="bg-[#1A2337]/80 backdrop-blur-sm rounded-xl border border-[#C9A45A]/25 shadow-xl p-5 space-y-3">
                <h2 class="font-heading text-sm font-semibold text-[#E6C77A] uppercase tracking-wider">{t('redeem.section.manual')}</h2>
                <p class="text-xs text-[#8E97AA]">{t('redeem.manual.desc')}</p>
                <div class="flex gap-2">
                        <div class="flex-1">
                                <ThemedInput
                                        value={manualCode}
                                        placeholder={t('redeem.manual.placeholder')}
                                        oninput={(e) => { manualCode = (e.currentTarget as HTMLInputElement).value; }}
                                        onkeydown={(e) => { if (e.key === 'Enter') submitManual(); }}
                                />
                        </div>
                        <button
                                onclick={copyManual}
                                disabled={!manualCode.trim()}
                                class="btn-press px-3 py-2 rounded-md border border-[#24314A] bg-[#0B1020]/60 text-[#B8C1D3] hover:text-[#F2E6D0] text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                                {copiedManual ? '✓' : t('common.copy')}
                        </button>
                        <button
                                onclick={submitManual}
                                disabled={!manualCode.trim()}
                                class="btn-press px-4 py-2 rounded-md border border-[#C9A45A]/50 bg-gradient-to-r from-[#C9A45A] to-[#E6C77A] text-[#0B1020] text-sm font-semibold transition-all hover:shadow-[0_0_20px_rgba(230,199,122,0.4)] disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                                {t('nav.redeem')}
                        </button>
                </div>
        </section>

        <!-- ═══ Active Codes ═══ -->
        <section class="space-y-3">
                <div class="flex justify-between items-center">
                        <h2 class="font-heading text-sm font-semibold text-[#F2E6D0] uppercase tracking-wider">
                                {t('redeem.section.active')}
                                {#if activeCodes.length > 0}
                                        <span class="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-[#6FAF6E]/20 text-[#6FAF6E] border border-[#6FAF6E]/40 font-mono">{activeCodes.length}</span>
                                {/if}
                        </h2>
                        <button
                                onclick={loadCodes}
                                class="btn-press text-[10px] text-[#8E97AA] hover:text-[#E6C77A] transition-colors flex items-center gap-1"
                                disabled={isLoading}
                        >
                                <svg class="w-3 h-3 {isLoading ? 'animate-spin' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                {t('common.refresh')}
                        </button>
                </div>

                {#if isLoading && codes.length === 0}
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {#each [0, 1] as _}
                                        <div class="bg-[#1A2337] p-4 rounded-lg border border-[#24314A] animate-pulse h-32"></div>
                                {/each}
                        </div>
                {:else if apiError && codes.length === 0}
                        <div class="bg-[#8B3A3A]/15 border border-[#8B3A3A]/40 text-[#E8745A] px-4 py-3 rounded-md text-sm" in:fade>
                                {t('redeem.error', { error: apiError })}
                        </div>
                {:else if activeCodes.length === 0}
                        <div class="bg-[#1A2337]/60 border border-[#24314A] rounded-lg p-8 text-center text-[#8E97AA] text-sm" in:fade>
                                {t('redeem.empty')}
                        </div>
                {:else}
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {#each activeCodes as code (code.code)}
                                        <RedeemCard {code} onRedeem={handleRedeem} />
                                {/each}
                        </div>
                {/if}
        </section>

        <!-- ═══ Expired Codes ═══ -->
        {#if expiredCodes.length > 0}
                <section class="space-y-3 pt-4 border-t border-[#24314A]">
                        <h2 class="font-heading text-sm font-semibold text-[#5E6478] uppercase tracking-wider">{t('redeem.section.expired')} ({expiredCodes.length})</h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 opacity-60">
                                {#each expiredCodes as code (code.code)}
                                        <RedeemCard {code} onRedeem={handleRedeem} />
                                {/each}
                        </div>
                </section>
        {/if}

</div>

<!-- Manual redeem confirmation modal -->
<ThemedModal open={showManualModal} title={t('redeem.modal.manual-title')} onClose={() => showManualModal = false}>
        <div class="text-center mb-4">
                <div class="inline-flex w-12 h-12 items-center justify-center rounded-full bg-gradient-to-br from-[#E6C77A] to-[#C9A45A] text-[#0B1020] text-xl font-bold mb-3 shadow-lg">★</div>
                <p class="text-sm text-[#B8C1D3] mt-2">{t('redeem.modal.manual-body')}</p>
        </div>
        <ThemedInput
                type="number"
                min={0}
                step={160}
                value={String(manualPrimo ?? 0)}
                placeholder="0"
                oninput={(e) => { manualPrimo = Math.max(0, parseInt((e.currentTarget as HTMLInputElement).value, 10) || 0); }}
        />
        <div class="flex gap-2 mt-4">
                <button
                        onclick={() => showManualModal = false}
                        class="btn-press flex-1 px-3 py-2 rounded-md border border-[#24314A] bg-[#0B1020]/60 text-[#8E97AA] hover:text-[#B8C1D3] text-sm transition-colors"
                >
                        {t('common.cancel')}
                </button>
                <button
                        onclick={confirmManualRedeem}
                        class="btn-press flex-1 px-3 py-2 rounded-md border border-[#C9A45A]/50 bg-gradient-to-r from-[#C9A45A] to-[#E6C77A] text-[#0B1020] text-sm font-bold transition-all"
                >
                        {manualPrimo && manualPrimo > 0 ? t('redeem.modal.btn', { amount: manualPrimo }) : t('common.confirm')}
                </button>
        </div>
</ThemedModal>
