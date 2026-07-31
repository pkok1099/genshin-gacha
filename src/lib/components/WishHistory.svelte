<script lang="ts">
        import type { PullResult } from '$lib/utils/gachaEngine';

        let { history = [] }: { history: PullResult[] } = $props();

        let filter: 'all' | 5 | 4 | 3 = $state('all');

        let filtered: PullResult[] = $derived(
                filter === 'all' ? history : history.filter((r) => r.rarity === filter)
        );

        let stats5Star: number = $derived(history.filter((r) => r.rarity === 5).length);
        let stats4Star: number = $derived(history.filter((r) => r.rarity === 4).length);
        let stats3Star: number = $derived(history.filter((r) => r.rarity === 3).length);
</script>

<div class="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div class="flex justify-between items-center">
                <h3 class="text-sm font-bold text-slate-200">Wish History</h3>
                <span class="text-xs font-mono bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30">
                        {history.length} wish
                </span>
        </div>

        <!-- Filter Tabs -->
        <div class="flex gap-1">
                <button onclick={() => filter = 'all'} class="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all {filter === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-950 text-slate-500 hover:text-slate-300'}">
                        Semua ({history.length})
                </button>
                <button onclick={() => filter = 5} class="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all {filter === 5 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-950 text-slate-500 hover:text-slate-300'}">
                        ★5 ({stats5Star})
                </button>
                <button onclick={() => filter = 4} class="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all {filter === 4 ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-slate-950 text-slate-500 hover:text-slate-300'}">
                        ★4 ({stats4Star})
                </button>
                <button onclick={() => filter = 3} class="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all {filter === 3 ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-slate-950 text-slate-500 hover:text-slate-300'}">
                        ★3 ({stats3Star})
                </button>
        </div>

        <!-- History List -->
        <div class="max-h-80 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                {#if filtered.length === 0}
                        <div class="text-slate-500 italic text-center py-8 text-sm">Belum ada wish.</div>
                {:else}
                        {#each filtered.toReversed() as item, i}
                                <div class="flex items-center gap-3 p-2.5 rounded-xl border {item.rarity === 5 ? 'bg-amber-500/5 border-amber-500/20' : item.rarity === 4 ? 'bg-purple-500/5 border-purple-500/20' : 'bg-slate-950/50 border-slate-800/50'} transition-all hover:bg-slate-800/50">
                                        <!-- Pull number -->
                                        <span class="text-[10px] text-slate-600 font-mono w-8 text-right shrink-0">#{history.length - i}</span>

                                        <!-- Rarity indicator -->
                                        <div class="w-1.5 h-8 rounded-full shrink-0 {item.rarity === 5 ? 'bg-amber-400' : item.rarity === 4 ? 'bg-purple-400' : 'bg-blue-400'}"></div>

                                        <!-- Icon -->
                                        <div class="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-slate-800">
                                                <img src={item.iconUrl} alt={item.name} class="w-full h-full object-cover"
                                                        onerror={(e) => {
                                                                const img = e.target as HTMLImageElement;
                                                                if (item.bannerIconUrl && img.src !== item.bannerIconUrl) {
                                                                        img.src = item.bannerIconUrl;
                                                                } else {
                                                                        img.style.display = 'none';
                                                                }
                                                        }}
                                                />
                                        </div>

                                        <!-- Info -->
                                        <div class="flex-1 min-w-0">
                                                <div class="text-xs font-bold truncate {item.rarity === 5 ? 'text-amber-300' : item.rarity === 4 ? 'text-purple-300' : 'text-slate-400'}">{item.name}</div>
                                                <div class="text-[9px] text-slate-600">
                                                        {item.type === 'character' ? 'Character' : 'Weapon'}
                                                        {#if item.element} • {item.element}{/if}
                                                        {#if item.isRateUp} • <span class="text-amber-400">Rate-Up</span>{/if}
                                                        {#if item.rarity === 5 && !item.isRateUp} • <span class="text-rose-400">Lost 50/50</span>{/if}
                                                </div>
                                        </div>

                                        <!-- Rarity -->
                                        <div class="text-[10px] {item.rarity === 5 ? 'text-amber-400' : item.rarity === 4 ? 'text-purple-400' : 'text-blue-400'} font-bold shrink-0">
                                                ★{item.rarity}
                                        </div>
                                </div>
                        {/each}
                {/if}
        </div>
</div>

<style>
        .custom-scrollbar::-webkit-scrollbar {
                width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #334155;
                border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #475569;
        }
</style>
