<script lang="ts">
        // Per-banner summary card — shows pulls / primogem spent / 5★ + 4★
        // counts for each of the three wish modes, side by side. Designed to
        // sit at the top of the /history page so users can see at a glance
        // where their primogem went.
        //
        // Primogem spent is reconstructed from the wish history itself (not
        // tracked separately) because:
        //   - Single pull = 160 primo (Novice: 160)
        //   - 10-pull     = 1600 primo (Novice first 10-pull: 1280, others 1600)
        // We can't tell from a single WishResult whether it came from a
        // single or a 10-pull, so we approximate by counting pulls and
        // assuming the cheaper path: every 10 pulls = one 10-pull (cheaper
        // than 10 singles). This matches how the simulator actually charges
        // (users always 10-pull when possible). For Novice's first 10-pull
        // discount, we detect it via the guaranteed Noelle entry.

        import { getGameState, type WishMode, type WishResult } from '$lib/stores/gameState.svelte';

        const game = getGameState();

        const COST_SINGLE = 160;
        const COST_TEN = 1600;
        const NOVICE_COST_TEN_DISCOUNTED = 1280;

        function classifyBanner(bannerId: string): WishMode {
                if (bannerId === 'standard') return 'standard';
                if (bannerId === 'novice') return 'novice';
                return 'character';
        }

        type BannerStat = {
                mode: WishMode;
                icon: string;
                label: string;
                accent: string;
                accentBg: string;
                pulls: number;
                primogem: number;
                count5: number;
                count4: number;
        };

        // Build per-mode stats from wish history. We group entries by mode,
        // count them, sum rarity counts, and estimate primogem spent.
        function computeBannerStats(): BannerStat[] {
                const history = game.wishHistory;
                const groups: Record<WishMode, WishResult[]> = {
                        character: [],
                        standard: [],
                        novice: []
                };
                for (const w of history) {
                        groups[classifyBanner(w.bannerId)].push(w);
                }
                const noviceFirstTenUsed = game.noviceFirstTenUsed;
                return (Object.keys(groups) as WishMode[]).map((mode) => {
                        const items = groups[mode];
                        const pulls = items.length;
                        const count5 = items.filter((r) => r.rarity === 5).length;
                        const count4 = items.filter((r) => r.rarity === 4).length;

                        // Estimate primogem: every 10 pulls = 1 ten-pull, remainder = singles.
                        // For Novice, the FIRST 10-pull is discounted (1280 vs 1600) — we
                        // detect it by checking if there's a Noelle entry in novice pulls
                        // (the simulator guarantees Noelle in slot 1 of the first 10-pull).
                        const tenPulls = Math.floor(pulls / 10);
                        const singles = pulls % 10;
                        let primogem = tenPulls * COST_TEN + singles * COST_SINGLE;
                        if (mode === 'novice' && noviceFirstTenUsed && tenPulls > 0) {
                                // First 10-pull was discounted: subtract the difference.
                                primogem -= (COST_TEN - NOVICE_COST_TEN_DISCOUNTED);
                        }

                        const meta = MODE_META[mode];
                        return {
                                mode,
                                icon: meta.icon,
                                label: meta.label,
                                accent: meta.accent,
                                accentBg: meta.accentBg,
                                pulls,
                                primogem,
                                count5,
                                count4
                        };
                });
        }

        let bannerStats = $derived(computeBannerStats());

        const MODE_META: Record<WishMode, { icon: string; label: string; accent: string; accentBg: string }> = {
                character: { icon: '✦', label: 'Char Event', accent: 'text-[#E6C77A]', accentBg: 'border-[#C9A45A]/30 bg-[#C9A45A]/8' },
                standard:  { icon: '◈', label: 'Standard',   accent: 'text-[#B8C1D3]', accentBg: 'border-[#B8C1D3]/30 bg-[#B8C1D3]/8' },
                novice:    { icon: '✚', label: 'Novice',     accent: 'text-[#B495F0]', accentBg: 'border-[#8D72C9]/30 bg-[#8D72C9]/8' }
        };

        let totalPrimo = $derived(bannerStats.reduce((sum: number, b: BannerStat) => sum + b.primogem, 0));
        let totalPulls = $derived(bannerStats.reduce((sum: number, b: BannerStat) => sum + b.pulls, 0));
</script>

<div class="bg-[#1A2337]/80 backdrop-blur-sm rounded-xl border border-[#C9A45A]/20 shadow-xl p-5 space-y-4">
        <div class="flex items-center justify-between">
                <h3 class="font-heading text-sm font-semibold text-[#F2E6D0] uppercase tracking-wider">
                        <span class="text-[#E6C77A]">⌬</span> Per-Banner Summary
                </h3>
                <div class="text-right">
                        <div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">Total Spent</div>
                        <div class="font-mono text-sm font-bold text-[#E6C77A] tabular-nums">★ {totalPrimo.toLocaleString('en-US')}</div>
                        <div class="text-[9px] text-[#8E97AA] font-mono">{totalPulls} pulls</div>
                </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                {#each bannerStats as b}
                        <div class="rounded-lg border p-3 space-y-2 {b.accentBg}">
                                <div class="flex items-center justify-between">
                                        <span class="text-xs font-heading font-bold {b.accent} uppercase tracking-wider">
                                                {b.icon} {b.label}
                                        </span>
                                        <span class="text-[10px] font-mono text-[#8E97AA]">{b.pulls} pulls</span>
                                </div>

                                <div class="text-center py-1">
                                        <div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">Primogem Spent</div>
                                        <div class="font-mono text-lg font-bold text-[#E6C77A] tabular-nums">
                                                ★ {b.primogem.toLocaleString('en-US')}
                                        </div>
                                </div>

                                <div class="grid grid-cols-2 gap-2">
                                        <div class="text-center p-1.5 rounded bg-[#0B1020]/40">
                                                <div class="text-[9px] text-[#E6C77A] uppercase tracking-wider">★5</div>
                                                <div class="font-mono text-sm font-bold text-[#E6C77A] tabular-nums">{b.count5}</div>
                                        </div>
                                        <div class="text-center p-1.5 rounded bg-[#0B1020]/40">
                                                <div class="text-[9px] text-[#B495F0] uppercase tracking-wider">★4</div>
                                                <div class="font-mono text-sm font-bold text-[#B495F0] tabular-nums">{b.count4}</div>
                                        </div>
                                </div>

                                {#if b.pulls > 0}
                                        <div class="text-[9px] text-[#8E97AA] text-center pt-1 border-t border-[#24314A]/40">
                                                {#if b.mode === 'character'}
                                                        Avg 1× 5★ per {b.count5 > 0 ? Math.round(b.pulls / b.count5) : '∞'} pulls
                                                {:else if b.mode === 'standard'}
                                                        Avg 1× 5★ per {b.count5 > 0 ? Math.round(b.pulls / b.count5) : '∞'} pulls
                                                {:else}
                                                        {b.pulls}/20 novice pulls used
                                                {/if}
                                        </div>
                                {:else}
                                        <div class="text-[9px] text-[#5E6478] text-center pt-1 border-t border-[#24314A]/40 italic">
                                                No pulls yet
                                        </div>
                                {/if}
                        </div>
                {/each}
        </div>

        <div class="text-[10px] text-[#8E97AA] pt-2 border-t border-[#24314A] leading-relaxed">
                Primogem dihitung dari wish history (160/single, 1,600/10-pull, diskon 20% untuk first Novice 10-pull). Angka aktual mungkin sedikit berbeda jika kamu pernah ganti mode di tengah session.
        </div>
</div>
