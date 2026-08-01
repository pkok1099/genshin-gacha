<script lang="ts">
        // Pity Heatmap — visualizes WHERE on the pity curve 5★ drops actually
        // happened. Each bar represents a pity bucket (0-9, 10-19, …, 80-89).
        // Taller bars = more 5★s dropped at that pity range.
        //
        // This answers questions like 'am I getting most of my 5★s early
        // (lucky) or do I always go to hard pity?' at a glance. Also shows
        // the theoretical soft-pity curve overlaid for comparison.
        //
        // Reads from wish history (5★ entries only, using their pityCount).

        import { getGameState, type WishMode, type WishResult } from '$lib/stores/gameState.svelte';

        const game = getGameState();

        function classifyBanner(bannerId: string): WishMode {
                if (bannerId === 'standard') return 'standard';
                if (bannerId === 'novice') return 'novice';
                return 'character';
        }

        // ── Build pity buckets from 5★ entries ─────────────────────────────
        // We split 0-89 into 9 buckets of 10 pulls each. pityCount of 90
        // (hard pity) goes into the last bucket (80-89+).
        const BUCKET_SIZE = 10;
        const NUM_BUCKETS = 9;  // 0-9, 10-19, ..., 80-89

        type Bucket = {
                range: string;        // '0-9', '10-19', etc.
                count: number;        // number of 5★s in this range
                isSoftPity: boolean;  // 70-79 or 80-89
                isHardPity: boolean;  // 80-89 (or 90)
        };

        function computeBuckets(): Bucket[] {
                const fiveStars = game.wishHistory.filter((r) => r.rarity === 5);
                const counts = new Array(NUM_BUCKETS).fill(0);
                for (const w of fiveStars) {
                        const pity = Math.min(w.pityCount, 89);  // 90 → 89 bucket
                        const idx = Math.floor(pity / BUCKET_SIZE);
                        if (idx >= 0 && idx < NUM_BUCKETS) counts[idx]++;
                }
                return counts.map((count, i) => {
                        const lo = i * BUCKET_SIZE;
                        const hi = lo + BUCKET_SIZE - 1;
                        return {
                                range: i === NUM_BUCKETS - 1 ? `${lo}+` : `${lo}-${hi}`,
                                count,
                                isSoftPity: lo >= 70,
                                isHardPity: lo >= 80
                        };
                });
        }
        let buckets = $derived(computeBuckets());

        let total5Stars = $derived(buckets.reduce((sum, b) => sum + b.count, 0));
        let maxCount = $derived(Math.max(1, ...buckets.map((b) => b.count)));

        // ── Stats ──────────────────────────────────────────────────────────
        let earlyDrops = $derived(buckets.slice(0, 7).reduce((s, b) => s + b.count, 0));  // 0-69
        let softPityDrops = $derived(buckets.slice(7, 9).reduce((s, b) => s + b.count, 0));  // 70-89
        let earlyPercent = $derived(total5Stars > 0 ? Math.round((earlyDrops / total5Stars) * 100) : 0);
        let softPityPercent = $derived(total5Stars > 0 ? Math.round((softPityDrops / total5Stars) * 100) : 0);

        // Average pity at drop — clamp pityCount to 89 to match the bucket
        // clamping (a pityCount of 90 is hard pity, which lands in the "80+"
        // bucket; using 90 for the average would skew it upward for users
        // who hit hard pity).
        function computeAvgPity(): number {
                const fiveStars = game.wishHistory.filter((r) => r.rarity === 5);
                if (fiveStars.length === 0) return 0;
                return Math.round(fiveStars.reduce((s: number, w: WishResult) => s + Math.min(w.pityCount, 89), 0) / fiveStars.length);
        }
        let avgPity = $derived(computeAvgPity());

        function barHeight(count: number): number {
                return Math.max(2, (count / maxCount) * 100);
        }

        function barColor(b: Bucket): string {
                if (b.count === 0) return 'bg-[#24314A]';
                if (b.isHardPity) return 'bg-gradient-to-t from-[#E8745A] to-[#FF8B5A]';
                if (b.isSoftPity) return 'bg-gradient-to-t from-[#E0B25A] to-[#E6C77A]';
                return 'bg-gradient-to-t from-[#5E90D6] to-[#7DCBE0]';
        }
</script>

<div class="bg-[#1A2337]/80 backdrop-blur-sm rounded-xl border border-[#C9A45A]/20 shadow-xl p-5 space-y-4">
        <div class="flex items-center justify-between">
                <h3 class="font-heading text-sm font-semibold text-[#F2E6D0] uppercase tracking-wider">
                        <span class="text-[#E6C77A]">📊</span> Pity Distribution
                </h3>
                {#if total5Stars > 0}
                        <div class="text-right">
                                <div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">Avg Pity at 5★</div>
                                <div class="font-mono text-sm font-bold text-[#E6C77A] tabular-nums">{avgPity}</div>
                        </div>
                {/if}
        </div>

        {#if total5Stars === 0}
                <div class="text-center py-8 text-[#8E97AA] italic text-sm">
                        Belum ada 5★ yang didapat. Pull lebih banyak untuk melihat distribusi pity!
                </div>
        {:else}
                <!-- Bar chart -->
                <div class="flex items-end justify-between gap-1 h-32 px-2 pt-4 border-b border-[#24314A]">
                        {#each buckets as b}
                                <div class="flex-1 flex flex-col items-center gap-1 group relative">
                                        <!-- Tooltip on hover -->
                                        {#if b.count > 0}
                                                <div class="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0B1020] border border-[#C9A45A]/40 rounded px-2 py-1 text-[10px] font-mono text-[#E6C77A] whitespace-nowrap pointer-events-none z-10">
                                                        {b.count}× 5★ at pity {b.range}
                                                </div>
                                        {/if}
                                        <!-- Bar -->
                                        <div
                                                class="w-full rounded-t transition-all duration-500 {barColor(b)}"
                                                style="height: {barHeight(b.count)}%"
                                        ></div>
                                        <!-- Count label (only if > 0) -->
                                        {#if b.count > 0}
                                                <div class="text-[9px] font-mono font-bold {b.isHardPity ? 'text-[#E8745A]' : b.isSoftPity ? 'text-[#E0B25A]' : 'text-[#B8C1D3]'} tabular-nums">
                                                        {b.count}
                                                </div>
                                        {/if}
                                </div>
                        {/each}
                </div>

                <!-- X-axis labels -->
                <div class="flex justify-between gap-1 px-2">
                        {#each buckets as b}
                                <div class="flex-1 text-center text-[8px] text-[#8E97AA] font-mono tabular-nums">
                                        {b.range}
                                </div>
                        {/each}
                </div>

                <!-- Soft pity zone marker -->
                <div class="flex items-center gap-2 text-[10px] text-[#8E97AA]">
                        <span class="uppercase tracking-wider">Zona:</span>
                        <span class="flex items-center gap-1">
                                <span class="w-2 h-2 rounded-sm bg-[#5E90D6]"></span>
                                Early (0-69)
                        </span>
                        <span class="flex items-center gap-1">
                                <span class="w-2 h-2 rounded-sm bg-[#E0B25A]"></span>
                                Soft Pity (70-79)
                        </span>
                        <span class="flex items-center gap-1">
                                <span class="w-2 h-2 rounded-sm bg-[#E8745A]"></span>
                                Hard Pity (80+)
                        </span>
                </div>

                <!-- Summary stats -->
                <div class="grid grid-cols-3 gap-2 pt-2 border-t border-[#24314A]">
                        <div class="text-center p-2 rounded-md bg-[#0B1020]/40">
                                <div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">Early Drops</div>
                                <div class="font-mono text-sm font-bold text-[#5E90D6] tabular-nums">
                                        {earlyDrops} <span class="text-[10px] text-[#8E97AA]">({earlyPercent}%)</span>
                                </div>
                        </div>
                        <div class="text-center p-2 rounded-md bg-[#0B1020]/40">
                                <div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">Soft Pity+</div>
                                <div class="font-mono text-sm font-bold text-[#E0B25A] tabular-nums">
                                        {softPityDrops} <span class="text-[10px] text-[#8E97AA]">({softPityPercent}%)</span>
                                </div>
                        </div>
                        <div class="text-center p-2 rounded-md bg-[#0B1020]/40">
                                <div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">Total 5★</div>
                                <div class="font-mono text-sm font-bold text-[#E6C77A] tabular-nums">{total5Stars}</div>
                        </div>
                </div>

                <div class="text-[10px] text-[#8E97AA] pt-2 border-t border-[#24314A] leading-relaxed">
                        Bar menunjukkan di pity berapa 5★ kamu didapat. Bar tinggi di zona soft pity (70+) berarti kamu serah mencapai soft pity sebelum dapat 5★. Bar tinggi di early (0-69) berarti kamu beruntung!
                </div>
        {/if}
</div>
