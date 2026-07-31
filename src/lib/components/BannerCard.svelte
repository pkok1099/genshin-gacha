<script lang="ts">
        import type { BannerData } from '$lib/stores/gacha.svelte';
        import { characterIconBigUrl, slugifyName } from '$lib/services/characterApi';

        let { banner, selected = false, onclick }: { banner: BannerData; selected?: boolean; onclick?: () => void } = $props();

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
                featured5Star?.element === 'Pyro' ? 'border-rose-500/50 from-rose-900/30'
                        : featured5Star?.element === 'Hydro' ? 'border-sky-500/50 from-sky-900/30'
                        : featured5Star?.element === 'Electro' ? 'border-purple-500/50 from-purple-900/30'
                        : featured5Star?.element === 'Dendro' ? 'border-emerald-500/50 from-emerald-900/30'
                        : featured5Star?.element === 'Anemo' ? 'border-teal-500/50 from-teal-900/30'
                        : featured5Star?.element === 'Cryo' ? 'border-cyan-500/50 from-cyan-900/30'
                        : featured5Star?.element === 'Geo' ? 'border-amber-500/50 from-amber-900/30'
                        : 'border-slate-500/50 from-slate-900/30'
        );

        let elementBadge: string = $derived(
                featured5Star?.element === 'Pyro' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : featured5Star?.element === 'Hydro' ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                        : featured5Star?.element === 'Electro' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                        : featured5Star?.element === 'Dendro' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : featured5Star?.element === 'Anemo' ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                        : featured5Star?.element === 'Cryo' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                        : featured5Star?.element === 'Geo' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
        );
</script>

<button
        class="relative w-full text-left rounded-2xl border-2 {selected ? elementColor + ' shadow-lg' : 'border-slate-700/50 hover:border-slate-600'} bg-gradient-to-br {elementColor} to-slate-950 overflow-hidden transition-all duration-300"
        {onclick}
>
        <!-- Selected indicator -->
        {#if selected}
                <div class="absolute top-2 right-2 w-3 h-3 rounded-full bg-amber-400 shadow-lg shadow-amber-400/50 z-10"></div>
        {/if}

        <div class="p-4 flex gap-4 items-center">
                <!-- Featured 5★ Character -->
                {#if featured5Star}
                        <div class="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 {elementColor.split(' ')[0]} bg-slate-900">
                                <img
                                        src={characterIconBigUrl(slugifyName(featured5Star.name))}
                                        alt={featured5Star.name}
                                        class="w-full h-full object-cover"
                                        onerror={(e) => {
                                                const img = e.target as HTMLImageElement;
                                                if (featured5Star.icon && img.src !== featured5Star.icon) {
                                                        img.src = featured5Star.icon;
                                                } else {
                                                        img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%231e293b" width="100" height="100"/><text fill="%2394a3b8" font-size="14" x="50" y="55" text-anchor="middle">★5</text></svg>';
                                                }
                                        }}
                                />
                        </div>
                {/if}

                <div class="flex-1 min-w-0">
                        <!-- Banner name & version -->
                        <div class="flex items-center gap-2 mb-1">
                                <span class="text-[10px] font-bold px-2 py-0.5 rounded border {elementBadge} uppercase tracking-wider">
                                        {featured5Star?.element ?? '?'}
                                </span>
                                <span class="text-[10px] text-slate-500 font-mono">v{banner.version}</span>
                        </div>

                        <!-- Character name -->
                        <div class="text-sm font-bold text-amber-300 truncate">{featured5Star?.name ?? 'Unknown'}</div>
                        <div class="text-[10px] text-amber-400 font-bold tracking-wider">★ ★ ★ ★ ★</div>

                        <!-- 4★ featured -->
                        {#if featured4Stars.length > 0}
                                <div class="flex gap-1 mt-1.5">
                                        {#each featured4Stars as c4}
                                                <span class="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">{c4.name}</span>
                                        {/each}
                                </div>
                        {/if}

                        <!-- Countdown -->
                        <div class="mt-1.5 text-[10px] text-slate-500">
                                ⏳ <span class="text-rose-400 font-mono font-bold">{countdown}</span> tersisa
                        </div>
                </div>
        </div>
</button>
