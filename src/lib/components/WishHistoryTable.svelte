<script lang="ts">
        import type { WishResult } from '$lib/stores/gameState.svelte';
        import SkeletonImage from './SkeletonImage.svelte';

        let {
                history = [],
                compact = false
        }: {
                history: WishResult[];
                compact?: boolean;
        } = $props();

        type FilterTab = 'all' | 5 | 4 | 3;
        let filter: FilterTab = $state('all');

        let filtered = $derived(
                filter === 'all' ? history : history.filter((r) => r.rarity === filter)
        );

        let count5 = $derived(history.filter((r) => r.rarity === 5).length);
        let count4 = $derived(history.filter((r) => r.rarity === 4).length);
        let count3 = $derived(history.filter((r) => r.rarity === 3).length);

        function rowClass(rarity: number): string {
                if (rarity === 5) return 'bg-[#C9A45A]/8 border-[#C9A45A]/25 hover:bg-[#C9A45A]/12';
                if (rarity === 4) return 'bg-[#8D72C9]/8 border-[#8D72C9]/25 hover:bg-[#8D72C9]/12';
                return 'bg-[#0B1020]/40 border-[#24314A]/50 hover:bg-[#24314A]/30';
        }

        function rarityTextClass(rarity: number): string {
                if (rarity === 5) return 'text-[#E6C77A]';
                if (rarity === 4) return 'text-[#B495F0]';
                return 'text-[#5E90D6]';
        }

        function elementClass(el?: string): string {
                if (!el) return 'text-[#8E97AA]';
                if (el === 'Pyro')    return 'el-pyro';
                if (el === 'Hydro')   return 'el-hydro';
                if (el === 'Electro') return 'el-electro';
                if (el === 'Dendro')  return 'el-dendro';
                if (el === 'Anemo')   return 'el-anemo';
                if (el === 'Cryo')    return 'el-cryo';
                if (el === 'Geo')     return 'el-geo';
                return 'text-[#8E97AA]';
        }

        function formatTime(ts: number): string {
                const d = new Date(ts);
                return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
                        + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        }
</script>

<div class="bg-[#1A2337]/80 backdrop-blur-sm rounded-xl border border-[#C9A45A]/20 shadow-xl overflow-hidden">
        <!-- Tabs -->
        <div class="flex gap-1 p-3 border-b border-[#24314A] overflow-x-auto">
                <button
                        onclick={() => filter = 'all'}
                        class="px-3 py-1.5 rounded-md text-[11px] font-bold transition-all whitespace-nowrap {filter === 'all' ? 'bg-[#24314A] text-[#F2E6D0] border border-[#C9A45A]/30' : 'bg-[#0B1020] text-[#8E97AA] hover:text-[#B8C1D3] border border-transparent'}"
                >
                        Semua ({history.length})
                </button>
                <button
                        onclick={() => filter = 5}
                        class="px-3 py-1.5 rounded-md text-[11px] font-bold transition-all whitespace-nowrap {filter === 5 ? 'bg-[#C9A45A]/20 text-[#E6C77A] border border-[#C9A45A]/40' : 'bg-[#0B1020] text-[#8E97AA] hover:text-[#B8C1D3] border border-transparent'}"
                >
                        ★5 ({count5})
                </button>
                <button
                        onclick={() => filter = 4}
                        class="px-3 py-1.5 rounded-md text-[11px] font-bold transition-all whitespace-nowrap {filter === 4 ? 'bg-[#8D72C9]/20 text-[#B495F0] border border-[#8D72C9]/40' : 'bg-[#0B1020] text-[#8E97AA] hover:text-[#B8C1D3] border border-transparent'}"
                >
                        ★4 ({count4})
                </button>
                <button
                        onclick={() => filter = 3}
                        class="px-3 py-1.5 rounded-md text-[11px] font-bold transition-all whitespace-nowrap {filter === 3 ? 'bg-[#5E90D6]/20 text-[#5E90D6] border border-[#5E90D6]/40' : 'bg-[#0B1020] text-[#8E97AA] hover:text-[#B8C1D3] border border-transparent'}"
                >
                        ★3 ({count3})
                </button>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto max-h-[600px] overflow-y-auto">
                {#if filtered.length === 0}
                        <div class="text-[#8E97AA] italic text-center py-12 text-sm">
                                Belum ada wish pada filter ini.
                        </div>
                {:else}
                        <table class="w-full text-sm">
                                <thead class="sticky top-0 bg-[#141C2F] z-10">
                                        <tr class="text-left text-[10px] uppercase tracking-wider text-[#8E97AA]">
                                                <th class="px-3 py-2 font-semibold">#</th>
                                                {#if !compact}
                                                        <th class="px-3 py-2 font-semibold">Icon</th>
                                                {/if}
                                                <th class="px-3 py-2 font-semibold">Name</th>
                                                <th class="px-3 py-2 font-semibold">Type</th>
                                                <th class="px-3 py-2 font-semibold">Rarity</th>
                                                <th class="px-3 py-2 font-semibold">Element</th>
                                                <th class="px-3 py-2 font-semibold text-right">Pity</th>
                                                <th class="px-3 py-2 font-semibold text-center">50/50</th>
                                                {#if !compact}
                                                        <th class="px-3 py-2 font-semibold text-right">Time</th>
                                                {/if}
                                        </tr>
                                </thead>
                                <tbody>
                                        <!-- slice(-500).reverse() = O(500) instead of O(n). Shows the 500
                                             most recent entries; older entries are still counted in the
                                             tab badges above (which reflect the FULL filtered history). -->
                                        {#each filtered.slice(-500).reverse() as item (item.id)}
                                                <tr class="border-b border-[#24314A]/40 transition-colors {rowClass(item.rarity)}">
                                                        <td class="px-3 py-2 font-mono text-[10px] text-[#8E97AA] tabular-nums">{item.pullNumber}</td>
                                                        {#if !compact}
                                                                <td class="px-3 py-2">
                                                                        <div class="w-9 h-9 rounded-md overflow-hidden border border-[#24314A] bg-[#0B1020]">
                                                                                <SkeletonImage
                                                                                        src={item.fallbackIcon ?? ''}
                                                                                        fallbacks={[item.icon ?? '']}
                                                                                        alt={item.name}
                                                                                        loading="lazy"
                                                                                        class="relative w-9 h-9"
                                                                                        glyph={item.name.charAt(0)}
                                                                                        glyphClass={item.rarity === 5 ? 'text-[#E6C77A]' : 'text-[#B8C1D3]'}
                                                                                />
                                                                        </div>
                                                                </td>
                                                        {/if}
                                                        <td class="px-3 py-2 font-semibold {item.rarity === 5 ? 'text-[#E6C77A]' : item.rarity === 4 ? 'text-[#B495F0]' : 'text-[#B8C1D3]'}">
                                                                {item.name}
                                                        </td>
                                                        <td class="px-3 py-2 text-[#8E97AA] text-xs capitalize">{item.type}</td>
                                                        <td class="px-3 py-2 {rarityTextClass(item.rarity)} font-bold font-mono text-xs">★{item.rarity}</td>
                                                        <td class="px-3 py-2 {elementClass(item.element)} text-xs font-semibold uppercase">{item.element ?? '—'}</td>
                                                        <td class="px-3 py-2 text-right font-mono text-xs tabular-nums text-[#F2E6D0]">{item.pityCount}</td>
                                                        <td class="px-3 py-2 text-center text-xs">
                                                                {#if item.rarity === 5}
                                                                        {#if item.is5050Win}
                                                                                <span class="text-[#E6C77A] font-bold">WIN</span>
                                                                        {:else}
                                                                                <span class="text-[#E8745A] font-bold">LOSE</span>
                                                                        {/if}
                                                                {:else if item.isRateUp}
                                                                        <span class="text-[#B495F0] font-semibold">Rate-Up</span>
                                                                {:else}
                                                                        <span class="text-[#5E6478]">—</span>
                                                                {/if}
                                                        </td>
                                                        {#if !compact}
                                                                <td class="px-3 py-2 text-right text-[10px] text-[#8E97AA] font-mono">{formatTime(item.timestamp)}</td>
                                                        {/if}
                                                </tr>
                                        {/each}
                                </tbody>
                        </table>
                        {#if filtered.length > 500}
                                <div class="text-center text-[10px] text-[#8E97AA] py-2 border-t border-[#24314A] italic">
                                        Menampilkan 500 pull terbaru dari {filtered.length} total. Pull lebih lama tidak ditampilkan di tabel.
                                </div>
                        {/if}
                {/if}
        </div>
</div>
