<script lang="ts">
        import { fade, fly } from 'svelte/transition';
        import { cubicOut } from 'svelte/easing';
        import ThemedSelect from '$lib/components/ThemedSelect.svelte';
        import {
                rollArtifact,
                formatValue,
                getStatLabel,
                isStatPercent,
                type ArtifactSlot,
                type StatKey,
                type ArtifactSimulation
        } from '$lib/utils/artifactRng';

        let slot: ArtifactSlot = $state('circlet');
        let rarity: 5 | 4 = $state(5);
        let mainStat: StatKey | 'auto' = $state('auto');
        let force4Subs: boolean = $state(false);
        let simulation: ArtifactSimulation | null = $state(null);

        const SLOTS: { id: ArtifactSlot; label: string }[] = [
                { id: 'flower',  label: 'Flower of Life' },
                { id: 'plume',   label: 'Plume of Death' },
                { id: 'sands',   label: 'Sands of Eon' },
                { id: 'goblet',  label: 'Goblet of Eonothem' },
                { id: 'circlet', label: 'Circlet of Logos' }
        ];

        const MAIN_STATS_BY_SLOT: Record<ArtifactSlot, { key: StatKey; label: string }[]> = {
                flower:  [{ key: 'hp', label: 'HP Flat' }],
                plume:   [{ key: 'atk', label: 'ATK Flat' }],
                sands:   [
                        { key: 'hpPct', label: 'HP %' },
                        { key: 'atkPct', label: 'ATK %' },
                        { key: 'defPct', label: 'DEF %' },
                        { key: 'elementalMastery', label: 'Elemental Mastery' },
                        { key: 'energyRecharge', label: 'Energy Recharge' }
                ],
                goblet:  [
                        { key: 'hpPct', label: 'HP %' },
                        { key: 'atkPct', label: 'ATK %' },
                        { key: 'defPct', label: 'DEF %' },
                        { key: 'elementalMastery', label: 'Elemental Mastery' },
                        { key: 'physicalDmg', label: 'Physical DMG' },
                        { key: 'pyroDmg', label: 'Pyro DMG' },
                        { key: 'hydroDmg', label: 'Hydro DMG' },
                        { key: 'electroDmg', label: 'Electro DMG' },
                        { key: 'cryoDmg', label: 'Cryo DMG' },
                        { key: 'dendroDmg', label: 'Dendro DMG' },
                        { key: 'anemoDmg', label: 'Anemo DMG' },
                        { key: 'geoDmg', label: 'Geo DMG' }
                ],
                circlet: [
                        { key: 'hpPct', label: 'HP %' },
                        { key: 'atkPct', label: 'ATK %' },
                        { key: 'defPct', label: 'DEF %' },
                        { key: 'elementalMastery', label: 'Elemental Mastery' },
                        { key: 'energyRecharge', label: 'Energy Recharge' },
                        { key: 'critRate', label: 'CRIT Rate' },
                        { key: 'critDmg', label: 'CRIT DMG' },
                        { key: 'healingBonus', label: 'Healing Bonus' }
                ]
        };

        let availableMainStats = $derived(MAIN_STATS_BY_SLOT[slot]);

        function doRoll() {
                const mainKey = mainStat === 'auto' ? undefined : mainStat;
                const forcedCount = force4Subs ? 4 : undefined;
                simulation = rollArtifact(slot, rarity, mainKey, forcedCount);
        }

        function statColor(key: StatKey): string {
                if (key === 'critRate' || key === 'critDmg') return 'text-[#E6C77A]';
                if (key === 'atkPct' || key === 'atk') return 'text-[#E8745A]';
                if (key === 'hpPct' || key === 'hp') return 'text-[#4A8FE0]';
                if (key === 'defPct' || key === 'def') return 'text-[#E0B25A]';
                if (key === 'elementalMastery') return 'text-[#6FAF6E]';
                if (key === 'energyRecharge') return 'text-[#5FC9B8]';
                return 'text-[#B8C1D3]';
        }
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <!-- ═══ Controls ═══ -->
        <section class="bg-[#1A2337]/80 backdrop-blur-sm rounded-xl border border-[#C9A45A]/25 shadow-xl p-5 space-y-4">
                <h2 class="font-heading text-sm font-semibold text-[#F2E6D0] uppercase tracking-wider">Artifact Configuration</h2>

                <!-- Slot -->
                <div class="space-y-2">
                        <!-- svelte-ignore a11y_label_has_associated_control -->
                        <label class="text-xs font-bold text-[#E6C77A] uppercase tracking-wider">Slot</label>
                        <div class="grid grid-cols-5 gap-1">
                                {#each SLOTS as s}
                                        <button
                                                onclick={() => { slot = s.id; mainStat = 'auto'; }}
                                                class="px-2 py-2 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all {slot === s.id ? 'bg-[#C9A45A]/20 text-[#E6C77A] border border-[#C9A45A]/40' : 'bg-[#0B1020]/60 text-[#8E97AA] hover:text-[#B8C1D3] border border-transparent'}"
                                                title={s.label}
                                        >
                                                {s.id.slice(0, 3)}
                                        </button>
                                {/each}
                        </div>
                </div>

                <!-- Rarity -->
                <div class="space-y-2">
                        <!-- svelte-ignore a11y_label_has_associated_control -->
                        <label class="text-xs font-bold text-[#E6C77A] uppercase tracking-wider">Rarity</label>
                        <div class="grid grid-cols-2 gap-2">
                                <button
                                        onclick={() => rarity = 5}
                                        class="px-3 py-2 rounded-md text-xs font-bold transition-all {rarity === 5 ? 'bg-[#C9A45A]/20 text-[#E6C77A] border border-[#C9A45A]/40' : 'bg-[#0B1020]/60 text-[#8E97AA] border border-transparent'}"
                                >
                                        5★ (max +20)
                                </button>
                                <button
                                        onclick={() => rarity = 4}
                                        class="px-3 py-2 rounded-md text-xs font-bold transition-all {rarity === 4 ? 'bg-[#8D72C9]/20 text-[#B495F0] border border-[#8D72C9]/40' : 'bg-[#0B1020]/60 text-[#8E97AA] border border-transparent'}"
                                >
                                        4★ (max +16)
                                </button>
                        </div>
                </div>

                <!-- Main Stat -->
                <div class="space-y-2">
                        <ThemedSelect
                                label="Main Stat"
                                value={mainStat}
                                options={[
                                        { value: 'auto', label: 'Auto (Random)' },
                                        ...availableMainStats.map((s) => ({ value: s.key, label: s.label }))
                                ]}
                                onchange={(v) => { mainStat = v as StatKey | 'auto'; }}
                        />
                </div>

                <!-- Force 4 initial substats -->
                <div class="flex items-center justify-between p-3 rounded-lg bg-[#0B1020]/60 border border-[#24314A]">
                        <div>
                                <div class="text-xs font-bold text-[#E6C77A] uppercase tracking-wider">Force 4 Initial Substats</div>
                                <div class="text-[11px] text-[#8E97AA] mt-0.5">Default 5★ = 75% chance 3 subs, 25% chance 4 subs. Toggle ON untuk selalu mulai 4 substats.</div>
                        </div>
                        <button
                                onclick={() => force4Subs = !force4Subs}
                                class="relative w-12 h-6 rounded-full transition-colors shrink-0 {force4Subs ? 'bg-[#C9A45A]' : 'bg-[#24314A]'}"
                                aria-pressed={force4Subs}
                                aria-label="Toggle force 4 initial substats"
                        >
                                <span class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-[#F2E6D0] transition-transform {force4Subs ? 'translate-x-6' : ''}"></span>
                        </button>
                </div>

                <button
                        onclick={doRoll}
                        class="w-full px-4 py-3 rounded-md border border-[#C9A45A]/50 bg-gradient-to-r from-[#C9A45A] to-[#E6C77A] text-[#0B1020] font-heading font-semibold tracking-wider uppercase text-sm transition-all hover:shadow-[0_0_25px_rgba(230,199,122,0.45)]"
                >
                        ◈ Roll Artifact
                </button>

                <!-- Mechanics info -->
                <div class="text-[10px] text-[#8E97AA] bg-[#0B1020]/40 border border-[#24314A] rounded-md p-3 leading-relaxed">
                        <span class="text-[#E6C77A] font-semibold">Substat Mechanics:</span>
                        • 5★: 3-4 substats awal, upgrade tiap +4 level (total 5 upgrade)
                        • 4★: selalu 3 substats, upgrade tiap +4 level (total 4 upgrade)
                        • Setiap upgrade: +1 dari 4 step values (low/mid/high/max roll)
                        • Substat tidak boleh sama dengan main stat
                </div>
        </section>

        <!-- ═══ Result ═══ -->
        <section class="bg-[#1A2337]/80 backdrop-blur-sm rounded-xl border border-[#C9A45A]/25 shadow-xl p-5 space-y-4">
                <h2 class="font-heading text-sm font-semibold text-[#F2E6D0] uppercase tracking-wider">Roll Result</h2>

                {#if simulation}
                        {#key simulation}
                                {@const sim = simulation}
                                <div class="space-y-4" in:fly={{ y: 10, duration: 300, easing: cubicOut }}>
                                        <!-- Artifact card -->
                                        <div class="rounded-lg border {sim.rarity === 5 ? 'border-[#E6C77A]/50 gold-glow' : 'border-[#B495F0]/50 purple-glow'} bg-gradient-to-br from-[#1A2337] to-[#0B1020] p-4">
                                                <div class="flex items-start justify-between mb-3">
                                                        <div>
                                                                <div class="text-[10px] text-[#8E97AA] uppercase tracking-wider">{SLOTS.find((s) => s.id === sim.slot)?.label}</div>
                                                                <div class="font-mono text-xs text-[#E6C77A] mt-0.5">+{sim.rarity === 5 ? 20 : 16} ★{sim.rarity}</div>
                                                        </div>
                                                        <div class="text-right">
                                                                <div class="text-[10px] text-[#8E97AA] uppercase tracking-wider">Main Stat</div>
                                                                <div class="text-sm font-bold text-[#F2E6D0]">{getStatLabel(sim.mainStat.key)}</div>
                                                                <div class="font-mono text-base font-bold text-[#E6C77A]">
                                                                        {sim.mainStat.isPercent ? `${sim.mainStat.value.toFixed(1)}%` : Math.round(sim.mainStat.value).toLocaleString('en-US')}
                                                                </div>
                                                        </div>
                                                </div>

                                                <!-- Final substats -->
                                                <div class="space-y-1.5">
                                                        <div class="text-[10px] text-[#8E97AA] uppercase tracking-wider mb-1">Final Substats</div>
                                                        {#each sim.finalSubstats as sub}
                                                                <div class="flex justify-between items-center px-2 py-1.5 rounded bg-[#0B1020]/60 border border-[#24314A]/40">
                                                                        <span class="text-xs {statColor(sub.key)} font-medium">{getStatLabel(sub.key)}</span>
                                                                        <span class="font-mono text-sm font-bold {statColor(sub.key)} tabular-nums">{formatValue(sub)}</span>
                                                                </div>
                                                        {/each}
                                                </div>
                                        </div>

                                        <!-- Upgrade log -->
                                        <div class="space-y-1.5">
                                                <div class="text-[10px] text-[#8E97AA] uppercase tracking-wider">Upgrade Timeline</div>
                                                <div class="max-h-64 overflow-y-auto space-y-1 pr-1">
                                                        {#each sim.rolls as roll}
                                                                <div class="text-[11px] px-2 py-1.5 rounded bg-[#0B1020]/40 border-l-2 border-[#C9A45A]/40 text-[#B8C1D3] font-mono leading-relaxed">
                                                                        {roll.description}
                                                                </div>
                                                        {/each}
                                                </div>
                                        </div>

                                        <!-- Quick verdict -->
                                        {#if simulation}
                                                {@const critRate = sim.finalSubstats.find((s) => s.key === 'critRate')?.value ?? 0}
                                                {@const critDmg = sim.finalSubstats.find((s) => s.key === 'critDmg')?.value ?? 0}
                                                {@const hasBothCrit = critRate > 0 && critDmg > 0}
                                                {@const cv = critRate * 2 + critDmg}
                                                <div class="text-[11px] text-[#8E97AA] bg-[#0B1020]/40 border border-[#24314A] rounded-md p-3 leading-relaxed">
                                                        <span class="text-[#E6C77A] font-semibold">Verdict:</span>
                                                        {#if hasBothCrit && cv >= 40}
                                                                <span class="text-[#6FAF6E] font-semibold">Excellent!</span> CV {cv.toFixed(1)} — god-tier artifact.
                                                        {:else if hasBothCrit && cv >= 30}
                                                                <span class="text-[#E6C77A] font-semibold">Good.</span> CV {cv.toFixed(1)} — solid build material.
                                                        {:else if hasBothCrit}
                                                                <span class="text-[#B8C1D3]">OK.</span> CV {cv.toFixed(1)} — usable but could be better.
                                                        {:else}
                                                                <span class="text-[#E8745A]">Bad.</span> Tidak punya kedua crit substat — fodder.
                                                        {/if}
                                                </div>
                                        {/if}
                                </div>
                        {/key}
                {:else}
                        <div class="text-center py-12 text-[#8E97AA] text-sm">
                                <div class="text-4xl text-[#C9A45A]/40 mb-3">◈</div>
                                Klik <span class="text-[#E6C77A] font-semibold">Roll Artifact</span> untuk simulasikan.
                        </div>
                {/if}
        </section>

</div>
