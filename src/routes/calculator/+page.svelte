<script lang="ts">
        import { getGameState } from '$lib/stores/gameState.svelte';
        import { t, localeKey } from '$lib/i18n/index.svelte';
        import { primeAudio, playTick, playSuccess } from '$lib/audio/synth.svelte';
        import ThemedRange from '$lib/components/ThemedRange.svelte';
        import {
                cumulative5StarProbability,
                cumulativeFeaturedProbability,
                expectedPullsPer5Star,
                expectedPullsPerFeatured,
                bestWorstCase,
                runWhatIfSimulation,
                type WhatIfResult
        } from '$lib/utils/pityCalculator';
        import { fly, fade } from 'svelte/transition';
        import { cubicOut } from 'svelte/easing';

        // Re-render on locale change
        void localeKey();

        const game = getGameState();

        // ── Tab state ──
        type Tab = 'pity-calc' | 'what-if';
        let activeTab: Tab = $state('pity-calc');

        // ── Pity Calculator inputs ──
        let inputPity5 = $state(0);
        let inputPity4 = $state(0);
        let inputGuaranteed = $state(false);
        let inputTargetPulls = $state(90);

        function useCurrentState() {
                inputPity5 = game.pity5;
                inputPity4 = game.pity4;
                inputGuaranteed = game.guaranteed5;
                playTick();
        }

        // ── Pity Calculator derived results ──
        let cumulative5 = $derived(cumulative5StarProbability(inputPity5, inputTargetPulls));
        let cumulativeFeatured = $derived(cumulativeFeaturedProbability(inputPity5, inputGuaranteed, inputTargetPulls));
        let expPer5 = $derived(expectedPullsPer5Star(inputPity5));
        let expPerFeatured = $derived(expectedPullsPerFeatured(inputPity5, inputGuaranteed));
        let bwCase = $derived(bestWorstCase(inputPity5, inputGuaranteed));

        let p5ByN = $derived(cumulative5[cumulative5.length - 1]?.p5StarByThisPull ?? 0);
        let pFeaturedByN = $derived(cumulativeFeatured[cumulativeFeatured.length - 1]?.pFeaturedByThisPull ?? 0);

        let primoCost = $derived(inputTargetPulls * 160);

        // ── What-If state ──
        interface ScenarioInput {
                pity5: number;
                guaranteed: boolean;
                trials: number;
        }
        let scenarioA: ScenarioInput = $state({ pity5: 0, guaranteed: false, trials: 500 });
        let scenarioB: ScenarioInput = $state({ pity5: 74, guaranteed: false, trials: 500 });
        let resultA: WhatIfResult | null = $state(null);
        let resultB: WhatIfResult | null = $state(null);
        let running = $state(false);

        async function runSimulations() {
                primeAudio();
                playTick();
                running = true;
                // Defer to next tick so UI can show "Running..." state
                await new Promise((r) => setTimeout(r, 50));
                try {
                        resultA = runWhatIfSimulation({
                                startingPity5: scenarioA.pity5,
                                guaranteed: scenarioA.guaranteed,
                                trials: scenarioA.trials
                        });
                        resultB = runWhatIfSimulation({
                                startingPity5: scenarioB.pity5,
                                guaranteed: scenarioB.guaranteed,
                                trials: scenarioB.trials
                        });
                        playSuccess();
                } finally {
                        running = false;
                }
        }

        // Chart helpers — render cumulative curve as inline SVG
        const CHART_W = 600;
        const CHART_H = 200;
        const CHART_PAD = 28;

        function buildPath(points: { pullCount: number; p: number }[], maxX: number): string {
                if (points.length === 0) return '';
                const innerW = CHART_W - CHART_PAD * 2;
                const innerH = CHART_H - CHART_PAD * 2;
                return points.map((p, i) => {
                        const x = CHART_PAD + (p.pullCount / maxX) * innerW;
                        const y = CHART_H - CHART_PAD - p.p * innerH;
                        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                }).join(' ');
        }

        let curve5Path = $derived(buildPath(
                cumulative5.map((p) => ({ pullCount: p.pullCount, p: p.p5StarByThisPull })),
                inputTargetPulls
        ));
        let curveFeaturedPath = $derived(buildPath(
                cumulativeFeatured.map((p) => ({ pullCount: p.pullCount, p: p.pFeaturedByThisPull })),
                inputTargetPulls
        ));

        const Y_TICKS = [0, 0.25, 0.5, 0.75, 1.0];

        function fmtPct(p: number): string {
                return `${(p * 100).toFixed(1)}%`;
        }

        function fmtNum(n: number): string {
                return n.toLocaleString('en-US');
        }

        function maxDistCount(r: WhatIfResult | null): number {
                if (!r) return 1;
                return Math.max(1, ...r.distribution.map((d) => d.count));
        }

        function switchTab(tab: Tab) {
                activeTab = tab;
                playTick();
        }
</script>

<svelte:head>
        <title>{t('calc.title')} — Genshin Impact Simulator</title>
</svelte:head>

<div class="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 space-y-6">

        <!-- ═══ Header ═══ -->
        <section class="space-y-2">
                <h1 class="font-heading text-3xl md:text-4xl font-bold text-[#F2E6D0]">{t('calc.title')}</h1>
                <p class="text-sm text-[#B8C1D3] max-w-2xl">{t('calc.subtitle')}</p>
        </section>

        <!-- ═══ Tabs ═══ -->
        <section class="flex gap-1 p-1 rounded-lg bg-[#1A2337]/60 border border-[#24314A] w-fit">
                <button
                        onclick={() => switchTab('pity-calc')}
                        class="btn-press px-4 py-2 rounded-md text-xs font-heading font-semibold uppercase tracking-wider transition-all {activeTab === 'pity-calc' ? 'bg-gradient-to-r from-[#C9A45A] to-[#E6C77A] text-[#0B1020] shadow-md' : 'text-[#B8C1D3] hover:text-[#F2E6D0] hover:bg-[#24314A]/60'}"
                >
                        {t('calc.tab.pity-calc')}
                </button>
                <button
                        onclick={() => switchTab('what-if')}
                        class="btn-press px-4 py-2 rounded-md text-xs font-heading font-semibold uppercase tracking-wider transition-all {activeTab === 'what-if' ? 'bg-gradient-to-r from-[#C9A45A] to-[#E6C77A] text-[#0B1020] shadow-md' : 'text-[#B8C1D3] hover:text-[#F2E6D0] hover:bg-[#24314A]/60'}"
                >
                        {t('calc.tab.what-if')}
                </button>
        </section>

        <!-- ═══ Pity Calculator ═══ -->
        {#if activeTab === 'pity-calc'}
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-5" in:fade={{ duration: 200 }}>

                        <!-- Inputs -->
                        <section class="bg-[#1A2337]/80 backdrop-blur-sm rounded-xl border border-[#C9A45A]/25 shadow-xl p-5 space-y-4">
                                <div class="flex justify-between items-center">
                                        <h2 class="font-heading text-sm font-semibold text-[#F2E6D0] uppercase tracking-wider">Inputs</h2>
                                        <button
                                                onclick={useCurrentState}
                                                class="btn-press text-[10px] text-[#C9A45A] hover:text-[#E6C77A] transition-colors px-2 py-1 rounded border border-[#C9A45A]/30 hover:border-[#C9A45A]/60"
                                        >
                                                {t('calc.use-current')}
                                        </button>
                                </div>

                                <ThemedRange
                                        value={inputPity5}
                                        min={0}
                                        max={89}
                                        step={1}
                                        label={t('calc.input.current-pity-5')}
                                        accent="gold"
                                        oninput={(e) => { inputPity5 = parseInt((e.currentTarget as HTMLInputElement).value, 10); }}
                                />

                                <ThemedRange
                                        value={inputPity4}
                                        min={0}
                                        max={9}
                                        step={1}
                                        label={t('calc.input.current-pity-4')}
                                        accent="purple"
                                        oninput={(e) => { inputPity4 = parseInt((e.currentTarget as HTMLInputElement).value, 10); }}
                                />

                                <ThemedRange
                                        value={inputTargetPulls}
                                        min={1}
                                        max={180}
                                        step={1}
                                        label={t('calc.input.target-pulls')}
                                        suffix="pulls"
                                        accent="blue"
                                        oninput={(e) => { inputTargetPulls = parseInt((e.currentTarget as HTMLInputElement).value, 10); }}
                                />
                                <p class="text-[10px] text-[#8E97AA] -mt-2">{t('calc.input.target-pulls.hint')}</p>

                                <label class="flex items-center gap-3 cursor-pointer pt-2">
                                        <input
                                                type="checkbox"
                                                checked={inputGuaranteed}
                                                onchange={(e) => { inputGuaranteed = (e.currentTarget as HTMLInputElement).checked; }}
                                                class="w-4 h-4 accent-[#C9A45A]"
                                        />
                                        <span class="text-sm text-[#F2E6D0]">{t('calc.input.guaranteed')}</span>
                                </label>
                        </section>

                        <!-- Results -->
                        <section class="bg-[#1A2337]/80 backdrop-blur-sm rounded-xl border border-[#C9A45A]/25 shadow-xl p-5 space-y-4">
                                <h2 class="font-heading text-sm font-semibold text-[#F2E6D0] uppercase tracking-wider">{t('calc.result.title')}</h2>

                                <div class="grid grid-cols-2 gap-3">
                                        <div class="text-center p-3 rounded-md bg-[#C9A45A]/10 border border-[#C9A45A]/30">
                                                <div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">{t('calc.result.p-5star-by', { n: inputTargetPulls })}</div>
                                                <div class="font-mono text-2xl font-bold text-[#E6C77A] tabular-nums">{fmtPct(p5ByN)}</div>
                                        </div>
                                        <div class="text-center p-3 rounded-md bg-[#8D72C9]/10 border border-[#8D72C9]/30">
                                                <div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">{t('calc.result.p-featured-by', { n: inputTargetPulls })}</div>
                                                <div class="font-mono text-2xl font-bold text-[#B495F0] tabular-nums">{fmtPct(pFeaturedByN)}</div>
                                        </div>
                                </div>

                                <div class="grid grid-cols-2 gap-2 pt-2 border-t border-[#24314A]">
                                        <div class="p-2 rounded-md bg-[#0B1020]/60 border border-[#24314A] text-center">
                                                <div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">{t('calc.result.expected-pulls-5')}</div>
                                                <div class="font-mono text-base font-bold text-[#F2E6D0] tabular-nums">{expPer5.toFixed(1)}</div>
                                        </div>
                                        <div class="p-2 rounded-md bg-[#0B1020]/60 border border-[#24314A] text-center">
                                                <div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">{t('calc.result.expected-pulls-featured')}</div>
                                                <div class="font-mono text-base font-bold text-[#F2E6D0] tabular-nums">{expPerFeatured.toFixed(1)}</div>
                                        </div>
                                </div>

                                <div class="grid grid-cols-2 gap-2 pt-2 border-t border-[#24314A]">
                                        <div class="p-3 rounded-md bg-[#6FAF6E]/10 border border-[#6FAF6E]/30">
                                                <div class="text-[9px] text-[#6FAF6E] uppercase tracking-wider font-bold">{t('calc.result.best-case')}</div>
                                                <div class="font-mono text-lg font-bold text-[#6FAF6E] tabular-nums">{bwCase.bestCase} pulls</div>
                                                <div class="text-[10px] text-[#8E97AA] mt-0.5">{t('calc.result.best-case.body')}</div>
                                        </div>
                                        <div class="p-3 rounded-md bg-[#8B3A3A]/15 border border-[#8B3A3A]/40">
                                                <div class="text-[9px] text-[#E8745A] uppercase tracking-wider font-bold">{t('calc.result.worst-case')}</div>
                                                <div class="font-mono text-lg font-bold text-[#E8745A] tabular-nums">{bwCase.worstCase} pulls</div>
                                                <div class="text-[10px] text-[#8E97AA] mt-0.5">{t('calc.result.worst-case.body')}</div>
                                        </div>
                                </div>

                                <div class="p-3 rounded-md bg-[#C9A45A]/10 border border-[#C9A45A]/30 text-center">
                                        <div class="text-[9px] text-[#E6C77A] uppercase tracking-wider font-bold">{t('calc.result.primo-cost')}</div>
                                        <div class="font-mono text-xl font-bold text-[#E6C77A] tabular-nums">{fmtNum(primoCost)}</div>
                                        <div class="text-[10px] text-[#8E97AA] mt-0.5">{t('calc.result.primo-cost.body', { cost: fmtNum(primoCost), n: inputTargetPulls })}</div>
                                </div>
                        </section>

                        <!-- Probability Chart -->
                        <section class="lg:col-span-2 bg-[#1A2337]/80 backdrop-blur-sm rounded-xl border border-[#C9A45A]/25 shadow-xl p-5">
                                <h3 class="font-heading text-sm font-semibold text-[#F2E6D0] uppercase tracking-wider mb-3">{t('calc.chart.title')}</h3>
                                <div class="overflow-x-auto">
                                        <svg viewBox="0 0 {CHART_W} {CHART_H}" class="w-full h-auto min-w-[500px]" preserveAspectRatio="xMidYMid meet">
                                                {#each Y_TICKS as tick}
                                                        <line
                                                                x1={CHART_PAD} y1={CHART_H - CHART_PAD - tick * (CHART_H - CHART_PAD * 2)}
                                                                x2={CHART_W - CHART_PAD} y2={CHART_H - CHART_PAD - tick * (CHART_H - CHART_PAD * 2)}
                                                                stroke="rgba(36, 49, 74, 0.4)" stroke-width="1"
                                                        />
                                                        <text
                                                                x={CHART_PAD - 4} y={CHART_H - CHART_PAD - tick * (CHART_H - CHART_PAD * 2) + 3}
                                                                fill="#8E97AA" font-size="9" font-family="JetBrains Mono" text-anchor="end"
                                                        >{tick * 100}</text>
                                                {/each}

                                                {#if 74 - inputPity5 > 0 && 74 - inputPity5 <= inputTargetPulls}
                                                        {@const sx = CHART_PAD + ((74 - inputPity5) / inputTargetPulls) * (CHART_W - CHART_PAD * 2)}
                                                        <line x1={sx} y1={CHART_PAD} x2={sx} y2={CHART_H - CHART_PAD} stroke="#E8745A" stroke-width="1" stroke-dasharray="2 3" opacity="0.5"/>
                                                        <text x={sx} y={CHART_PAD - 4} fill="#E8745A" font-size="9" font-family="JetBrains Mono" text-anchor="middle">{t('calc.chart.soft-pity-marker')}</text>
                                                {/if}

                                                {#if 90 - inputPity5 > 0 && 90 - inputPity5 <= inputTargetPulls}
                                                        {@const hx = CHART_PAD + ((90 - inputPity5) / inputTargetPulls) * (CHART_W - CHART_PAD * 2)}
                                                        <line x1={hx} y1={CHART_PAD} x2={hx} y2={CHART_H - CHART_PAD} stroke="#E8745A" stroke-width="1" stroke-dasharray="2 3" opacity="0.7"/>
                                                        <text x={hx} y={CHART_PAD - 4} fill="#E8745A" font-size="9" font-family="JetBrains Mono" text-anchor="middle">{t('calc.chart.hard-pity-marker')}</text>
                                                {/if}

                                                <path d={curve5Path} fill="none" stroke="#E6C77A" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>

                                                <path d={curveFeaturedPath} fill="none" stroke="#B495F0" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="4 2"/>

                                                <text x={CHART_PAD} y={CHART_H - 8} fill="#8E97AA" font-size="9" font-family="JetBrains Mono">1</text>
                                                <text x={CHART_W - CHART_PAD} y={CHART_H - 8} fill="#8E97AA" font-size="9" font-family="JetBrains Mono" text-anchor="end">{inputTargetPulls}</text>
                                                <text x={CHART_W / 2} y={CHART_H - 2} fill="#8E97AA" font-size="9" font-family="Inter" text-anchor="middle">{t('calc.chart.x-label')}</text>

                                                <g transform="translate({CHART_PAD + 6}, {CHART_PAD + 6})">
                                                        <rect x="0" y="0" width="14" height="3" fill="#E6C77A" rx="1"/>
                                                        <text x="20" y="4" fill="#E6C77A" font-size="9" font-family="Inter">5★</text>
                                                        <rect x="0" y="10" width="14" height="3" fill="#B495F0" rx="1"/>
                                                        <text x="20" y="14" fill="#B495F0" font-size="9" font-family="Inter">Featured</text>
                                                </g>
                                        </svg>
                                </div>
                        </section>
                </div>
        {/if}

        <!-- ═══ What-If Simulator ═══ -->
        {#if activeTab === 'what-if'}
                <div class="space-y-5" in:fade={{ duration: 200 }}>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">

                                <!-- Scenario A -->
                                <section class="bg-[#1A2337]/80 backdrop-blur-sm rounded-xl border border-[#5E90D6]/30 shadow-xl p-5 space-y-3">
                                        <h2 class="font-heading text-sm font-semibold text-[#5E90D6] uppercase tracking-wider">{t('calc.scenario.a')}</h2>
                                        <ThemedRange
                                                value={scenarioA.pity5}
                                                min={0}
                                                max={89}
                                                step={1}
                                                label={t('calc.scenario.pity')}
                                                accent="blue"
                                                oninput={(e) => { scenarioA.pity5 = parseInt((e.currentTarget as HTMLInputElement).value, 10); }}
                                        />
                                        <label class="flex items-center gap-3 cursor-pointer">
                                                <input
                                                        type="checkbox"
                                                        checked={scenarioA.guaranteed}
                                                        onchange={(e) => { scenarioA.guaranteed = (e.currentTarget as HTMLInputElement).checked; }}
                                                        class="w-4 h-4 accent-[#5E90D6]"
                                                />
                                                <span class="text-sm text-[#F2E6D0]">{t('calc.scenario.guaranteed')}</span>
                                        </label>
                                        <ThemedRange
                                                value={scenarioA.trials}
                                                min={100}
                                                max={5000}
                                                step={100}
                                                label={t('calc.scenario.runs')}
                                                accent="blue"
                                                oninput={(e) => { scenarioA.trials = parseInt((e.currentTarget as HTMLInputElement).value, 10); }}
                                        />
                                        <p class="text-[10px] text-[#8E97AA] -mt-2">{t('calc.scenario.runs.hint')}</p>
                                </section>

                                <!-- Scenario B -->
                                <section class="bg-[#1A2337]/80 backdrop-blur-sm rounded-xl border border-[#E8745A]/30 shadow-xl p-5 space-y-3">
                                        <h2 class="font-heading text-sm font-semibold text-[#E8745A] uppercase tracking-wider">{t('calc.scenario.b')}</h2>
                                        <ThemedRange
                                                value={scenarioB.pity5}
                                                min={0}
                                                max={89}
                                                step={1}
                                                label={t('calc.scenario.pity')}
                                                accent="red"
                                                oninput={(e) => { scenarioB.pity5 = parseInt((e.currentTarget as HTMLInputElement).value, 10); }}
                                        />
                                        <label class="flex items-center gap-3 cursor-pointer">
                                                <input
                                                        type="checkbox"
                                                        checked={scenarioB.guaranteed}
                                                        onchange={(e) => { scenarioB.guaranteed = (e.currentTarget as HTMLInputElement).checked; }}
                                                        class="w-4 h-4 accent-[#E8745A]"
                                                />
                                                <span class="text-sm text-[#F2E6D0]">{t('calc.scenario.guaranteed')}</span>
                                        </label>
                                        <ThemedRange
                                                value={scenarioB.trials}
                                                min={100}
                                                max={5000}
                                                step={100}
                                                label={t('calc.scenario.runs')}
                                                accent="red"
                                                oninput={(e) => { scenarioB.trials = parseInt((e.currentTarget as HTMLInputElement).value, 10); }}
                                        />
                                        <p class="text-[10px] text-[#8E97AA] -mt-2">{t('calc.scenario.runs.hint')}</p>
                                </section>
                        </div>

                        <div class="flex justify-center">
                                <button
                                        onclick={runSimulations}
                                        disabled={running}
                                        class="btn-press px-8 py-3 rounded-md border border-[#C9A45A]/50 bg-gradient-to-r from-[#C9A45A] to-[#E6C77A] text-[#0B1020] font-heading font-semibold tracking-wider uppercase text-sm transition-all hover:shadow-[0_0_30px_rgba(230,199,122,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                        {running ? t('calc.scenario.running') : t('calc.scenario.run')}
                                </button>
                        </div>

                        {#if resultA && resultB}
                                <section class="space-y-4" in:fly={{ y: 12, duration: 300, easing: cubicOut }}>
                                        <h2 class="font-heading text-sm font-semibold text-[#F2E6D0] uppercase tracking-wider">{t('calc.scenario.results')}</h2>

                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">

                                                <!-- Result A -->
                                                <div class="bg-[#1A2337]/80 backdrop-blur-sm rounded-xl border border-[#5E90D6]/30 shadow-xl p-5 space-y-3">
                                                        <div class="flex justify-between items-center">
                                                                <h3 class="font-heading text-sm font-bold text-[#5E90D6] uppercase tracking-wider">{t('calc.scenario.a')}</h3>
                                                                <span class="text-[10px] text-[#8E97AA] font-mono">pity {scenarioA.pity5}{scenarioA.guaranteed ? ' + G' : ''}</span>
                                                        </div>
                                                        <div class="grid grid-cols-2 gap-2">
                                                                <div class="p-2 rounded-md bg-[#0B1020]/60 border border-[#24314A] text-center">
                                                                        <div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">{t('calc.scenario.avg-pulls')}</div>
                                                                        <div class="font-mono text-base font-bold text-[#F2E6D0] tabular-nums">{resultA.avgPullsToFeatured.toFixed(1)}</div>
                                                                </div>
                                                                <div class="p-2 rounded-md bg-[#0B1020]/60 border border-[#24314A] text-center">
                                                                        <div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">{t('calc.scenario.featured-rate')}</div>
                                                                        <div class="font-mono text-base font-bold text-[#E6C77A] tabular-nums">{(resultA.featuredRate * 100).toFixed(1)}%</div>
                                                                </div>
                                                                <div class="p-2 rounded-md bg-[#0B1020]/60 border border-[#24314A] text-center">
                                                                        <div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">{t('calc.scenario.5star-count')}</div>
                                                                        <div class="font-mono text-base font-bold text-[#B495F0] tabular-nums">{resultA.total5Stars}</div>
                                                                </div>
                                                                <div class="p-2 rounded-md bg-[#0B1020]/60 border border-[#24314A] text-center">
                                                                        <div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">{t('calc.scenario.primo-spent')}</div>
                                                                        <div class="font-mono text-base font-bold text-[#E6C77A] tabular-nums">{fmtNum(Math.round(resultA.avgPrimogemSpent))}</div>
                                                                </div>
                                                        </div>
                                                        <div class="pt-2 border-t border-[#24314A]">
                                                                <div class="text-[9px] text-[#8E97AA] uppercase tracking-wider mb-2">{t('calc.scenario.distribution')}</div>
                                                                <div class="space-y-1">
                                                                        {#each resultA.distribution as bucket}
                                                                                {@const maxC = maxDistCount(resultA)}
                                                                                <div class="flex items-center gap-2">
                                                                                        <div class="text-[9px] text-[#8E97AA] font-mono w-14 text-right">{bucket.bucket}</div>
                                                                                        <div class="flex-1 h-3 bg-[#0B1020] rounded-sm overflow-hidden border border-[#24314A]">
                                                                                                <div class="h-full bg-gradient-to-r from-[#5E90D6] to-[#7DCBE0] transition-all duration-300"
                                                                                                        style="width: {(bucket.count / maxC) * 100}%"></div>
                                                                                        </div>
                                                                                        <div class="text-[9px] text-[#B8C1D3] font-mono w-10">{bucket.count}</div>
                                                                                </div>
                                                                        {/each}
                                                                </div>
                                                        </div>
                                                </div>

                                                <!-- Result B -->
                                                <div class="bg-[#1A2337]/80 backdrop-blur-sm rounded-xl border border-[#E8745A]/30 shadow-xl p-5 space-y-3">
                                                        <div class="flex justify-between items-center">
                                                                <h3 class="font-heading text-sm font-bold text-[#E8745A] uppercase tracking-wider">{t('calc.scenario.b')}</h3>
                                                                <span class="text-[10px] text-[#8E97AA] font-mono">pity {scenarioB.pity5}{scenarioB.guaranteed ? ' + G' : ''}</span>
                                                        </div>
                                                        <div class="grid grid-cols-2 gap-2">
                                                                <div class="p-2 rounded-md bg-[#0B1020]/60 border border-[#24314A] text-center">
                                                                        <div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">{t('calc.scenario.avg-pulls')}</div>
                                                                        <div class="font-mono text-base font-bold text-[#F2E6D0] tabular-nums">{resultB.avgPullsToFeatured.toFixed(1)}</div>
                                                                </div>
                                                                <div class="p-2 rounded-md bg-[#0B1020]/60 border border-[#24314A] text-center">
                                                                        <div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">{t('calc.scenario.featured-rate')}</div>
                                                                        <div class="font-mono text-base font-bold text-[#E6C77A] tabular-nums">{(resultB.featuredRate * 100).toFixed(1)}%</div>
                                                                </div>
                                                                <div class="p-2 rounded-md bg-[#0B1020]/60 border border-[#24314A] text-center">
                                                                        <div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">{t('calc.scenario.5star-count')}</div>
                                                                        <div class="font-mono text-base font-bold text-[#B495F0] tabular-nums">{resultB.total5Stars}</div>
                                                                </div>
                                                                <div class="p-2 rounded-md bg-[#0B1020]/60 border border-[#24314A] text-center">
                                                                        <div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">{t('calc.scenario.primo-spent')}</div>
                                                                        <div class="font-mono text-base font-bold text-[#E6C77A] tabular-nums">{fmtNum(Math.round(resultB.avgPrimogemSpent))}</div>
                                                                </div>
                                                        </div>
                                                        <div class="pt-2 border-t border-[#24314A]">
                                                                <div class="text-[9px] text-[#8E97AA] uppercase tracking-wider mb-2">{t('calc.scenario.distribution')}</div>
                                                                <div class="space-y-1">
                                                                        {#each resultB.distribution as bucket}
                                                                                {@const maxC = maxDistCount(resultB)}
                                                                                <div class="flex items-center gap-2">
                                                                                        <div class="text-[9px] text-[#8E97AA] font-mono w-14 text-right">{bucket.bucket}</div>
                                                                                        <div class="flex-1 h-3 bg-[#0B1020] rounded-sm overflow-hidden border border-[#24314A]">
                                                                                                <div class="h-full bg-gradient-to-r from-[#E8745A] to-[#FF8B5A] transition-all duration-300"
                                                                                                        style="width: {(bucket.count / maxC) * 100}%"></div>
                                                                                        </div>
                                                                                        <div class="text-[9px] text-[#B8C1D3] font-mono w-10">{bucket.count}</div>
                                                                                </div>
                                                                        {/each}
                                                                </div>
                                                        </div>
                                                </div>
                                        </div>
                                </section>
                        {:else}
                                <div class="bg-[#1A2337]/60 border border-[#24314A] rounded-xl p-12 text-center" in:fade>
                                        <div class="text-6xl text-[#C9A45A]/40 mb-3">◈</div>
                                        <p class="text-sm text-[#8E97AA]">{t('calc.scenario.empty')}</p>
                                </div>
                        {/if}
                </div>
        {/if}

</div>
