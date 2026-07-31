<script lang="ts">
        import type { WishResult } from '$lib/stores/gameState.svelte';

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

        // Single timer per card — cleared on reset. Genshin staggers flips ~120ms.
        $effect(() => {
                if (revealed) {
                        const delay = index * 120;
                        const timer = setTimeout(() => { isFlipped = true; }, delay);
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
        onclick={() => { isFlipped = !isFlipped; }}
        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); isFlipped = !isFlipped; } }}
>
        <!-- Flip container — gpu-layer so the rotateY transform stays on the
             compositor and doesn't trigger layout on the parent. -->
        <div class="relative w-full h-full transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] flip-3d gpu-layer {isFlipped ? 'flip-rotate-y' : ''}">

                <!-- Back (unrevealed) -->
                <div class="absolute inset-0 flip-backface rounded-lg border-2 border-[#C9A45A]/40 bg-gradient-to-br from-[#24314A] via-[#1A2337] to-[#0B1020] flex items-center justify-center">
                        <div class="text-center">
                                <div class="text-4xl text-[#E6C77A] mb-1">✦</div>
                                <div class="text-[10px] text-[#8E97AA] uppercase tracking-wider">Genshin</div>
                        </div>
                        <!-- Subtle pattern -->
                        <div class="absolute inset-0 opacity-20"
                                style="background-image: radial-gradient(circle at 30% 20%, rgba(230,199,122,0.3), transparent 40%), radial-gradient(circle at 70% 80%, rgba(141,114,201,0.2), transparent 40%);">
                        </div>
                </div>

                <!-- Front (revealed) -->
                <div class="absolute inset-0 flip-backface flip-rotate-y rounded-lg border-2 {rarityBorder} bg-gradient-to-br {rarityBg} overflow-hidden">

                        <!-- 5★ shimmer -->
                        {#if result.rarity === 5}
                                <div class="absolute inset-0 gold-shimmer opacity-30 pointer-events-none"></div>
                        {/if}

                        <!-- 5★ particle burst on flip -->
                        {#if result.rarity === 5 && isFlipped}
                                <div class="particle-burst"></div>
                        {/if}

                        <!-- Image -->
                        <div class="relative w-full h-[65%] bg-[#0B1020]/70 flex items-center justify-center overflow-hidden">
                                {#if !imgLoaded}
                                        <div class="absolute inset-0 bg-[#1A2337] animate-pulse"></div>
                                {/if}
                                <img
                                        src={result.icon}
                                        alt={result.name}
                                        loading="lazy"
                                        decoding="async"
                                        class="w-full h-full object-cover transition-opacity duration-300 {imgLoaded ? 'opacity-100' : 'opacity-0'}"
                                        onload={() => imgLoaded = true}
                                        onerror={(e: Event) => {
                                                const img = e.currentTarget as HTMLImageElement;
                                                if (result.fallbackIcon && img.src !== result.fallbackIcon) {
                                                        img.src = result.fallbackIcon;
                                                } else {
                                                        img.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="#1A2337" width="100" height="100"/><text fill="#E6C77A" font-size="14" x="50" y="55" text-anchor="middle">★' + result.rarity + '</text></svg>');
                                                        imgLoaded = true;
                                                }
                                        }}
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
