<script lang="ts">
        import ResultCard from './ResultCard.svelte';
        import type { PullResult } from '$lib/utils/gachaEngine';

        let { results = [], onClose }: { results: PullResult[]; onClose: () => void } = $props();

        let allRevealed: boolean = $state(false);
        let revealTimer: ReturnType<typeof setTimeout> | null = null;

        $effect(() => {
                if (results.length > 0) {
                        allRevealed = false;
                        // Auto-reveal all after delay
                        const totalDelay = results.length * 120 + 700;
                        revealTimer = setTimeout(() => { allRevealed = true; }, totalDelay);
                        return () => { if (revealTimer) clearTimeout(revealTimer); };
                }
        });

        // Sort: 5★ first, then 4★, then 3★
        let sortedResults: PullResult[] = $derived(
                [...results].sort((a, b) => b.rarity - a.rarity)
        );
</script>

{#if results.length > 0}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
                class="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
                onclick={onClose}
                onkeydown={(e) => { if (e.key === 'Escape') onClose(); }}
        >
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Wish results"
                        tabindex="-1"
                        class="relative max-w-4xl w-full"
                        onclick={(e) => e.stopPropagation()}
                        onkeydown={(e) => { if (e.key === 'Escape') onClose(); }}
                >
                        <!-- Close button -->
                        <button
                                onclick={onClose}
                                class="absolute -top-12 right-0 text-slate-400 hover:text-white text-2xl transition-colors z-10"
                        >
                                ✕
                        </button>

                        <!-- Title -->
                        <div class="text-center mb-6">
                                <h2 class="text-xl font-bold text-amber-300">
                                        {#if results.length === 1}
                                                Wish Result
                                        {:else}
                                                10x Wish Results
                                        {/if}
                                </h2>
                                <p class="text-xs text-slate-500 mt-1">Klik kartu untuk membalik • Klik di luar untuk menutup</p>
                        </div>

                        <!-- Cards Grid -->
                        <div class="flex flex-wrap justify-center gap-3">
                                {#each sortedResults as result, i}
                                        <ResultCard {result} index={i} revealed={true} />
                                {/each}
                        </div>

                        <!-- Summary -->
                        <div class="mt-6 flex justify-center gap-4 text-xs">
                                {#each [5, 4, 3] as r}
                                        {@const count = results.filter((r2) => r2.rarity === r).length}
                                        {#if count > 0}
                                                <span class="px-3 py-1.5 rounded-full border {r === 5 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : r === 4 ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-blue-500/20 text-blue-300 border-blue-500/40'} font-bold">
                                                        {count}x ★{r}
                                                </span>
                                        {/if}
                                {/each}
                        </div>
                </div>
        </div>
{/if}
