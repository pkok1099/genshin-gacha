<script lang="ts">
        import { onMount } from 'svelte';
        import { fly } from 'svelte/transition';
        import { cubicOut } from 'svelte/easing';
        import { simulateParametricTransform, getCategoryLabel, getAllCategories, PARAMETRIC_CONSTANTS, type ParametricCategory, type ParametricSimulation } from '$lib/utils/parametricEngine';

        let packs: number = $state(4); // 4 packs = 4 weeks
        let result: ParametricSimulation | null = $state(null);

        function doSim() {
                result = simulateParametricTransform(packs);
        }

        // Run once on mount — user clicks Transmute to re-run
        onMount(() => {
                doSim();
        });

        const ALL_CATS = getAllCategories();

        function catColor(cat: ParametricCategory): string {
                if (cat === 'characterExp')    return 'text-[#E6C77A] border-[#C9A45A]/40 bg-[#C9A45A]/10';
                if (cat === 'weaponExp')       return 'text-[#B495F0] border-[#8D72C9]/40 bg-[#8D72C9]/10';
                if (cat === 'ascensionGems')   return 'text-[#5E90D6] border-[#5E90D6]/40 bg-[#5E90D6]/10';
                if (cat === 'weaponAscension') return 'text-[#E0B25A] border-[#E0B25A]/40 bg-[#E0B25A]/10';
                return 'text-[#6FAF6E] border-[#6FAF6E]/40 bg-[#6FAF6E]/10';
        }
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <!-- ═══ Controls ═══ -->
        <section class="bg-[#1A2337]/80 backdrop-blur-sm rounded-xl border border-[#C9A45A]/25 shadow-xl p-5 space-y-4">
                <h2 class="font-heading text-sm font-semibold text-[#F2E6D0] uppercase tracking-wider">Parametric Transformer</h2>
                <p class="text-xs text-[#8E97AA] leading-relaxed">
                        Gadget dengan cooldown <span class="text-[#E6C77A] font-mono">{PARAMETRIC_CONSTANTS.COOLDOWN_DAYS} hari</span>.
                        Feed <span class="text-[#E6C77A] font-mono">{PARAMETRIC_CONSTANTS.INPUT_QUALITY_POINTS}</span> quality points →
                        <span class="text-[#E6C77A] font-mono">20,000 Mora</span> + 1 material category per pack.
                </p>

                <!-- Packs -->
                <div class="space-y-2">
                        <div class="flex justify-between items-center">
                                <label for="packs" class="text-xs font-bold text-[#E6C77A] uppercase tracking-wider">Packs (Weeks)</label>
                                <span class="text-xs font-mono text-[#F2E6D0] tabular-nums">{packs}× = {packs * 7} days</span>
                        </div>
                        <input
                                id="packs"
                                type="range"
                                min="1"
                                max="12"
                                bind:value={packs}
                                class="w-full accent-[#C9A45A]"
                        />
                        <div class="flex justify-between text-[10px] text-[#8E97AA]">
                                <span>1 week</span>
                                <span>6 weeks</span>
                                <span>12 weeks</span>
                        </div>
                </div>

                <button
                        onclick={doSim}
                        class="btn-press w-full px-4 py-3 rounded-md border border-[#C9A45A]/50 bg-gradient-to-r from-[#C9A45A] to-[#E6C77A] text-[#0B1020] font-heading font-semibold tracking-wider uppercase text-sm transition-all hover:shadow-[0_0_25px_rgba(230,199,122,0.45)]"
                >
                        ◈ Transmute {packs}×
                </button>

                <!-- Category reference -->
                <div class="text-[10px] text-[#8E97AA] bg-[#0B1020]/40 border border-[#24314A] rounded-md p-3 leading-relaxed">
                        <span class="text-[#E6C77A] font-semibold">Possible Categories (uniform):</span>
                        {#each ALL_CATS as cat}
                                <div class="mt-0.5">• {getCategoryLabel(cat)}</div>
                        {/each}
                </div>
        </section>

        <!-- ═══ Result ═══ -->
        <section class="bg-[#1A2337]/80 backdrop-blur-sm rounded-xl border border-[#C9A45A]/25 shadow-xl p-5 space-y-4" in:fly={{ y: 10, duration: 300, easing: cubicOut }}>
                <h2 class="font-heading text-sm font-semibold text-[#F2E6D0] uppercase tracking-wider">Transmutation Results</h2>

                {#if result}
                        <!-- Totals -->
                        <div class="grid grid-cols-3 gap-2 mb-3">
                                <div class="text-center p-3 rounded-md bg-[#C9A45A]/10 border border-[#C9A45A]/30">
                                        <div class="text-[9px] text-[#E6C77A] uppercase">Total Mora</div>
                                        <div class="font-mono text-base font-bold text-[#E6C77A] tabular-nums">{result.totalMora.toLocaleString('en-US')}</div>
                                </div>
                                <div class="text-center p-3 rounded-md bg-[#5E90D6]/10 border border-[#5E90D6]/30">
                                        <div class="text-[9px] text-[#5E90D6] uppercase">2★ Mats</div>
                                        <div class="font-mono text-base font-bold text-[#5E90D6]">{result.totalTier2}</div>
                                </div>
                                <div class="text-center p-3 rounded-md bg-[#8D72C9]/10 border border-[#8D72C9]/30">
                                        <div class="text-[9px] text-[#B495F0] uppercase">3★ Mats</div>
                                        <div class="font-mono text-base font-bold text-[#B495F0]">{result.totalTier3}</div>
                                </div>
                        </div>

                        <!-- By Category -->
                        <div class="space-y-1.5">
                                <div class="text-[10px] text-[#8E97AA] uppercase tracking-wider">By Category</div>
                                {#each ALL_CATS as cat}
                                        {@const c = result.byCategory[cat]}
                                        {#if c.count > 0}
                                                <div class="px-3 py-2 rounded-md border {catColor(cat)}">
                                                        <div class="flex justify-between items-center">
                                                                <span class="text-xs font-semibold">{getCategoryLabel(cat)}</span>
                                                                <span class="text-[10px] font-mono text-[#8E97AA]">{c.count}× pack</span>
                                                        </div>
                                                        <div class="text-[10px] mt-0.5">
                                                                2★: <span class="font-mono font-bold">{c.t2}</span>
                                                                · 3★: <span class="font-mono font-bold">{c.t3}</span>
                                                        </div>
                                                </div>
                                        {/if}
                                {/each}
                        </div>

                        <!-- Per-pack log -->
                        <div class="space-y-1 max-h-48 overflow-y-auto pr-1">
                                <div class="text-[10px] text-[#8E97AA] uppercase tracking-wider">Pack Log</div>
                                {#each result.drops as drop, i}
                                        <div class="text-[11px] px-2 py-1.5 rounded bg-[#0B1020]/40 border border-[#24314A]/40 flex items-center gap-2">
                                                <span class="font-mono text-[#8E97AA] w-8">#{i + 1}</span>
                                                <span class="text-[#B8C1D3] flex-1">{getCategoryLabel(drop.category)}</span>
                                                <span class="font-mono text-[#E6C77A] text-[10px]">2★:{drop.tier2Count} 3★:{drop.tier3Count}</span>
                                        </div>
                                {/each}
                        </div>
                {/if}
        </section>

</div>
