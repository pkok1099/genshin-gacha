<script lang="ts">
        import { onMount } from 'svelte';
        import { fly } from 'svelte/transition';
        import { cubicOut } from 'svelte/easing';
        import ThemedSelect from '$lib/components/ThemedSelect.svelte';
        import { cookMultiple, getSampleRecipes, getDupeTalentCharacters, COOKING_CONSTANTS, type Recipe, type CookQuality } from '$lib/utils/cookingEngine';

        const RECIPES = getSampleRecipes();
        const DUPE_CHARS = getDupeTalentCharacters();

        let selectedRecipeId: string = $state(RECIPES[0]!.id);
        let selectedCharId: string = $state('');
        let count: number = $state(20);

        let result = $state<{ results: { quality: CookQuality; quantity: number; isSpecial: boolean; dupeTriggered: boolean; recipeName: string }[]; totals: Record<CookQuality, number>; totalDishes: number; specialCount: number; dupeTriggeredCount: number } | null>(null);

        let selectedRecipe = $derived<Recipe>(RECIPES.find((r) => r.id === selectedRecipeId) ?? RECIPES[0]!);
        let hasSpecialty = $derived(selectedRecipe.specialtyChar?.id === selectedCharId);
        let hasDupe = $derived(selectedCharId !== '' && DUPE_CHARS.includes(selectedCharId));

        function doSim() {
                result = cookMultiple(selectedRecipe, count, selectedCharId || undefined);
        }

        // Run once on mount — user clicks Cook to re-run
        onMount(() => {
                doSim();
        });

        const CHAR_OPTIONS: { id: string; name: string }[] = [
                { id: '', name: '— No Character —' },
                { id: 'xiangling', name: 'Xiangling (specialty + dupe)' },
                { id: 'diluc', name: 'Diluc' },
                { id: 'ganyu', name: 'Ganyu' },
                { id: 'xingqiu', name: 'Xingqiu' },
                { id: 'venti', name: 'Venti' },
                { id: 'raiden-shogun', name: 'Raiden Shogun' },
                { id: 'jean', name: 'Jean (dupe talent)' },
                { id: 'hu-tao', name: 'Hu Tao (dupe talent)' },
                { id: 'diona', name: 'Diona (dupe talent)' },
                { id: 'kamisato-ayaka', name: 'Ayaka (dupe talent)' },
                { id: 'yun-jin', name: 'Yun Jin (dupe talent)' }
        ];

        function qualityColor(q: CookQuality): string {
                if (q === 'special') return 'text-[#E6C77A] bg-[#C9A45A]/15 border-[#C9A45A]/40';
                if (q === 'delicious') return 'text-[#6FAF6E] bg-[#6FAF6E]/15 border-[#6FAF6E]/40';
                if (q === 'normal') return 'text-[#B8C1D3] bg-[#B8C1D3]/10 border-[#B8C1D3]/30';
                return 'text-[#E8745A] bg-[#8B3A3A]/15 border-[#8B3A3A]/40';
        }
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <!-- ═══ Controls ═══ -->
        <section class="bg-[#1A2337]/80 backdrop-blur-sm rounded-xl border border-[#C9A45A]/25 shadow-xl p-5 space-y-4">
                <h2 class="font-heading text-sm font-semibold text-[#F2E6D0] uppercase tracking-wider">Cooking Configuration</h2>

                <!-- Recipe -->
                <div class="space-y-2">
                        <ThemedSelect
                                label="Recipe"
                                value={selectedRecipeId}
                                options={RECIPES.map((r) => ({ value: r.id, label: `${r.name} (${r.stars}★)` }))}
                                onchange={(v) => { selectedRecipeId = v; }}
                        />
                        {#if selectedRecipe.specialtyChar}
                                <div class="text-[10px] text-[#8E97AA]">
                                        Specialty: <span class="text-[#E6C77A]">{selectedRecipe.specialtyChar.name}</span>
                                        → <span class="text-[#E6C77A]">{selectedRecipe.specialtyChar.specialName}</span>
                                </div>
                        {/if}
                </div>

                <!-- Character -->
                <div class="space-y-2">
                        <ThemedSelect
                                label="Character"
                                value={selectedCharId}
                                options={CHAR_OPTIONS.map((c) => ({ value: c.id, label: c.name }))}
                                onchange={(v) => { selectedCharId = v; }}
                        />
                        <div class="flex gap-2 mt-1">
                                {#if hasSpecialty}
                                        <span class="text-[9px] px-2 py-0.5 rounded bg-[#E6C77A]/15 text-[#E6C77A] border border-[#E6C77A]/40 font-bold">✓ SPECIALTY</span>
                                {/if}
                                {#if hasDupe}
                                        <span class="text-[9px] px-2 py-0.5 rounded bg-[#6FAF6E]/15 text-[#6FAF6E] border border-[#6FAF6E]/40 font-bold">✓ DUPE 12%</span>
                                {/if}
                        </div>
                </div>

                <!-- Count -->
                <div class="space-y-2">
                        <div class="flex justify-between items-center">
                                <label for="count" class="text-xs font-bold text-[#E6C77A] uppercase tracking-wider">Cooks</label>
                                <span class="text-xs font-mono text-[#F2E6D0] tabular-nums">{count}×</span>
                        </div>
                        <input
                                id="count"
                                type="range"
                                min="1"
                                max="100"
                                bind:value={count}
                                class="w-full accent-[#C9A45A]"
                        />
                </div>

                <button
                        onclick={doSim}
                        class="btn-press w-full px-4 py-3 rounded-md border border-[#C9A45A]/50 bg-gradient-to-r from-[#C9A45A] to-[#E6C77A] text-[#0B1020] font-heading font-semibold tracking-wider uppercase text-sm transition-all hover:shadow-[0_0_25px_rgba(230,199,122,0.45)]"
                >
                        ♨ Cook {count}×
                </button>

                <!-- Info -->
                <div class="text-[10px] text-[#8E97AA] bg-[#0B1020]/40 border border-[#24314A] rounded-md p-3 leading-relaxed">
                        <span class="text-[#E6C77A] font-semibold">Mechanics:</span>
                        <br>• Delicious cook + specialty char → <span class="text-[#E6C77A] font-mono">{(COOKING_CONSTANTS.SPECIAL_CONVERSION_RATE * 100)}%</span> chance jadi Special dish
                        <br>• Dupe talent (Jean, Hu Tao, dll) → <span class="text-[#6FAF6E] font-mono">{(COOKING_CONSTANTS.DUPE_TALENT_CHANCE * 100)}%</span> chance double output
                </div>
        </section>

        <!-- ═══ Result ═══ -->
        <section class="bg-[#1A2337]/80 backdrop-blur-sm rounded-xl border border-[#C9A45A]/25 shadow-xl p-5 space-y-4" in:fly={{ y: 10, duration: 300, easing: cubicOut }}>
                <h2 class="font-heading text-sm font-semibold text-[#F2E6D0] uppercase tracking-wider">Cooking Results</h2>

                {#if result}
                        <!-- Summary -->
                        <div class="grid grid-cols-2 gap-2 mb-3">
                                <div class="text-center p-3 rounded-md bg-[#E6C77A]/10 border border-[#E6C77A]/30">
                                        <div class="text-[9px] text-[#E6C77A] uppercase">Total Dishes</div>
                                        <div class="font-mono text-xl font-bold text-[#E6C77A]">{result.totalDishes}</div>
                                </div>
                                <div class="text-center p-3 rounded-md bg-[#6FAF6E]/10 border border-[#6FAF6E]/30">
                                        <div class="text-[9px] text-[#6FAF6E] uppercase">Special Dishes</div>
                                        <div class="font-mono text-xl font-bold text-[#6FAF6E]">{result.specialCount}</div>
                                </div>
                        </div>

                        <!-- Quality breakdown -->
                        <div class="space-y-1.5">
                                <div class="text-[10px] text-[#8E97AA] uppercase tracking-wider">Quality Breakdown</div>
                                {#each ['suspicious', 'normal', 'delicious', 'special'] as q}
                                        {@const count_q = result.totals[q as CookQuality]}
                                        {#if count_q > 0}
                                                <div class="flex justify-between items-center px-3 py-2 rounded-md border {qualityColor(q as CookQuality)}">
                                                        <span class="text-xs font-bold uppercase">{q}</span>
                                                        <span class="font-mono text-sm font-bold tabular-nums">{count_q} ×</span>
                                                </div>
                                        {/if}
                                {/each}
                        </div>

                        {#if result.dupeTriggeredCount > 0}
                                <div class="text-[10px] text-[#6FAF6E] bg-[#6FAF6E]/10 border border-[#6FAF6E]/30 rounded-md p-2">
                                        ✓ Dupe talent triggered {result.dupeTriggeredCount}× (extra dishes gained: {result.dupeTriggeredCount})
                                </div>
                        {/if}
                {/if}
        </section>

</div>
