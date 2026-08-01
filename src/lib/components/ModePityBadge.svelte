<script lang="ts">
        // Compact per-mode pity badge — shows pity5/pity4 for all three wish
        // banners at a glance, with the ACTIVE one highlighted. Designed to sit
        // next to (or replace) the existing PityBar on the wish page so users
        // can see whether pulling on Character Event would "waste" Standard
        // pity progress, etc.
        //
        // Reads directly from the game store so it stays reactive without the
        // parent having to thread every counter through props.

        import { getGameState, type WishMode } from '$lib/stores/gameState.svelte';

        const game = getGameState();

        type ModeMeta = {
                mode: WishMode;
                icon: string;
                label: string;
                accent: string;       // text color for icon + active border
                accentBg: string;     // bg tint when active
        };

        const MODES: ModeMeta[] = [
                { mode: 'character', icon: '✦', label: 'Char',  accent: 'text-[#E6C77A]', accentBg: 'border-[#E6C77A]/60 bg-[#E6C77A]/10' },
                { mode: 'standard',  icon: '◈', label: 'Std',   accent: 'text-[#B8C1D3]', accentBg: 'border-[#B8C1D3]/60 bg-[#B8C1D3]/10' },
                { mode: 'novice',    icon: '✚', label: 'Nov',   accent: 'text-[#B495F0]', accentBg: 'border-[#B495F0]/60 bg-[#B495F0]/10' }
        ];

        function pity5Of(mode: WishMode): number {
                return game.getModePity(mode).pity5;
        }
        function pity4Of(mode: WishMode): number {
                return game.getModePity(mode).pity4;
        }

        // Soft-pity highlight: 73+ turns the 5★ counter red, matching PityBar.
        function pity5Class(mode: WishMode): string {
                const p = pity5Of(mode);
                if (p >= 73) return 'text-[#E8745A] animate-pulse';
                if (p >= 60) return 'text-[#E0B25A]';
                return 'text-[#F2E6D0]';
        }

        // ── Flash highlight on pity change ──────────────────────────────────────
        // When a pull advances pity (or resets it on a 5★/4★ drop), the affected
        // row's pity counter briefly flashes gold so the user gets visual feedback
        // that "this banner's pity just changed" — useful after a multi-pull on
        // one banner to confirm the OTHER banners' pity didn't move.
        //
        // We track a per-mode, per-rarity flash flag. The $effect watches each
        // mode's pity5/pity4 reactively; when a value changes it sets the flag
        // and schedules a clear. The flash class is applied to the counter span
        // and drives a CSS keyframe (defined in app.css).
        let flash5: Record<WishMode, boolean> = $state({ character: false, standard: false, novice: false });
        let flash4: Record<WishMode, boolean> = $state({ character: false, standard: false, novice: false });
        const flashTimers: Record<string, ReturnType<typeof setTimeout>> = {};

        function triggerFlash(kind: '5' | '4', mode: WishMode) {
                const key = `${mode}-${kind}`;
                if (kind === '5') flash5[mode] = true;
                else flash4[mode] = true;
                if (flashTimers[key]) clearTimeout(flashTimers[key]);
                flashTimers[key] = setTimeout(() => {
                        if (kind === '5') flash5[mode] = false;
                        else flash4[mode] = false;
                }, 900);
        }

        // Watch each mode's pity values. We use a single $effect that reads all
        // six values so Svelte re-runs the effect whenever any of them changes;
        // we then diff against the previous snapshot to decide which one(s) to
        // flash. Using a single effect avoids six separate effects.
        let prevPity: Record<WishMode, { p5: number; p4: number }> = {
                character: { p5: pity5Of('character'), p4: pity4Of('character') },
                standard: { p5: pity5Of('standard'), p4: pity4Of('standard') },
                novice: { p5: pity5Of('novice'), p4: pity4Of('novice') }
        };

        $effect(() => {
                // Read current values (this is what makes the effect reactive).
                const cur = {
                        character: { p5: pity5Of('character'), p4: pity4Of('character') },
                        standard: { p5: pity5Of('standard'), p4: pity4Of('standard') },
                        novice: { p5: pity5Of('novice'), p4: pity4Of('novice') }
                };
                (Object.keys(cur) as WishMode[]).forEach((mode) => {
                        if (cur[mode].p5 !== prevPity[mode].p5) triggerFlash('5', mode);
                        if (cur[mode].p4 !== prevPity[mode].p4) triggerFlash('4', mode);
                });
                prevPity = cur;
        });
</script>

<div class="bg-[#1A2337]/80 backdrop-blur-sm p-4 rounded-xl border border-[#C9A45A]/20 shadow-xl space-y-3">
        <div class="flex items-center justify-between">
                <h3 class="font-heading text-xs font-semibold text-[#F2E6D0] uppercase tracking-wider">
                        All Banners Pity
                </h3>
                <a href="/pity-setup" class="text-[10px] text-[#C9A45A] hover:text-[#E6C77A] uppercase tracking-wider transition-colors">
                        Atur →
                </a>
        </div>

        <div class="space-y-2">
                {#each MODES as m}
                        {@const active = game.wishMode === m.mode}
                        {@const p5 = pity5Of(m.mode)}
                        {@const p4 = pity4Of(m.mode)}
                        {@const mObj = game.getModePity(m.mode)}
                        <div
                                class="flex items-center gap-3 p-2.5 rounded-lg border transition-all {active
                                        ? m.accentBg
                                        : 'border-[#24314A] bg-[#0B1020]/40'}"
                        >
                                <!-- Icon + label -->
                                <div class="flex items-center gap-1.5 w-16 shrink-0">
                                        <span class="text-sm {m.accent}">{m.icon}</span>
                                        <span class="text-[11px] font-bold {active ? m.accent : 'text-[#8E97AA]'} uppercase tracking-wider">{m.label}</span>
                                        {#if active}
                                                <span class="text-[8px] px-1 py-0.5 rounded bg-[#E6C77A]/20 text-[#E6C77A] font-bold">●</span>
                                        {/if}
                                </div>

                                <!-- Pity 5★ -->
                                <div class="flex-1 flex items-center gap-2">
                                        <span class="text-[9px] text-[#8E97AA] uppercase w-3">5★</span>
                                        <div class="flex-1 h-1.5 bg-[#0B1020] rounded-full overflow-hidden border border-[#24314A]/60">
                                                <div
                                                        class="h-full rounded-full transition-all duration-500"
                                                        style="width: {Math.min((p5 / 90) * 100, 100)}%; background: {p5 >= 73 ? 'linear-gradient(to right, #E8745A, #FF8B5A)' : p5 >= 60 ? 'linear-gradient(to right, #E0B25A, #E6C77A)' : 'linear-gradient(to right, #C9A45A, #E6C77A)'}"
                                                ></div>
                                        </div>
                                        <span class="text-[10px] font-mono font-bold tabular-nums w-10 text-right {pity5Class(m.mode)} {flash5[m.mode] ? 'pity-flash' : ''}">
                                                {p5}/90
                                        </span>
                                </div>

                                <!-- Pity 4★ -->
                                <div class="flex items-center gap-2 w-24 shrink-0">
                                        <span class="text-[9px] text-[#8E97AA] uppercase w-3">4★</span>
                                        <div class="flex-1 h-1.5 bg-[#0B1020] rounded-full overflow-hidden border border-[#24314A]/60">
                                                <div
                                                        class="h-full bg-gradient-to-r from-[#8D72C9] to-[#B495F0] rounded-full transition-all duration-500"
                                                        style="width: {Math.min((p4 / 10) * 100, 100)}%"
                                                ></div>
                                        </div>
                                        <span class="text-[10px] font-mono font-bold tabular-nums text-[#F2E6D0] w-8 text-right {flash4[m.mode] ? 'pity-flash' : ''}">{p4}/10</span>
                                </div>

                                <!-- Guaranteed indicator (Character only) -->
                                {#if m.mode === 'character' && mObj.guaranteed5}
                                        <span class="text-[9px] px-1.5 py-0.5 rounded bg-[#E6C77A]/20 text-[#E6C77A] font-bold uppercase tracking-wider shrink-0" title="5★ Guaranteed Featured">G</span>
                                {:else if m.mode === 'character'}
                                        <span class="w-4 shrink-0"></span>
                                {:else}
                                        <span class="w-4 shrink-0"></span>
                                {/if}
                        </div>
                {/each}
        </div>

        <div class="text-[10px] text-[#8E97AA] pt-2 border-t border-[#24314A] leading-relaxed">
                Tiap banner punya pity terpisah. Pull di satu banner tidak menggeser pity banner lain.
        </div>
</div>
