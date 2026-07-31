<script lang="ts">
        import { fade, fly } from 'svelte/transition';
        import { cubicOut } from 'svelte/easing';
        import {
                createInitialWeaponState,
                executeWeaponPull,
                executeWeaponMultiPull,
                setDefaultWeaponPools,
                WEAPON_BANNER_CONSTANTS,
                type WeaponBannerState,
                type WeaponPullResult,
                type WeaponEntry
        } from '$lib/utils/weaponBannerEngine';

        // Featured 5★ weapons (sample current patch)
        const FEATURED_5STAR: WeaponEntry[] = [
                { id: 'absolution', name: 'Absolution', rarity: 5, iconUrl: 'https://genshin.jmp.blue/weapons/absolution/icon' },
                { id: 'cranes-echoing-call', name: "Crane's Echoing Call", rarity: 5, iconUrl: 'https://genshin.jmp.blue/weapons/cranes-echoing-call/icon' }
        ];

        const FEATURED_4STAR: WeaponEntry[] = [
                { id: 'sacrificial-sword', name: 'Sacrificial Sword', rarity: 4, iconUrl: 'https://genshin.jmp.blue/weapons/sacrificial-sword/icon' },
                { id: 'sacrificial-greatsword', name: 'Sacrificial Greatsword', rarity: 4, iconUrl: 'https://genshin.jmp.blue/weapons/sacrificial-greatsword/icon' },
                { id: 'dragons-bane', name: "Dragon's Bane", rarity: 4, iconUrl: 'https://genshin.jmp.blue/weapons/dragons-bane/icon' },
                { id: 'rainslasher', name: 'Rainslasher', rarity: 4, iconUrl: 'https://genshin.jmp.blue/weapons/rainslasher/icon' },
                { id: 'eye-of-perception', name: 'Eye of Perception', rarity: 4, iconUrl: 'https://genshin.jmp.blue/weapons/eye-of-perception/icon' }
        ];

        let bannerState: WeaponBannerState = $state(createInitialWeaponState());
        let chosenPathIdx: 0 | 1 = $state(0);
        let lastResults: WeaponPullResult[] = $state([]);
        let showResults: boolean = $state(false);
        let pullLog: WeaponPullResult[] = $state([]);
        let totalSpent: number = $state(0);
        const COST_SINGLE = 160;
        const COST_TEN = 1600;

        // Init pools on mount
        $effect(() => {
                setDefaultWeaponPools(
                        [FEATURED_5STAR[0]!, FEATURED_5STAR[1]!],
                        FEATURED_4STAR
                );
                bannerState.chosenPathId = FEATURED_5STAR[chosenPathIdx]!.id;
        });

        function switchPath(idx: 0 | 1) {
                chosenPathIdx = idx;
                bannerState.chosenPathId = FEATURED_5STAR[idx]!.id;
        }

        function doSingle() {
                if (totalSpent + COST_SINGLE > 999999) return; // soft cap
                const { result, newState } = executeWeaponPull(bannerState);
                bannerState = newState;
                lastResults = [result];
                pullLog = [result, ...pullLog].slice(0, 100);
                totalSpent += COST_SINGLE;
                showResults = true;
        }

        function doTen() {
                if (totalSpent + COST_TEN > 999999) return;
                const { results, newState } = executeWeaponMultiPull(bannerState, 10);
                bannerState = newState;
                lastResults = results;
                pullLog = [...results.reverse(), ...pullLog].slice(0, 100);
                totalSpent += COST_TEN;
                showResults = true;
        }

        function resetState() {
                bannerState = createInitialWeaponState();
                bannerState.chosenPathId = FEATURED_5STAR[chosenPathIdx]!.id;
                lastResults = [];
                pullLog = [];
                totalSpent = 0;
                showResults = false;
        }

        let count5 = $derived(pullLog.filter((r) => r.rarity === 5).length);
        let count4 = $derived(pullLog.filter((r) => r.rarity === 4).length);
        let count3 = $derived(pullLog.filter((r) => r.rarity === 3).length);

        let sortedResults = $derived([...lastResults].sort((a, b) => b.rarity - a.rarity));

        function rarityBorder(r: number): string {
                if (r === 5) return 'border-[#E6C77A] gold-glow';
                if (r === 4) return 'border-[#B495F0] purple-glow';
                return 'border-[#5E90D6] blue-accent';
        }

        function rarityText(r: number): string {
                if (r === 5) return 'text-[#E6C77A]';
                if (r === 4) return 'text-[#B495F0]';
                return 'text-[#5E90D6]';
        }
</script>

<div class="space-y-5">

        <!-- ═══ Weapon Banner Stage ═══ -->
        <section class="bg-gradient-to-br from-[#1A2337] via-[#141C2F] to-[#0B1020] rounded-xl border border-[#C9A45A]/25 p-5 md:p-6">
                <div class="flex items-center justify-between mb-4">
                        <div>
                                <h2 class="font-heading text-lg font-semibold text-[#F2E6D0]">Weapon Event Banner</h2>
                                <div class="text-[10px] text-[#8E97AA] uppercase tracking-wider mt-0.5">Epitomized Path — pilih 5★ incaranmu</div>
                        </div>
                        <div class="text-right">
                                <div class="text-[10px] text-[#8E97AA] uppercase tracking-wider">Total Spent</div>
                                <div class="font-mono text-sm font-bold text-[#E6C77A] tabular-nums">{totalSpent.toLocaleString('en-US')} ★</div>
                        </div>
                </div>

                <!-- Featured Weapons -->
                <div class="grid grid-cols-2 gap-3 mb-4">
                        {#each FEATURED_5STAR as w, i}
                                <button
                                        onclick={() => switchPath(i as 0 | 1)}
                                        class="relative p-4 rounded-lg border-2 transition-all text-left {chosenPathIdx === i ? 'border-[#E6C77A] bg-[#C9A45A]/10 gold-glow' : 'border-[#24314A] hover:border-[#C9A45A]/50 bg-[#0B1020]/40'}"
                                >
                                        {#if chosenPathIdx === i}
                                                <div class="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#E6C77A] text-[#0B1020] text-[9px] font-bold uppercase tracking-wider">Path</div>
                                        {/if}
                                        <div class="flex items-center gap-3">
                                                <div class="w-14 h-14 rounded-md overflow-hidden border border-[#C9A45A]/40 bg-[#0B1020] shrink-0">
                                                        <img src={w.iconUrl} alt={w.name} class="w-full h-full object-cover"
                                                                onerror={(e: Event) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3'; }} />
                                                </div>
                                                <div class="min-w-0">
                                                        <div class="text-[#E6C77A] text-[10px] tracking-wider">★ ★ ★ ★ ★</div>
                                                        <div class="text-sm font-heading font-semibold text-[#F2E6D0] truncate">{w.name}</div>
                                                </div>
                                        </div>
                                </button>
                        {/each}
                </div>

                <!-- Fate Points Display -->
                <div class="grid grid-cols-3 gap-2 mb-4">
                        <div class="text-center p-3 rounded-md bg-[#0B1020]/60 border border-[#24314A]">
                                <div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">Fate Points</div>
                                <div class="font-mono text-2xl font-bold text-[#E6C77A] tabular-nums mt-0.5">{bannerState.fatePoints}/2</div>
                        </div>
                        <div class="text-center p-3 rounded-md bg-[#0B1020]/60 border border-[#24314A]">
                                <div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">Pity 5★</div>
                                <div class="font-mono text-2xl font-bold {bannerState.pity5 >= 60 ? 'text-[#E8745A]' : 'text-[#F2E6D0]'} tabular-nums mt-0.5">{bannerState.pity5}/80</div>
                        </div>
                        <div class="text-center p-3 rounded-md bg-[#0B1020]/60 border border-[#24314A]">
                                <div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">Pity 4★</div>
                                <div class="font-mono text-2xl font-bold text-[#B495F0] tabular-nums mt-0.5">{bannerState.pity4}/10</div>
                        </div>
                </div>

                <!-- Pull Buttons -->
                <div class="grid grid-cols-2 gap-3">
                        <button
                                onclick={doSingle}
                                class="px-4 py-3 rounded-md border border-[#C9A45A]/30 bg-gradient-to-br from-[#24314A] to-[#1A2337] hover:from-[#2A3856] hover:to-[#24314A] text-[#E6C77A] font-heading font-semibold uppercase text-sm tracking-wider transition-all"
                        >
                                ✦ 1× Wish
                                <span class="block text-[10px] text-[#8E97AA] font-mono">{COST_SINGLE} Primo</span>
                        </button>
                        <button
                                onclick={doTen}
                                class="px-4 py-3 rounded-md border border-[#E6C77A]/50 bg-gradient-to-r from-[#C9A45A] to-[#E6C77A] hover:shadow-[0_0_25px_rgba(230,199,122,0.4)] text-[#0B1020] font-heading font-bold uppercase text-sm tracking-wider transition-all"
                        >
                                ✦✦ 10× Wish
                                <span class="block text-[10px] text-[#0B1020]/70 font-mono font-semibold">{COST_TEN} Primo</span>
                        </button>
                </div>

                <button
                        onclick={resetState}
                        class="w-full mt-2 px-3 py-2 rounded-md border border-[#8B3A3A]/40 bg-[#8B3A3A]/15 text-[#E8745A] text-[10px] font-semibold uppercase tracking-wider hover:bg-[#8B3A3A]/25 transition-all"
                >
                        Reset Banner State
                </button>
        </section>

        <!-- ═══ Stats ═══ -->
        <section class="grid grid-cols-3 gap-3">
                <div class="bg-[#1A2337]/80 border border-[#C9A45A]/20 rounded-lg p-3 text-center">
                        <div class="text-[10px] text-[#8E97AA] uppercase tracking-wider">★5 Pulled</div>
                        <div class="font-mono text-xl font-bold text-[#E6C77A] tabular-nums">{count5}</div>
                </div>
                <div class="bg-[#1A2337]/80 border border-[#8D72C9]/20 rounded-lg p-3 text-center">
                        <div class="text-[10px] text-[#8E97AA] uppercase tracking-wider">★4 Pulled</div>
                        <div class="font-mono text-xl font-bold text-[#B495F0] tabular-nums">{count4}</div>
                </div>
                <div class="bg-[#1A2337]/80 border border-[#5E90D6]/20 rounded-lg p-3 text-center">
                        <div class="text-[10px] text-[#8E97AA] uppercase tracking-wider">★3 Pulled</div>
                        <div class="font-mono text-xl font-bold text-[#5E90D6] tabular-nums">{count3}</div>
                </div>
        </section>

        <!-- ═══ Mechanics Info ═══ -->
        <section class="bg-[#1A2337]/60 border border-[#24314A] rounded-lg p-4 text-[11px] text-[#8E97AA] leading-relaxed">
                <div class="text-[#E6C77A] font-heading font-semibold uppercase tracking-wider text-xs mb-2">Weapon Banner Mechanics</div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                        <div>• Base 5★ rate: <span class="font-mono text-[#E6C77A]">{(WEAPON_BANNER_CONSTANTS.BASE_5STAR_RATE * 100).toFixed(1)}%</span></div>
                        <div>• Soft pity: <span class="font-mono text-[#E6C77A]">pull {WEAPON_BANNER_CONSTANTS.SOFT_PITY_START}</span></div>
                        <div>• Hard pity: <span class="font-mono text-[#E6C77A]">pull {WEAPON_BANNER_CONSTANTS.HARD_PITY}</span></div>
                        <div>• Featured 5★ chance: <span class="font-mono text-[#E6C77A]">{(WEAPON_BANNER_CONSTANTS.FEATURED_5STAR_TOTAL_CHANCE * 100)}%</span></div>
                        <div>• Epitomized Path: 2 fate points → guarantee chosen 5★</div>
                        <div>• 4★ base rate: <span class="font-mono text-[#B495F0]">{(WEAPON_BANNER_CONSTANTS.BASE_4STAR_RATE * 100)}%</span></div>
                </div>
        </section>

        <!-- ═══ Last Results ═══ -->
        {#if showResults && lastResults.length > 0}
                <section class="bg-[#1A2337]/80 border border-[#C9A45A]/25 rounded-xl p-4" in:fade>
                        <h3 class="font-heading text-sm font-semibold text-[#F2E6D0] uppercase tracking-wider mb-3">
                                Last Pull ({lastResults.length}×)
                        </h3>
                        <div class="flex flex-wrap gap-2">
                                {#each sortedResults as r, i}
                                        <div
                                                class="w-20 h-28 rounded-lg border-2 {rarityBorder(r.rarity)} bg-gradient-to-br from-[#1A2337] to-[#0B1020] overflow-hidden flex flex-col items-center justify-center p-2 text-center"
                                                in:fly={{ y: 10, duration: 200, delay: i * 50, easing: cubicOut }}
                                        >
                                                <div class="w-10 h-10 rounded-md overflow-hidden bg-[#0B1020] mb-1">
                                                        <img src={r.iconUrl} alt={r.name} class="w-full h-full object-cover"
                                                                onerror={(e: Event) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.2'; }} />
                                                </div>
                                                <div class="text-[9px] {rarityText(r.rarity)} font-bold">{'★'.repeat(r.rarity)}</div>
                                                <div class="text-[9px] text-[#F2E6D0] font-semibold leading-tight truncate w-full">{r.name}</div>
                                                {#if r.rarity === 5}
                                                        <div class="text-[8px] {r.isChosenPath ? 'text-[#6FAF6E]' : r.isFeatured ? 'text-[#E8745A]' : 'text-[#8E97AA]'} font-bold">
                                                                {r.isChosenPath ? '✓ PATH' : r.isFeatured ? 'WRONG' : 'STD'}
                                                        </div>
                                                        {#if r.fatePointChange > 0}
                                                                <div class="text-[8px] text-[#E8745A]">+1 Fate</div>
                                                        {/if}
                                                        {#if r.isGuaranteedChosen}
                                                                <div class="text-[8px] text-[#6FAF6E] font-bold">GUARANTEED</div>
                                                        {/if}
                                                {/if}
                                        </div>
                                {/each}
                        </div>
                </section>
        {/if}

        <!-- ═══ Pull Log ═══ -->
        {#if pullLog.length > 0}
                <section class="bg-[#1A2337]/80 border border-[#C9A45A]/20 rounded-xl p-4">
                        <h3 class="font-heading text-sm font-semibold text-[#F2E6D0] uppercase tracking-wider mb-3">
                                Pull Log (last {Math.min(pullLog.length, 100)})
                        </h3>
                        <div class="max-h-64 overflow-y-auto space-y-1 pr-1">
                                {#each pullLog as r, i}
                                        <div class="flex items-center gap-2 px-2 py-1.5 rounded text-xs {r.rarity === 5 ? 'bg-[#C9A45A]/10 border border-[#C9A45A]/25' : r.rarity === 4 ? 'bg-[#8D72C9]/8 border border-[#8D72C9]/20' : 'bg-[#0B1020]/40 border border-[#24314A]/40'}">
                                                <span class="text-[10px] text-[#8E97AA] font-mono w-10 text-right shrink-0">#{pullLog.length - i}</span>
                                                <span class="text-[10px] {rarityText(r.rarity)} font-bold w-6 shrink-0">★{r.rarity}</span>
                                                <span class="text-[11px] text-[#F2E6D0] flex-1 truncate">{r.name}</span>
                                                <span class="text-[9px] text-[#8E97AA] font-mono shrink-0">@{r.pityAtPull}</span>
                                                {#if r.rarity === 5 && r.isChosenPath}
                                                        <span class="text-[9px] text-[#6FAF6E] font-bold shrink-0">✓ PATH</span>
                                                {:else if r.rarity === 5 && r.isFeatured}
                                                        <span class="text-[9px] text-[#E8745A] font-bold shrink-0">WRONG</span>
                                                {:else if r.rarity === 5}
                                                        <span class="text-[9px] text-[#8E97AA] shrink-0">STD</span>
                                                {/if}
                                        </div>
                                {/each}
                        </div>
                </section>
        {/if}

</div>
