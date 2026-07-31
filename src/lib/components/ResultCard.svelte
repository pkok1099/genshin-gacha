<script lang="ts">
        import type { PullResult } from '$lib/utils/gachaEngine';

        let { result, index = 0, revealed = false }: { result: PullResult; index?: number; revealed?: boolean } = $props();

        let isFlipped: boolean = $state(false);
        let imgLoaded: boolean = $state(false);

        $effect(() => {
                if (revealed) {
                        const delay = index * 120;
                        const timer = setTimeout(() => { isFlipped = true; }, delay);
                        return () => clearTimeout(timer);
                } else {
                        isFlipped = false;
                }
        });

        let rarityBorder: string = $derived(
                result.rarity === 5
                        ? 'border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.5)]'
                        : result.rarity === 4
                                ? 'border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                                : 'border-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.3)]'
        );

        let rarityBg: string = $derived(
                result.rarity === 5
                        ? 'from-amber-900/80 via-amber-950/60 to-slate-950'
                        : result.rarity === 4
                                ? 'from-purple-900/80 via-purple-950/60 to-slate-950'
                                : 'from-slate-800/80 via-slate-900/60 to-slate-950'
        );

        let elementColor: string = $derived(
                result.element === 'Pyro' ? 'text-rose-400'
                        : result.element === 'Hydro' ? 'text-sky-400'
                        : result.element === 'Electro' ? 'text-purple-400'
                        : result.element === 'Dendro' ? 'text-emerald-400'
                        : result.element === 'Anemo' ? 'text-teal-400'
                        : result.element === 'Cryo' ? 'text-cyan-400'
                        : result.element === 'Geo' ? 'text-amber-400'
                        : 'text-slate-400'
        );

        let starColor: string = $derived(
                result.rarity === 5 ? 'text-amber-400' : result.rarity === 4 ? 'text-purple-400' : 'text-blue-400'
        );
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
        role="button"
        tabindex="0"
        class="result-card w-[140px] h-[200px] perspective-[1000px] cursor-pointer select-none"
        onclick={() => { isFlipped = !isFlipped; }}
        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); isFlipped = !isFlipped; } }}
>
        <div class="relative w-full h-full transition-transform duration-700 transform-style-3d {isFlipped ? 'rotate-y-180' : ''}">
                <!-- Back (unrevealed) -->
                <div class="absolute inset-0 backface-hidden rounded-xl border-2 border-slate-600 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                        <div class="text-center">
                                <div class="text-4xl mb-2">✦</div>
                                <div class="text-xs text-slate-500">Genshin</div>
                        </div>
                </div>

                <!-- Front (revealed) -->
                <div class="absolute inset-0 backface-hidden rotate-y-180 rounded-xl border-2 {rarityBorder} bg-gradient-to-br {rarityBg} overflow-hidden">
                        {#if result.rarity === 5}
                                <div class="absolute inset-0 animate-shimmer opacity-30"></div>
                        {/if}

                        <!-- Image -->
                        <div class="relative w-full h-[120px] bg-slate-900/50 flex items-center justify-center overflow-hidden">
                                {#if !imgLoaded}
                                        <div class="absolute inset-0 bg-slate-800 animate-pulse"></div>
                                {/if}
                                <img
                                        src={result.iconUrl}
                                        alt={result.name}
                                        class="w-full h-full object-cover transition-opacity duration-300 {imgLoaded ? 'opacity-100' : 'opacity-0'}"
                                        onload={() => imgLoaded = true}
                                        onerror={() => imgLoaded = false}
                                />
                        </div>

                        <!-- Info -->
                        <div class="p-2 text-center relative z-10">
                                <div class="text-[10px] {starColor} font-bold tracking-wider">
                                        {#each Array(result.rarity) as _}
                                                ★
                                        {/each}
                                </div>
                                <div class="text-xs font-bold text-slate-100 truncate mt-0.5">{result.name}</div>
                                {#if result.element}
                                        <div class="text-[9px] {elementColor} font-semibold uppercase">{result.element}</div>
                                {/if}
                                {#if result.isRateUp}
                                        <div class="text-[9px] text-amber-400 font-bold">RATE-UP</div>
                                {:else if result.rarity === 5}
                                        <div class="text-[9px] text-rose-400 font-bold">SPOOK</div>
                                {/if}
                        </div>
                </div>
        </div>
</div>

<style>
        .transform-style-3d {
                transform-style: preserve-3d;
        }

        .backface-hidden {
                backface-visibility: hidden;
        }

        .rotate-y-180 {
                transform: rotateY(180deg);
        }

        @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
        }

        .animate-shimmer {
                background: linear-gradient(
                        90deg,
                        transparent 0%,
                        rgba(251, 191, 36, 0.15) 50%,
                        transparent 100%
                );
                background-size: 200% 100%;
                animation: shimmer 2s infinite;
        }
</style>
