<script lang="ts">
        // Compact what-if simulator — answers the question 'berapa primogem
        // yang aku butuhkan untuk reach target pity / hard pity / featured 5★?'
        // based on the ACTIVE banner's current pity + guaranteed state.
        //
        // Sits on the wish page next to the PityBar so users see the answer
        // without navigating to /calculator. Reads from the game store so it
        // stays reactive after every pull.

        import { getGameState } from '$lib/stores/gameState.svelte';
        import { bestWorstCase, expectedPullsPer5Star, expectedPullsPerFeatured } from '$lib/utils/pityCalculator';
        import { t, localeKey } from '$lib/i18n/index.svelte';

        // Re-render on locale change
        void localeKey();

        const game = getGameState();

        const HARD_PITY = 90;
        const SOFT_PITY = 74;
        const COST_PER_PULL = 160;

        // Read active-mode pity reactively (these getters already track the
        // active mode's pity5/pity4/guaranteed5).
        let pity5 = $derived(game.pity5);
        let guaranteed5 = $derived(game.guaranteed5);
        let primogem = $derived(game.primogem);

        // ── Pulls remaining to key milestones ──────────────────────────────
        let pullsToSoftPity = $derived(Math.max(0, SOFT_PITY - pity5));
        let pullsToHardPity = $derived(Math.max(1, HARD_PITY - pity5));

        // Expected pulls to next 5★ (statistical, accounts for soft pity curve)
        let expPullsTo5Star = $derived(Math.max(1, Math.round(expectedPullsPer5Star(pity5))));
        let expPullsToFeatured = $derived(Math.max(1, Math.round(expectedPullsPerFeatured(pity5, guaranteed5))));

        // Best/worst case pulls to featured
        let bwCase = $derived(bestWorstCase(pity5, guaranteed5));

        // ── Primogem math ──────────────────────────────────────────────────
        function primoFor(pulls: number): number {
                return pulls * COST_PER_PULL;
        }

        let primoToSoftPity = $derived(primoFor(pullsToSoftPity));
        let primoToHardPity = $derived(primoFor(pullsToHardPity));
        let primoExpTo5Star = $derived(primoFor(expPullsTo5Star));
        let primoExpToFeatured = $derived(primoFor(expPullsToFeatured));
        let primoBestCase = $derived(primoFor(bwCase.bestCase));
        let primoWorstCase = $derived(primoFor(bwCase.worstCase));

        // ── Affordability ──────────────────────────────────────────────────
        // Can the user already afford the worst-case path to featured?
        let canAffordWorstCase = $derived(primogem >= primoWorstCase);
        let primoShortfall = $derived(Math.max(0, primoWorstCase - primogem));

        // How many pulls can the user afford right now?
        let affordablePulls = $derived(Math.floor(primogem / COST_PER_PULL));
        let affordableTenPulls = $derived(Math.floor(primogem / (COST_PER_PULL * 10)));

        // ── Milestone probabilities ────────────────────────────────────────
        // Probability of getting 5★ within the next N pulls (where N = affordable pulls)
        // Using the simple soft-pity curve approximation from pityCalculator.
        function prob5StarWithin(pulls: number): number {
                // Simple model: each pull has base 0.6% rate, +6% per pull above 74.
                // P(at least one 5★ in N pulls) = 1 - ∏(1 - p_i)
                let pNoFive = 1;
                for (let i = 0; i < pulls; i++) {
                        const pity = pity5 + i;
                        let rate = 0.006;
                        if (pity >= SOFT_PITY) {
                                rate += (pity - SOFT_PITY + 1) * 0.06;
                        }
                        rate = Math.min(rate, 1);
                        pNoFive *= (1 - rate);
                        // Short-circuit: once pNoFive hits 0, the result is locked
                        // at 1.0 (guaranteed). Continuing the loop is wasted work
                        // for users with large primogem balances (625+ pulls).
                        if (pNoFive === 0) break;
                }
                return 1 - pNoFive;
        }

        let probWithAffordable = $derived(
                affordablePulls > 0 ? prob5StarWithin(affordablePulls) : 0
        );

        function fmtPct(p: number): string {
                return (p * 100).toFixed(1) + '%';
        }

        function fmtPrimo(n: number): string {
                return n.toLocaleString('en-US');
        }
</script>

<div class="bg-[#1A2337]/80 backdrop-blur-sm p-4 rounded-xl border border-[#C9A45A]/20 shadow-xl space-y-3">
        <div class="flex items-center justify-between">
                <h3 class="font-heading text-xs font-semibold text-[#F2E6D0] uppercase tracking-wider">
                        <span class="text-[#E6C77A]">⌖</span> {t('whatif.title')}
                </h3>
                <a href="/calculator" class="text-[10px] text-[#C9A45A] hover:text-[#E6C77A] uppercase tracking-wider transition-colors">
                        {t('whatif.full-link')}
                </a>
        </div>

        <!-- Current state summary -->
        <div class="grid grid-cols-3 gap-2 text-center">
                <div class="bg-[#0B1020]/40 rounded-md p-2">
                        <div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">{t('whatif.current-pity')}</div>
                        <div class="font-mono text-sm font-bold text-[#E6C77A] tabular-nums">{pity5}/90</div>
                </div>
                <div class="bg-[#0B1020]/40 rounded-md p-2">
                        <div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">{t('whatif.primogem')}</div>
                        <div class="font-mono text-sm font-bold text-[#E6C77A] tabular-nums">{fmtPrimo(primogem)}</div>
                </div>
                <div class="bg-[#0B1020]/40 rounded-md p-2">
                        <div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">{t('whatif.guaranteed')}</div>
                        <div class="font-mono text-sm font-bold {guaranteed5 ? 'text-[#E6C77A]' : 'text-[#5E6478]'}">
                                {guaranteed5 ? t('whatif.yes') : t('whatif.no')}
                        </div>
                </div>
        </div>

        <!-- Pulls to milestones -->
        <div class="space-y-1.5 pt-2 border-t border-[#24314A]">
                <div class="text-[10px] text-[#8E97AA] uppercase tracking-wider mb-1">{t('whatif.milestones')}</div>

                <div class="flex items-center justify-between text-xs">
                        <span class="text-[#B8C1D3]">{t('whatif.to-soft-pity')}</span>
                        <span class="font-mono font-bold {pullsToSoftPity === 0 ? 'text-[#E8745A]' : 'text-[#E0B25A]'}">
                                {pullsToSoftPity === 0 ? t('whatif.at-soft') : `${pullsToSoftPity} ${t('whatif.pulls')} · ★ ${fmtPrimo(primoToSoftPity)}`}
                        </span>
                </div>

                <div class="flex items-center justify-between text-xs">
                        <span class="text-[#B8C1D3]">{t('whatif.to-hard-pity')}</span>
                        <span class="font-mono font-bold text-[#E8745A]">
                                {pullsToHardPity} {t('whatif.pulls')} · ★ {fmtPrimo(primoToHardPity)}
                        </span>
                </div>

                <div class="flex items-center justify-between text-xs">
                        <span class="text-[#B8C1D3]">{t('whatif.expected-5star')} <span class="text-[#5E6478]">{t('whatif.avg')}</span></span>
                        <span class="font-mono font-bold text-[#F2E6D0]">
                                {expPullsTo5Star} {t('whatif.pulls')} · ★ {fmtPrimo(primoExpTo5Star)}
                        </span>
                </div>

                <div class="flex items-center justify-between text-xs">
                        <span class="text-[#B8C1D3]">{t('whatif.expected-featured')} <span class="text-[#5E6478]">{t('whatif.avg')}</span></span>
                        <span class="font-mono font-bold text-[#E6C77A]">
                                {expPullsToFeatured} {t('whatif.pulls')} · ★ {fmtPrimo(primoExpToFeatured)}
                        </span>
                </div>
        </div>

        <!-- Best/Worst case to featured -->
        <div class="grid grid-cols-2 gap-2 pt-2 border-t border-[#24314A]">
                <div class="text-center p-2 rounded-md bg-[#6FAF6E]/10 border border-[#6FAF6E]/30">
                        <div class="text-[9px] text-[#6FAF6E] uppercase tracking-wider">{t('whatif.best-case')}</div>
                        <div class="font-mono text-sm font-bold text-[#6FAF6E] tabular-nums">{bwCase.bestCase} {t('whatif.pulls')}</div>
                        <div class="text-[9px] text-[#8E97AA] font-mono">★ {fmtPrimo(primoBestCase)}</div>
                </div>
                <div class="text-center p-2 rounded-md bg-[#8B3A3A]/15 border border-[#8B3A3A]/40">
                        <div class="text-[9px] text-[#E8745A] uppercase tracking-wider">{t('whatif.worst-case')}</div>
                        <div class="font-mono text-sm font-bold text-[#E8745A] tabular-nums">{bwCase.worstCase} {t('whatif.pulls')}</div>
                        <div class="text-[9px] text-[#8E97AA] font-mono">★ {fmtPrimo(primoWorstCase)}</div>
                </div>
        </div>

        <!-- Affordability verdict -->
        <div class="pt-2 border-t border-[#24314A] space-y-2">
                {#if canAffordWorstCase}
                        <div class="text-center p-2.5 rounded-md bg-[#6FAF6E]/15 border border-[#6FAF6E]/40">
                                <div class="text-xs font-bold text-[#6FAF6E] uppercase tracking-wider">
                                        {t('whatif.afford-yes')}
                                </div>
                                <div class="text-[10px] text-[#B8C1D3] mt-0.5">
                                        {t('whatif.afford-yes-desc')}
                                </div>
                        </div>
                {:else}
                        <div class="text-center p-2.5 rounded-md bg-[#E0B25A]/10 border border-[#E0B25A]/30">
                                <div class="text-xs font-bold text-[#E0B25A] uppercase tracking-wider">
                                        {t('whatif.afford-no')} ★ {fmtPrimo(primoShortfall)}
                                </div>
                                <div class="text-[10px] text-[#B8C1D3] mt-0.5">
                                        {t('whatif.afford-no-desc')}
                                </div>
                        </div>
                {/if}

                <!-- Probability with current primogem -->
                {#if affordablePulls > 0}
                        <div class="p-2 rounded-md bg-[#0B1020]/40 border border-[#24314A]">
                                <div class="flex items-center justify-between text-xs mb-1">
                                        <span class="text-[#B8C1D3]">{t('whatif.with-primogem')}</span>
                                        <span class="font-mono font-bold text-[#F2E6D0]">{affordablePulls} {t('whatif.pulls')} ({affordableTenPulls}× 10-pull)</span>
                                </div>
                                <div class="flex items-center gap-2">
                                        <span class="text-[10px] text-[#8E97AA] uppercase tracking-wider shrink-0">{t('whatif.prob-5star')}</span>
                                        <div class="flex-1 h-1.5 bg-[#0B1020] rounded-full overflow-hidden border border-[#24314A]/60">
                                                <div
                                                        class="h-full rounded-full transition-all duration-500"
                                                        style="width: {Math.min(probWithAffordable * 100, 100)}%; background: linear-gradient(to right, #C9A45A, #E6C77A)"
                                                ></div>
                                        </div>
                                        <span class="font-mono text-[10px] font-bold text-[#E6C77A] tabular-nums w-12 text-right">{fmtPct(probWithAffordable)}</span>
                                </div>
                        </div>
                {/if}
        </div>

        <div class="text-[9px] text-[#8E97AA] pt-1 border-t border-[#24314A] leading-relaxed">
                {t('whatif.footer')}
        </div>
</div>
