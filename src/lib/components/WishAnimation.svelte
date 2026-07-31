<script lang="ts">
        import type { WishResult } from '$lib/stores/gameState.svelte';
        import ResultCard from './ResultCard.svelte';
        import { fade, scale } from 'svelte/transition';
        import { cubicOut, backOut } from 'svelte/easing';

        let {
                results = [],
                onClose
        }: {
                results: WishResult[];
                onClose: () => void;
        } = $props();

        let allRevealed: boolean = $state(false);
        let showContinue: boolean = $state(false);

        // Sort: 5★ first (so they appear at the front), then 4★, then 3★.
        let sortedResults = $derived(
                [...results].sort((a, b) => b.rarity - a.rarity)
        );

        // Stagger timing — Genshin uses ~120ms between cards for a snappy cascade.
        const REVEAL_STAGGER_MS = 120;
        const REVEAL_INITIAL_DELAY_MS = 350;
        const CONTINUE_DELAY_MS = 400;

        $effect(() => {
                if (results.length > 0) {
                        allRevealed = false;
                        showContinue = false;
                        const totalRevealTime = REVEAL_INITIAL_DELAY_MS + results.length * REVEAL_STAGGER_MS;
                        const t1 = setTimeout(() => { allRevealed = true; }, REVEAL_INITIAL_DELAY_MS);
                        const t2 = setTimeout(() => { showContinue = true; }, totalRevealTime + CONTINUE_DELAY_MS);
                        return () => { clearTimeout(t1); clearTimeout(t2); };
                }
        });

        // ESC key closes — only after continue is available
        $effect(() => {
                const handler = (e: KeyboardEvent) => {
                        if (e.key === 'Escape' && showContinue) onClose();
                };
                window.addEventListener('keydown', handler);
                return () => window.removeEventListener('keydown', handler);
        });

        // Summary
        let count5 = $derived(results.filter((r) => r.rarity === 5).length);
        let count4 = $derived(results.filter((r) => r.rarity === 4).length);
        let count3 = $derived(results.filter((r) => r.rarity === 3).length);

        let has5Star = $derived(count5 > 0);
        let has4Star = $derived(count4 > 0);

        // Highest rarity drives the cinematic backdrop intensity.
        let topRarity = $derived(has5Star ? 5 : has4Star ? 4 : 3);
</script>

{#if results.length > 0}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
                class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1020]/95 backdrop-blur-md"
                transition:fade={{ duration: 200 }}
                onclick={(e) => { if (e.target === e.currentTarget && showContinue) onClose(); }}
                ontouchend={(e) => { if (e.target === e.currentTarget && showContinue) onClose(); }}
                onkeydown={(e) => { if (e.key === 'Escape' && showContinue) onClose(); }}
        >
                <!-- Background flair — radial glow tinted by top rarity -->
                <div class="absolute inset-0 pointer-events-none overflow-hidden gpu-layer">
                        {#if topRarity === 5}
                                <div class="absolute -inset-40 opacity-50 transition-opacity duration-700"
                                        style="background: radial-gradient(ellipse at center, rgba(230,199,122,0.45), transparent 60%);"></div>
                        {:else if topRarity === 4}
                                <div class="absolute -inset-40 opacity-40 transition-opacity duration-700"
                                        style="background: radial-gradient(ellipse at center, rgba(180,149,240,0.4), transparent 60%);"></div>
                        {/if}
                </div>

                <div class="relative max-w-4xl w-full">
                        <!-- Close -->
                        <button
                                onclick={onClose}
                                class="absolute -top-12 right-0 text-[#8E97AA] hover:text-[#F2E6D0] text-2xl transition-colors z-10"
                                aria-label="Close"
                        >
                                ✕
                        </button>

                        <!-- Title -->
                        <div class="text-center mb-6" in:fade={{ duration: 250, delay: 100 }}>
                                <h2 class="font-heading text-2xl font-semibold {has5Star ? 'text-[#E6C77A]' : has4Star ? 'text-[#B495F0]' : 'text-[#F2E6D0]'}">
                                        {#if results.length === 1}
                                                Wish Result
                                        {:else}
                                                {results.length}× Wish Results
                                        {/if}
                                </h2>
                                <p class="text-xs text-[#8E97AA] mt-1">Klik kartu untuk membalik • Tekan ESC atau klik di luar untuk lanjut</p>
                        </div>

                        <!-- Cards Grid — staggered scale-in (Genshin style) -->
                        <div class="flex flex-wrap justify-center gap-3 md:gap-4">
                                {#each sortedResults as result, i (result.id)}
                                        <div
                                                in:scale={{ start: 0.7, duration: 350, delay: 80 + i * 60, easing: backOut }}
                                        >
                                                <ResultCard {result} index={i} revealed={allRevealed} />
                                        </div>
                                {/each}
                        </div>

                        <!-- Summary -->
                        <div class="mt-6 flex justify-center gap-3 text-xs" in:fade={{ duration: 250, delay: 300 }}>
                                {#if count5 > 0}
                                        <span class="px-3 py-1.5 rounded-full border border-[#C9A45A]/40 bg-[#C9A45A]/15 text-[#E6C77A] font-bold font-mono">
                                                {count5}× ★5
                                        </span>
                                {/if}
                                {#if count4 > 0}
                                        <span class="px-3 py-1.5 rounded-full border border-[#8D72C9]/40 bg-[#8D72C9]/15 text-[#B495F0] font-bold font-mono">
                                                {count4}× ★4
                                        </span>
                                {/if}
                                {#if count3 > 0}
                                        <span class="px-3 py-1.5 rounded-full border border-[#5E90D6]/40 bg-[#5E90D6]/15 text-[#5E90D6] font-bold font-mono">
                                                {count3}× ★3
                                        </span>
                                {/if}
                        </div>

                        <!-- Continue -->
                        {#if showContinue}
                                <div class="mt-6 flex justify-center" in:fade={{ duration: 200 }}>
                                        <button
                                                onclick={onClose}
                                                class="btn-press px-8 py-2.5 rounded-md border border-[#C9A45A]/50 bg-gradient-to-r from-[#24314A] to-[#1A2337] hover:from-[#2A3856] hover:to-[#24314A] text-[#E6C77A] font-heading font-semibold tracking-wider uppercase text-sm transition-all hover:shadow-[0_0_20px_rgba(201,164,90,0.35)]"
                                        >
                                                Continue
                                        </button>
                                </div>
                        {/if}
                </div>
        </div>
{/if}
