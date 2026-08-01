<script lang="ts">
        import type { WishResult } from '$lib/stores/gameState.svelte';
        import { playCardFlip } from '$lib/audio/synth.svelte';
        import { untrack } from 'svelte';

        let {
                result,
                index = 0,
                revealed = false
        }: {
                result: WishResult;
                index?: number;
                revealed?: boolean;
        } = $props();

        let isFlipped: boolean = $state(false);
        let imgLoaded: boolean = $state(false);

        // ── 3-tier image fallback chain ──────────────────────────────────────────
        // Order: HoYoverse CDN (official, always current) → jmp.blue (community) → SVG
        // We try HoYoverse FIRST when available because new characters (Columbina,
        // Jahoda, Ororon, etc.) often 404 on jmp.blue for weeks after release.
        // untrack: we intentionally capture initial values; result is keyed per
        // wish so the component remounts on each new pull.
        const { rarity, fallbackIcon, icon } = untrack(() => ({
                rarity: result.rarity,
                fallbackIcon: result.fallbackIcon,
                icon: result.icon
        }));

        const iconSources: string[] = (() => {
                const list: string[] = [];
                if (fallbackIcon) list.push(fallbackIcon);  // HoYoverse CDN
                if (icon) list.push(icon);                   // jmp.blue
                return list;
        })();

        // If both are missing, use SVG fallback immediately
        const svgFallback = 'data:image/svg+xml,' + encodeURIComponent(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
                '<rect fill="#1A2337" width="100" height="100"/>' +
                `<text fill="#E6C77A" font-size="14" x="50" y="55" text-anchor="middle">★${rarity}</text>` +
                '</svg>'
        );

        if (iconSources.length === 0) iconSources.push(svgFallback);

        let currentSrcIdx = $state(0);
        let currentSrc = $derived(iconSources[currentSrcIdx] ?? svgFallback);

        $effect(() => {
                // Reset image state when result changes (defensive — keyed each should remount)
                imgLoaded = false;
                currentSrcIdx = 0;
        });

        function handleImgError(e: Event) {
                const img = e.currentTarget as HTMLImageElement;
                // Try next source in the chain
                if (currentSrcIdx < iconSources.length - 1) {
                        currentSrcIdx += 1;
                } else {
                        // Exhausted all sources — use SVG fallback permanently
                        img.src = svgFallback;
                        imgLoaded = true;
                }
        }

        function handleImgLoad() {
                imgLoaded = true;
        }

        // ── Flip animation ──
        $effect(() => {
                if (revealed) {
                        const delay = index * 120;
                        const timer = setTimeout(() => {
                                isFlipped = true;
                                playCardFlip();
                        }, delay);
                        return () => clearTimeout(timer);
                } else {
                        isFlipped = false;
                }
        });

        let rarityBorder = $derived(
                result.rarity === 5
                        ? 'border-[#E6C77A] gold-glow'
                : result.rarity === 4
                        ? 'border-[#B495F0] purple-glow'
                : 'border-[#5E90D6] blue-accent'
        );

        let rarityBg = $derived(
                result.rarity === 5
                        ? 'from-[#3a2c14] via-[#1A2337] to-[#0B1020]'
                : result.rarity === 4
                        ? 'from-[#241a3a] via-[#1A2337] to-[#0B1020]'
                : 'from-[#0e2630] via-[#1A2337] to-[#0B1020]'
        );

        let starColor = $derived(
                result.rarity === 5 ? 'text-[#E6C77A]'
                : result.rarity === 4 ? 'text-[#B495F0]'
                : 'text-[#5E90D6]'
        );

        let elementClass = $derived(
                result.element === 'Pyro'    ? 'el-pyro'
                : result.element === 'Hydro'   ? 'el-hydro'
                : result.element === 'Electro' ? 'el-electro'
                : result.element === 'Dendro'  ? 'el-dendro'
                : result.element === 'Anemo'   ? 'el-anemo'
                : result.element === 'Cryo'    ? 'el-cryo'
                : result.element === 'Geo'     ? 'el-geo'
                : 'text-[#8E97AA]'
        );
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
        role="button"
        tabindex="0"
        class="result-card w-[130px] h-[185px] md:w-[150px] md:h-[210px] perspective-[1200px] cursor-pointer select-none"
        onclick={() => { isFlipped = !isFlipped; playCardFlip(); }}
        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); isFlipped = !isFlipped; } }}
>
        <div class="relative w-full h-full transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] flip-3d gpu-layer {isFlipped ? 'flip-rotate-y' : ''}">

                <!-- Back (unrevealed) -->
                <div class="absolute inset-0 flip-backface rounded-lg border-2 border-[#C9A45A]/40 bg-gradient-to-br from-[#24314A] via-[#1A2337] to-[#0B1020] flex items-center justify-center">
                        <div class="text-center">
                                <div class="text-4xl text-[#E6C77A] mb-1">✦</div>
                                <div class="text-[10px] text-[#8E97AA] uppercase tracking-wider">Genshin</div>
                        </div>
                        <div class="absolute inset-0 opacity-20"
                                style="background-image: radial-gradient(circle at 30% 20%, rgba(230,199,122,0.3), transparent 40%), radial-gradient(circle at 70% 80%, rgba(141,114,201,0.2), transparent 40%);">
                        </div>
                </div>

                <!-- Front (revealed) -->
                <div class="absolute inset-0 flip-backface flip-rotate-y rounded-lg border-2 {rarityBorder} bg-gradient-to-br {rarityBg} overflow-hidden">

                        {#if result.rarity === 5}
                                <div class="absolute inset-0 gold-shimmer opacity-30 pointer-events-none"></div>
                        {/if}

                        {#if result.rarity === 5 && isFlipped}
                                <div class="particle-burst"></div>
                        {/if}

                        <!-- Image — eager loading (we're in a modal, want immediate load).
                             3-tier fallback chain handled in script. -->
                        <div class="relative w-full h-[65%] bg-[#0B1020]/70 overflow-hidden">
                                {#if !imgLoaded}
                                        <div class="absolute inset-0 bg-[#1A2337] animate-pulse"></div>
                                {/if}
                                <img
                                        src={currentSrc}
                                        alt={result.name}
                                        loading="eager"
                                        decoding="async"
                                        class="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 {imgLoaded ? 'opacity-100' : 'opacity-0'}"
                                        onload={handleImgLoad}
                                        onerror={handleImgError}
                                />
                        </div>

                        <!-- Info -->
                        <div class="p-2 text-center relative z-10 h-[35%] flex flex-col justify-center">
                                <div class="text-[10px] {starColor} font-bold tracking-wider leading-tight">
                                        {#each Array(result.rarity) as _}
                                                ★
                                        {/each}
                                </div>
                                <div class="text-[11px] font-semibold text-[#F2E6D0] truncate mt-0.5 font-heading">{result.name}</div>
                                {#if result.element}
                                        <div class="text-[9px] {elementClass} font-semibold uppercase tracking-wider">{result.element}</div>
                                {/if}
                                {#if result.rarity === 5}
                                        <div class="text-[9px] {result.is5050Win ? 'text-[#E6C77A]' : 'text-[#E8745A]'} font-bold uppercase">
                                                {result.is5050Win ? 'Win 50/50' : 'Lost 50/50'}
                                        </div>
                                {:else if result.isRateUp && result.rarity === 4}
                                        <div class="text-[9px] text-[#B495F0] font-bold uppercase">Rate-Up</div>
                                {/if}
                        </div>
                </div>
        </div>
</div>
