<script lang="ts">
        import { onMount } from 'svelte';
        import { fly } from 'svelte/transition';
        import { cubicOut } from 'svelte/easing';
        import ThemedSelect from '$lib/components/ThemedSelect.svelte';
        import {
                simulateNormalBossRuns,
                getAvailableBosses,
                type NormalBossRunResult
        } from '$lib/utils/normalBossEngine';

        const BOSSES = getAvailableBosses();

        let selectedBossId: string = $state(BOSSES[0]!.id);
        let runs: number = $state(10);

        let results = $state<{ runs: NormalBossRunResult[]; totals: { artifacts: number; fiveStar: number; fourStar: number; gems: { r3: number; r4: number; r5: number; r6: number }; bossMats: number }; totalResin: number } | null>(null);

        function doSim() {
                results = simulateNormalBossRuns(runs, selectedBossId);
        }

        // Run once on mount — user clicks Simulate to re-run (avoids $effect over-fire)
        onMount(() => {
                doSim();
        });

        let selectedBoss = $derived(BOSSES.find((b) => b.id === selectedBossId) ?? BOSSES[0]!);
</script>

<div class="space-y-5">

        <!-- ═══ Controls ═══ -->
        <section class="bg-[#1A2337]/80 backdrop-blur-sm rounded-xl border border-[#C9A45A]/25 shadow-xl p-5 space-y-4">
                <h2 class="font-heading text-sm font-semibold text-[#F2E6D0] uppercase tracking-wider">Normal Boss Configuration</h2>

                <!-- Boss Selector -->
                <div class="space-y-2">
                        <ThemedSelect
                                label="Boss"
                                value={selectedBossId}
                                options={BOSSES.map((b) => ({ value: b.id, label: `${b.name} (${b.element})` }))}
                                onchange={(v) => { selectedBossId = v; }}
                        />
                        <div class="text-[11px] text-[#8E97AA] mt-1">
                                Drops: <span class="text-[#E6C77A]">{selectedBoss.material}</span> + ascension gems + artifacts (40 resin/claim, WL8)
                        </div>
                </div>

                <!-- Runs -->
                <div class="space-y-2">
                        <div class="flex justify-between items-center">
                                <label for="runs" class="text-xs font-bold text-[#E6C77A] uppercase tracking-wider">Claims</label>
                                <span class="text-xs font-mono text-[#F2E6D0] tabular-nums">{runs}× ({runs * 40} resin)</span>
                        </div>
                        <input
                                id="runs"
                                type="range"
                                min="1"
                                max="50"
                                bind:value={runs}
                                class="w-full accent-[#C9A45A]"
                        />
                </div>

                <button
                        onclick={doSim}
                        class="btn-press w-full px-4 py-3 rounded-md border border-[#C9A45A]/50 bg-gradient-to-r from-[#C9A45A] to-[#E6C77A] text-[#0B1020] font-heading font-semibold tracking-wider uppercase text-sm transition-all hover:shadow-[0_0_25px_rgba(230,199,122,0.45)]"
                >
                        ✺ Simulate {runs} Claim{runs > 1 ? 's' : ''}
                </button>
        </section>

        <!-- ═══ Result ═══ -->
        {#if results}
                {@const t = results.totals}
                <section class="bg-[#1A2337]/80 backdrop-blur-sm rounded-xl border border-[#C9A45A]/25 shadow-xl p-5 space-y-4" in:fly={{ y: 10, duration: 300, easing: cubicOut }}>
                        <h2 class="font-heading text-sm font-semibold text-[#F2E6D0] uppercase tracking-wider">Drop Results</h2>

                        <!-- Artifacts -->
                        <div class="space-y-2">
                                <div class="text-[10px] text-[#E6C77A] uppercase tracking-wider font-semibold">Artifacts</div>
                                <div class="grid grid-cols-4 gap-2">
                                        <div class="text-center p-3 rounded-md bg-[#C9A45A]/10 border border-[#C9A45A]/30">
                                                <div class="text-[9px] text-[#E6C77A] uppercase">5★ Total</div>
                                                <div class="font-mono text-xl font-bold text-[#E6C77A]">{t.fiveStar}</div>
                                                <div class="text-[9px] text-[#8E97AA]">({(t.fiveStar / runs).toFixed(2)}/run)</div>
                                        </div>
                                        <div class="text-center p-3 rounded-md bg-[#8D72C9]/10 border border-[#8D72C9]/30">
                                                <div class="text-[9px] text-[#B495F0] uppercase">4★ Total</div>
                                                <div class="font-mono text-xl font-bold text-[#B495F0]">{t.fourStar}</div>
                                                <div class="text-[9px] text-[#8E97AA]">({(t.fourStar / runs).toFixed(2)}/run)</div>
                                        </div>
                                        <div class="text-center p-3 rounded-md bg-[#0B1020]/60 border border-[#24314A] col-span-2">
                                                <div class="text-[9px] text-[#8E97AA] uppercase">Total Artifacts</div>
                                                <div class="font-mono text-xl font-bold text-[#F2E6D0]">{t.artifacts}</div>
                                                <div class="text-[9px] text-[#8E97AA]">({(t.artifacts / runs).toFixed(2)}/run)</div>
                                        </div>
                                </div>
                        </div>

                        <!-- Ascension Gems -->
                        <div class="space-y-2">
                                <div class="text-[10px] text-[#B495F0] uppercase tracking-wider font-semibold">Ascension Gems</div>
                                <div class="grid grid-cols-4 gap-2">
                                        <div class="text-center p-3 rounded-md bg-[#5E90D6]/10 border border-[#5E90D6]/30">
                                                <div class="text-[9px] text-[#5E90D6] uppercase">3★ Sliver</div>
                                                <div class="font-mono text-lg font-bold text-[#5E90D6]">{t.gems.r3}</div>
                                        </div>
                                        <div class="text-center p-3 rounded-md bg-[#8D72C9]/10 border border-[#8D72C9]/30">
                                                <div class="text-[9px] text-[#B495F0] uppercase">4★ Fragment</div>
                                                <div class="font-mono text-lg font-bold text-[#B495F0]">{t.gems.r4}</div>
                                        </div>
                                        <div class="text-center p-3 rounded-md bg-[#C9A45A]/10 border border-[#C9A45A]/30">
                                                <div class="text-[9px] text-[#E6C77A] uppercase">5★ Chunk</div>
                                                <div class="font-mono text-lg font-bold text-[#E6C77A]">{t.gems.r5}</div>
                                        </div>
                                        <div class="text-center p-3 rounded-md bg-[#E0B25A]/10 border border-[#E0B25A]/30">
                                                <div class="text-[9px] text-[#E0B25A] uppercase">6★ Gemstone</div>
                                                <div class="font-mono text-lg font-bold text-[#E0B25A]">{t.gems.r6}</div>
                                        </div>
                                </div>
                        </div>

                        <!-- Boss Material -->
                        <div class="text-center p-3 rounded-md bg-[#0B1020]/60 border border-[#24314A]">
                                <div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">{selectedBoss.material}</div>
                                <div class="font-mono text-xl font-bold text-[#E6C77A] tabular-nums mt-1">{t.bossMats}</div>
                                <div class="text-[9px] text-[#8E97AA] mt-0.5">{(t.bossMats / runs).toFixed(2)} per claim</div>
                        </div>

                        <!-- Info -->
                        <div class="text-[11px] text-[#8E97AA] bg-[#0B1020]/40 border border-[#24314A] rounded-md p-3 leading-relaxed">
                                <span class="text-[#E6C77A] font-semibold">Expected per claim (WL8):</span>
                                1× 5★ artifact (guaranteed) · ~1.47× 4★ · ~2.1× 3★ · ~2.1× 2★
                                <br><span class="text-[#8E97AA]">Gems: ~2.16 sliver · ~1.60 fragment · ~0.144 chunk · ~0.014 gemstone (very rare)</span>
                        </div>
                </section>
        {/if}

</div>
