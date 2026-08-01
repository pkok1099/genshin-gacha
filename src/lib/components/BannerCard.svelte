<script lang="ts">
        import type { BannerData } from '$lib/services/bannerApi';
        import { characterIconBigUrl, slugifyName } from '$lib/services/characterApi';
        import { t, localeKey } from '$lib/i18n/index.svelte';

        // Re-render on locale change
        void localeKey();

        let {
                banner,
                selected = false,
                onclick
        }: {
                banner: BannerData;
                selected?: boolean;
                onclick?: () => void;
        } = $props();

        let featured5Star = $derived(banner.characters.find((c) => c.rarity === 5));
        let featured4Stars = $derived(banner.characters.filter((c) => c.rarity === 4));

        let endDate = $derived(new Date(banner.end_time * 1000));
        let countdown = $derived((() => {
                const diff = endDate.getTime() - Date.now();
                if (diff <= 0) return 'Berakhir';
                const d = Math.floor(diff / 86400000);
                const h = Math.floor((diff % 86400000) / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                return `${d}h ${h}j ${m}m`;
        })());

        let elementColor: string = $derived(
                featured5Star?.element === 'Pyro'    ? 'border-[#E8745A]/60 from-[#3a1a14]'
                : featured5Star?.element === 'Hydro'   ? 'border-[#4A8FE0]/60 from-[#142845]'
                : featured5Star?.element === 'Electro' ? 'border-[#B495F0]/60 from-[#241a3a]'
                : featured5Star?.element === 'Dendro'  ? 'border-[#6FAF6E]/60 from-[#162a18]'
                : featured5Star?.element === 'Anemo'   ? 'border-[#5FC9B8]/60 from-[#0e2a28]'
                : featured5Star?.element === 'Cryo'    ? 'border-[#7DCBE0]/60 from-[#0e2630]'
                : featured5Star?.element === 'Geo'     ? 'border-[#E0B25A]/60 from-[#33260e]'
                : 'border-[#C9A45A]/60 from-[#1A2337]'
        );
</script>

<button
        class="card-premium relative w-full text-left rounded-xl border-2 {elementColor} bg-gradient-to-br {elementColor} to-[#0B1020] overflow-hidden
                {selected ? 'ring-2 ring-[#E6C77A] shadow-[0_0_30px_rgba(201,164,90,0.35)]' : ''}"
        {onclick}
>
        <!-- Selected indicator -->
        {#if selected}
                <div class="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#E6C77A] shadow-[0_0_10px_rgba(230,199,122,0.8)] z-10"></div>
        {/if}

        <div class="p-4 flex gap-4 items-center">
                <!-- Featured 5★ -->
                {#if featured5Star}
                        <div class="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border-2 border-[#C9A45A]/50 bg-[#0B1020]">
                                <img
                                        src={featured5Star.icon ?? characterIconBigUrl(slugifyName(featured5Star.name))}
                                        alt={featured5Star.name}
                                        loading="eager"
                                        decoding="async"
                                        class="w-full h-full object-cover"
                                        onerror={(e: Event) => {
                                                const img = e.currentTarget as HTMLImageElement;
                                                const jmpUrl = characterIconBigUrl(slugifyName(featured5Star.name));
                                                if (img.src !== jmpUrl) {
                                                        img.src = jmpUrl;
                                                } else {
                                                        img.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="#1A2337" width="100" height="100"/><text fill="#E6C77A" font-size="14" x="50" y="55" text-anchor="middle">★5</text></svg>');
                                                }
                                        }}
                                />
                        </div>
                {/if}

                <div class="flex-1 min-w-0">
                        <!-- Element + Version -->
                        <div class="flex items-center gap-2 mb-1">
                                <span class="text-[10px] font-bold px-2 py-0.5 rounded border border-[#C9A45A]/30 bg-[#C9A45A]/10 text-[#E6C77A] uppercase tracking-wider">
                                        {featured5Star?.element ?? '?'}
                                </span>
                                <span class="text-[10px] text-[#8E97AA] font-mono">v{banner.version}</span>
                        </div>

                        <!-- Character name -->
                        <div class="text-sm font-heading font-semibold text-[#E6C77A] truncate">{featured5Star?.name ?? 'Unknown'}</div>
                        <div class="text-[10px] text-[#C9A45A] tracking-wider">★ ★ ★ ★ ★</div>

                        <!-- 4★ featured -->
                        {#if featured4Stars.length > 0}
                                <div class="flex gap-1 mt-1.5 flex-wrap">
                                        {#each featured4Stars as c4}
                                                <span class="text-[9px] px-1.5 py-0.5 rounded bg-[#8D72C9]/15 text-[#B495F0] border border-[#8D72C9]/30 font-medium">
                                                        {c4.name}
                                                </span>
                                        {/each}
                                </div>
                        {/if}

                        <!-- Countdown -->
                        <div class="mt-1.5 text-[10px] text-[#8E97AA]">
                                ⏳ <span class="text-[#E8745A] font-mono font-bold">{countdown}</span> {t('banner.remaining')}
                        </div>
                </div>
        </div>
</button>
