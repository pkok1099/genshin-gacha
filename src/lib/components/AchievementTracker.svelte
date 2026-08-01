<script lang="ts">
        // Achievement tracker — shows unlocked/locked milestone badges computed
        // from wish history. Sits on the /history page (or anywhere compact).
        // Achievements are computed on-demand from history + sim state, so they
        // stay accurate after JSON imports without extra persistence.

        import { getGameState, type WishResult } from '$lib/stores/gameState.svelte';
        import { ACHIEVEMENTS, computeAchievementStats, tierColor, tierLabel, type Achievement } from '$lib/utils/achievements';

        const game = getGameState();

        let stats = $derived(computeAchievementStats(game.wishHistory, game.novicePullsUsed >= game.NOVICE_MAX_PULLS));

        // Compute unlock state for each achievement reactively.
        let achievementStates = $derived(
                ACHIEVEMENTS.map((a) => ({
                        achievement: a,
                        unlocked: a.check(game.wishHistory, stats)
                }))
        );

        let unlockedCount = $derived(achievementStates.filter(s => s.unlocked).length);
        let totalCount = $derived(achievementStates.length);
        let completionPercent = $derived(Math.round((unlockedCount / totalCount) * 100));

        // Group by tier for display
        const TIERS: Achievement['tier'][] = ['platinum', 'gold', 'silver', 'bronze'];

        function achievementsForTier(tier: Achievement['tier']) {
                return achievementStates.filter(s => s.achievement.tier === tier);
        }
</script>

<div class="bg-[#1A2337]/80 backdrop-blur-sm rounded-xl border border-[#C9A45A]/20 shadow-xl p-5 space-y-4">
        <div class="flex items-center justify-between">
                <h3 class="font-heading text-sm font-semibold text-[#F2E6D0] uppercase tracking-wider">
                        <span class="text-[#E6C77A]">🏆</span> Achievements
                </h3>
                <div class="text-right">
                        <div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">Unlocked</div>
                        <div class="font-mono text-sm font-bold text-[#E6C77A] tabular-nums">{unlockedCount} / {totalCount}</div>
                </div>
        </div>

        <!-- Completion bar -->
        <div>
                <div class="flex justify-between text-[9px] text-[#8E97AA] mb-1">
                        <span class="uppercase tracking-wider">Completion</span>
                        <span class="font-mono text-[#E6C77A] font-bold">{completionPercent}%</span>
                </div>
                <div class="h-2 bg-[#0B1020] rounded-full overflow-hidden border border-[#24314A]/60">
                        <div class="h-full bg-gradient-to-r from-[#C9A45A] via-[#E6C77A] to-[#7DCBE0] rounded-full transition-all duration-500" style="width: {completionPercent}%"></div>
                </div>
        </div>

        <!-- Achievements grouped by tier -->
        <div class="space-y-3 pt-2 border-t border-[#24314A]">
                {#each TIERS as tier}
                        {@const items = achievementsForTier(tier)}
                        {#if items.length > 0}
                                <div class="space-y-2">
                                        <div class="text-[10px] font-bold uppercase tracking-wider {tierColor(tier).split(' ').find(c => c.startsWith('text-'))}">{tierLabel(tier)}</div>
                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {#each items as { achievement: a, unlocked }}
                                                        <div class="flex items-center gap-2.5 p-2 rounded-lg border transition-all {unlocked ? tierColor(a.tier) : 'border-[#24314A] bg-[#0B1020]/40 opacity-60'}">
                                                                <div class="text-xl shrink-0 {unlocked ? '' : 'grayscale opacity-40'}">
                                                                        {unlocked ? a.icon : '🔒'}
                                                                </div>
                                                                <div class="min-w-0 flex-1">
                                                                        <div class="text-[11px] font-bold {unlocked ? '' : 'text-[#8E97AA]'} truncate">
                                                                                {a.title}
                                                                        </div>
                                                                        <div class="text-[9px] text-[#8E97AA] leading-tight">
                                                                                {#if a.hidden && !unlocked}
                                                                                        <span class="italic">Hidden achievement</span>
                                                                                {:else}
                                                                                        {a.desc}
                                                                                {/if}
                                                                        </div>
                                                                </div>
                                                                {#if unlocked}
                                                                        <span class="text-[9px] font-bold uppercase tracking-wider shrink-0">✓</span>
                                                                {/if}
                                                        </div>
                                                {/each}
                                        </div>
                                </div>
                        {/if}
                {/each}
        </div>

        <div class="text-[9px] text-[#8E97AA] pt-2 border-t border-[#24314A] leading-relaxed">
                Achievements dihitung dari wish history. Hidden achievements hanya terlihat setelah terbuka.
        </div>
</div>
