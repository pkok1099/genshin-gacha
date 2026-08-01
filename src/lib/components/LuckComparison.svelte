<script lang="ts">
        // Per-banner luck comparison — shows the luck score for each wish mode
        // (Character Event / Standard / Novice) side by side, with a winner
        // badge on the highest-scoring banner. Helps answer questions like
        // 'am I luckier on the character banner or on standard?'.
        //
        // Reads from the game store's wish history, classifies each pull by
        // bannerId (same logic as the history page filter), and runs
        // calculateLuckStats on each subset. Banners with zero pulls are
        // shown as '—' (no score) so the layout stays consistent.

        import { getGameState, type WishMode, type WishResult } from '$lib/stores/gameState.svelte';
        import { calculateLuckStats, type LuckStats } from '$lib/utils/luckScore';

        const game = getGameState();

        function classifyBanner(bannerId: string): WishMode {
                if (bannerId === 'standard') return 'standard';
                if (bannerId === 'novice') return 'novice';
                return 'character';
        }

        type ModeMeta = {
                mode: WishMode;
                icon: string;
                label: string;
                accent: string;
                accentBg: string;
                barColor: string;
        };

        const MODES: ModeMeta[] = [
                { mode: 'character', icon: '✦', label: 'Char Event', accent: 'text-[#E6C77A]', accentBg: 'border-[#C9A45A]/30 bg-[#C9A45A]/8', barColor: 'from-[#C9A45A] to-[#E6C77A]' },
                { mode: 'standard',  icon: '◈', label: 'Standard',   accent: 'text-[#B8C1D3]', accentBg: 'border-[#B8C1D3]/30 bg-[#B8C1D3]/8', barColor: 'from-[#5E90D6] to-[#B8C1D3]' },
                { mode: 'novice',    icon: '✚', label: 'Novice',     accent: 'text-[#B495F0]', accentBg: 'border-[#8D72C9]/30 bg-[#8D72C9]/8', barColor: 'from-[#8D72C9] to-[#B495F0]' }
        ];

        function statsFor(mode: WishMode): LuckStats | null {
                const subset = game.wishHistory.filter((r) => classifyBanner(r.bannerId) === mode);
                if (subset.length === 0) return null;
                return calculateLuckStats(subset);
        }

        let modeStats = $derived(
                MODES.map((m) => ({
                        meta: m,
                        stats: statsFor(m.mode)
                }))
        );

        // Winner = highest luckScore among banners that have stats.
        // Ties: first one wins (rare in practice).
        function computeWinner(): { meta: ModeMeta; stats: LuckStats | null } | null {
                const candidates = modeStats.filter((ms) => ms.stats !== null && ms.stats.totalWishes > 0);
                if (candidates.length === 0) return null;
                return candidates.reduce((best, cur) =>
                        (cur.stats!.luckScore > best.stats!.luckScore) ? cur : best
                );
        }
        let winner = $derived(computeWinner());

        function scoreColor(score: number): string {
                if (score >= 90) return 'text-[#E6C77A]';
                if (score >= 75) return 'text-[#C9A45A]';
                if (score >= 60) return 'text-[#B495F0]';
                if (score >= 40) return 'text-[#B8C1D3]';
                return 'text-[#E8745A]';
        }

        function scoreBarColor(score: number): string {
                if (score >= 75) return 'bg-gradient-to-r from-[#C9A45A] to-[#E6C77A]';
                if (score >= 60) return 'bg-gradient-to-r from-[#8D72C9] to-[#B495F0]';
                if (score >= 40) return 'bg-gradient-to-r from-[#5E90D6] to-[#7DCBE0]';
                return 'bg-gradient-to-r from-[#8B3A3A] to-[#E8745A]';
        }
</script>

<div class="bg-[#1A2337]/80 backdrop-blur-sm rounded-xl border border-[#C9A45A]/20 shadow-xl p-5 space-y-4">
        <div class="flex items-center justify-between">
                <h3 class="font-heading text-sm font-semibold text-[#F2E6D0] uppercase tracking-wider">
                        <span class="text-[#E6C77A]">⚔</span> Luck Comparison
                </h3>
                {#if winner}
                        <div class="text-right">
                                <div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">Luckiest Banner</div>
                                <div class="text-xs font-bold {winner.meta.accent} uppercase tracking-wider">
                                        {winner.meta.icon} {winner.meta.label}
                                </div>
                        </div>
                {/if}
        </div>

        <div class="space-y-3">
                {#each modeStats as ms}
                        {@const m = ms.meta}
                        {@const s = ms.stats}
                        {@const isWinner = winner !== null && winner.meta.mode === m.mode && s !== null}
                        <div class="rounded-lg border p-3 space-y-2 {m.accentBg} {isWinner ? 'ring-2 ring-[#E6C77A]/50' : ''}">
                                <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-2">
                                                <span class="text-sm {m.accent}">{m.icon}</span>
                                                <span class="text-xs font-heading font-bold {m.accent} uppercase tracking-wider">{m.label}</span>
                                                {#if isWinner}
                                                        <span class="text-[8px] px-1.5 py-0.5 rounded bg-[#E6C77A] text-[#0B1020] font-bold uppercase tracking-wider">★ WINNER</span>
                                                {/if}
                                        </div>
                                        {#if s}
                                                <span class="text-[10px] font-mono text-[#8E97AA]">{s.totalWishes} pulls</span>
                                        {/if}
                                </div>

                                {#if s}
                                        <!-- Luck Score -->
                                        <div class="flex items-center gap-3">
                                                <div class="font-mono text-3xl font-bold tabular-nums {scoreColor(s.luckScore)} w-16 text-center">
                                                        {s.luckScore}
                                                </div>
                                                <div class="flex-1">
                                                        <div class="text-[10px] {scoreColor(s.luckScore)} font-bold uppercase tracking-wider mb-1">
                                                                {s.luckLabel}
                                                        </div>
                                                        <div class="h-2 bg-[#0B1020] rounded-full overflow-hidden border border-[#24314A]/60">
                                                                <div class="h-full {scoreBarColor(s.luckScore)} rounded-full transition-all duration-500" style="width: {s.luckScore}%"></div>
                                                        </div>
                                                </div>
                                        </div>

                                        <!-- Mini stats row -->
                                        <div class="grid grid-cols-3 gap-2 pt-1 border-t border-[#24314A]/40">
                                                <div class="text-center">
                                                        <div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">5★ Rate</div>
                                                        <div class="font-mono text-xs font-bold text-[#E6C77A] tabular-nums">{s.actual5StarRate.toFixed(1)}%</div>
                                                </div>
                                                <div class="text-center">
                                                        <div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">Avg/Pity</div>
                                                        <div class="font-mono text-xs font-bold text-[#F2E6D0] tabular-nums">
                                                                {s.count5 > 0 ? s.averagePityPer5Star.toFixed(0) : '—'}
                                                        </div>
                                                </div>
                                                <div class="text-center">
                                                        <div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">50/50</div>
                                                        <div class="font-mono text-xs font-bold {s.wins5050 + s.losses5050 > 0 ? 'text-[#B495F0]' : 'text-[#5E6478]'} tabular-nums">
                                                                {s.wins5050 + s.losses5050 > 0 ? `${Math.round(s.winRate5050 * 100)}%` : '—'}
                                                        </div>
                                                </div>
                                        </div>
                                {:else}
                                        <div class="text-center py-3 text-[#5E6478] italic text-xs">
                                                No pulls on this banner yet
                                        </div>
                                {/if}
                        </div>
                {/each}
        </div>

        <div class="text-[10px] text-[#8E97AA] pt-2 border-t border-[#24314A] leading-relaxed">
                Luck score mempertimbangkan 5★ rate, rata-rata pity per 5★, win rate 50/50, dan volume pull. Banner dengan pull di bawah 10 tidak akan memiliki score yang akurat.
        </div>
</div>
