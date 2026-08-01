<script lang="ts">
        import { getGameState, type WishMode } from '$lib/stores/gameState.svelte';
        import { fly, fade } from 'svelte/transition';
        import { cubicOut } from 'svelte/easing';
        import ThemedRange from '$lib/components/ThemedRange.svelte';
        import ThemedInput from '$lib/components/ThemedInput.svelte';

        const game = getGameState();

        // ── Per-mode input mirrors ─────────────────────────────────────────────
        // We keep a local editable copy for each mode so the user can edit
        // without committing until "Apply". The $effect syncs from store →
        // inputs whenever the store changes externally (e.g. preset applied).

        type ModeInputs = {
                pity5: number;
                pity4: number;
                guaranteed5: boolean;
                pityLock5: boolean;     // toggle (the locked VALUE is pity5 itself)
                pityLock4: boolean;
        };

        function snapshotMode(mode: WishMode): ModeInputs {
                const m = game.getModePity(mode);
                return {
                        pity5: m.pity5,
                        pity4: m.pity4,
                        guaranteed5: m.guaranteed5,
                        pityLock5: m.pityLock5 !== null,
                        pityLock4: m.pityLock4 !== null
                };
        }

        let inputs: Record<WishMode, ModeInputs> = $state({
                character: snapshotMode('character'),
                standard: snapshotMode('standard'),
                novice: snapshotMode('novice')
        });

        // Shared (not per-mode)
        let primogemInputStr = $state(String(game.primogem));

        // Re-sync from store when store changes externally (e.g. resetAll, preset)
        $effect(() => {
                inputs.character = snapshotMode('character');
                inputs.standard = snapshotMode('standard');
                inputs.novice = snapshotMode('novice');
                primogemInputStr = String(game.primogem);
        });

        // Active tab — defaults to whatever wishMode is currently selected
        // (so users landing here from the wish page land on the right tab).
        let activeTab: WishMode = $state(game.wishMode);

        const TABS: { mode: WishMode; label: string; icon: string; accent: string }[] = [
                { mode: 'character', label: 'Character Event', icon: '✦', accent: 'text-[#E6C77A]' },
                { mode: 'standard',  label: 'Standard Wish',   icon: '◈', accent: 'text-[#B8C1D3]' },
                { mode: 'novice',    label: 'Novice Wish',     icon: '✚', accent: 'text-[#B495F0]' }
        ];

        let saved = $state(false);

        function apply() {
                // Persist primogem
                const parsed = parseInt(primogemInputStr.replace(/[^\d]/g, ''), 10);
                const primoAmount = Number.isFinite(parsed) ? parsed : 0;
                game.setPrimogem(primoAmount);

                // Persist per-mode pity
                (Object.keys(inputs) as WishMode[]).forEach((mode) => {
                        const inp = inputs[mode];
                        game.setModePity(mode, inp.pity5, inp.pity4);
                        game.setModeGuaranteed5(mode, inp.guaranteed5);
                        game.setModePityLock5(mode, inp.pityLock5 ? inp.pity5 : null);
                        game.setModePityLock4(mode, inp.pityLock4 ? inp.pity4 : null);
                });

                saved = true;
                setTimeout(() => { saved = false; }, 2000);
        }

        function resetAll() {
                game.resetAll();
                inputs = {
                        character: snapshotMode('character'),
                        standard: snapshotMode('standard'),
                        novice: snapshotMode('novice')
                };
                primogemInputStr = String(game.DEFAULT_PRIMOGEM);
                saved = true;
                setTimeout(() => { saved = false; }, 2000);
        }

        // ── Per-mode presets ──────────────────────────────────────────────────
        // Each preset sets the active tab's mode only. Primogem is shared.
        type ModePreset = {
                label: string;
                pity5: number;
                pity4: number;
                guaranteed5: boolean;
                primogem: number;
                desc: string;
        };

        const MODE_PRESETS: ModePreset[] = [
                { label: 'Fresh Account',      pity5: 0,  pity4: 0,  guaranteed5: false, primogem: 16000, desc: 'Akun baru, 0 pity, 16k primo' },
                { label: 'Soft Pity Zone',     pity5: 74, pity4: 5,  guaranteed5: false, primogem: 12800, desc: 'Tepat di soft pity 5★ (74/89)' },
                { label: 'Near Hard Pity',     pity5: 85, pity4: 9,  guaranteed5: false, primogem: 1600,  desc: 'Dekat hard pity 90, 1× 10-pull ready' },
                { label: 'Guaranteed Featured', pity5: 0,  pity4: 0,  guaranteed5: true,  primogem: 16000, desc: '5★ berikutnya dijamin featured' }
        ];

        function applyPreset(p: ModePreset) {
                const inp = inputs[activeTab];
                inp.pity5 = p.pity5;
                inp.pity4 = p.pity4;
                inp.guaranteed5 = p.guaranteed5;
                inp.pityLock5 = false;
                inp.pityLock4 = false;
                primogemInputStr = String(p.primogem);

                // Apply immediately to store for the active mode
                game.setModePity(activeTab, p.pity5, p.pity4);
                game.setModeGuaranteed5(activeTab, p.guaranteed5);
                game.setModePityLock5(activeTab, null);
                game.setModePityLock4(activeTab, null);
                game.setPrimogem(p.primogem);

                saved = true;
                setTimeout(() => { saved = false; }, 2000);
        }

        // Quick primogem top-up helpers (added to current input)
        function addPrimo(amount: number) {
                const current = parseInt(primogemInputStr.replace(/[^\d]/g, ''), 10) || 0;
                primogemInputStr = String(current + amount);
        }

        // Live preview of parsed value for display under input
        let parsedPrimo = $derived(parseInt(primogemInputStr.replace(/[^\d]/g, ''), 10) || 0);

        // Convenience derived for the active tab
        let activeInput = $derived(inputs[activeTab]);
        let pity5Percent = $derived(Math.min((activeInput.pity5 / 90) * 100, 100));
        let pity4Percent = $derived(Math.min((activeInput.pity4 / 10) * 100, 100));
</script>

<svelte:head>
        <title>Pity Setup — Genshin Impact Simulator</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 space-y-6">

        <!-- ═══ Header ═══ -->
        <section class="space-y-2">
                <h1 class="font-heading text-3xl md:text-4xl font-bold text-[#F2E6D0]">Pity Setup</h1>
                <p class="text-sm text-[#B8C1D3] max-w-2xl">
                        Atur pity <span class="text-[#E6C77A] font-semibold">per banner</span> — Character Event, Standard, dan Novice masing-masing punya pity terpisah, sama seperti game asli. Primogem dibagikan. Semua disimpan otomatis di localStorage.
                </p>
        </section>

        <!-- ═══ Mode Tabs ═══ -->
        <section class="flex gap-1 p-1 rounded-lg bg-[#1A2337]/60 border border-[#24314A]">
                {#each TABS as tab}
                        <button
                                onclick={() => { activeTab = tab.mode; }}
                                class="flex-1 min-w-[100px] px-3 py-2.5 rounded-md text-xs font-heading font-semibold uppercase tracking-wider transition-all {activeTab === tab.mode ? 'bg-gradient-to-r from-[#C9A45A] to-[#E6C77A] text-[#0B1020] shadow-md' : 'text-[#B8C1D3] hover:text-[#F2E6D0] hover:bg-[#24314A]/60'}"
                        >
                                {tab.icon} {tab.label}
                        </button>
                {/each}
        </section>

        <!-- ═══ Presets (apply to active tab) ═══ -->
        <section class="space-y-3">
                <h2 class="font-heading text-sm font-semibold text-[#E6C77A] uppercase tracking-wider">
                        Quick Presets <span class="text-[#8E97AA] normal-case font-normal">→ {TABS.find(t => t.mode === activeTab)?.label}</span>
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {#each MODE_PRESETS as p}
                                <button
                                        onclick={() => applyPreset(p)}
                                        class="card-premium btn-press text-left p-4 rounded-lg border border-[#C9A45A]/25 bg-gradient-to-br from-[#1A2337] to-[#0B1020]"
                                >
                                        <div class="flex items-center justify-between mb-1">
                                                <span class="font-heading text-sm font-semibold text-[#F2E6D0]">{p.label}</span>
                                                <span class="text-[10px] font-mono text-[#E6C77A]">{p.pity5}/90 · {p.pity4}/10{p.guaranteed5 ? ' · GARANSI' : ''}</span>
                                        </div>
                                        <div class="text-[11px] text-[#8E97AA] mb-1.5">{p.desc}</div>
                                        <div class="text-[10px] text-[#E6C77A] font-mono">★ {p.primogem.toLocaleString('en-US')} Primo</div>
                                </button>
                        {/each}
                </div>
        </section>

        <!-- ═══ Manual Setup (per-mode) ═══ -->
        <section class="bg-[#1A2337]/80 backdrop-blur-sm rounded-xl border border-[#C9A45A]/25 shadow-xl p-5 md:p-6 space-y-5">

                <div class="flex items-center justify-between">
                        <h2 class="font-heading text-sm font-semibold text-[#F2E6D0] uppercase tracking-wider">
                                {TABS.find(t => t.mode === activeTab)?.icon} {TABS.find(t => t.mode === activeTab)?.label} Configuration
                        </h2>
                        <span class="text-[10px] text-[#8E97AA] font-mono">
                                pity5 {game.getModePity(activeTab).pity5}/90 · pity4 {game.getModePity(activeTab).pity4}/10
                        </span>
                </div>

                <!-- 5★ Pity -->
                <div class="space-y-2">
                        <ThemedRange
                                id="pity5-{activeTab}"
                                label="5★ Pity"
                                value={activeInput.pity5}
                                min={0}
                                max={89}
                                accent="gold"
                                oninput={(e) => { inputs[activeTab].pity5 = parseInt((e.currentTarget as HTMLInputElement).value, 10); }}
                        />
                        <div class="flex justify-between text-[10px] text-[#8E97AA]">
                                <span>0 (fresh)</span>
                                <span class="text-[#E0B25A]">74 (soft pity)</span>
                                <span class="text-[#E8745A]">89 (max)</span>
                        </div>
                </div>

                <!-- 4★ Pity -->
                <div class="space-y-2">
                        <ThemedRange
                                id="pity4-{activeTab}"
                                label="4★ Pity"
                                value={activeInput.pity4}
                                min={0}
                                max={9}
                                accent="purple"
                                oninput={(e) => { inputs[activeTab].pity4 = parseInt((e.currentTarget as HTMLInputElement).value, 10); }}
                        />
                </div>

                <!-- 5★ Guaranteed Toggle (only meaningful for Character Event) -->
                {#if activeTab === 'character'}
                        <div class="flex items-center justify-between p-3 rounded-lg bg-[#0B1020]/60 border border-[#24314A]">
                                <div>
                                        <div class="text-xs font-bold text-[#E6C77A] uppercase tracking-wider">5★ Guaranteed Featured</div>
                                        <div class="text-[11px] text-[#8E97AA] mt-0.5">Aktifkan jika 5★ sebelumnya kalah 50/50 (lost). Berikutnya dijamin featured.</div>
                                </div>
                                <button
                                        onclick={() => { inputs[activeTab].guaranteed5 = !inputs[activeTab].guaranteed5; }}
                                        class="relative w-12 h-6 rounded-full transition-colors shrink-0 {activeInput.guaranteed5 ? 'bg-[#C9A45A]' : 'bg-[#24314A]'}"
                                        aria-pressed={activeInput.guaranteed5}
                                        aria-label="Toggle 5★ guaranteed featured"
                                >
                                        <span class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-[#F2E6D0] transition-transform {activeInput.guaranteed5 ? 'translate-x-6' : ''}"></span>
                                </button>
                        </div>
                {:else}
                        <div class="text-[11px] text-[#8E97AA] bg-[#0B1020]/40 border border-[#24314A] rounded-md p-3 leading-relaxed">
                                {#if activeTab === 'standard'}
                                        ◈ Standard Wish tidak punya rate-up / 50/50, jadi tidak ada toggle Guaranteed Featured. Pity 5★/4★ tetap berlaku.
                                {:else}
                                        ✚ Novice Wish menggunakan pool yang sama dengan Standard Wish (Wanderlust Invocation). Tidak ada 50/50.
                                {/if}
                        </div>
                {/if}

                <!-- Pity Lock Section -->
                <div class="space-y-2 pt-2 border-t border-[#24314A]">
                        <div class="text-xs font-bold text-[#E6C77A] uppercase tracking-wider">Pity Lock (Reset Behavior)</div>
                        <div class="text-[11px] text-[#8E97AA] mb-2">
                                Secara default, pity reset ke 0 setelah dapat 5★/4★. Aktifkan lock untuk <span class="text-[#E6C77A] font-semibold">reset ke nilai yang di-set</span> alih-alih ke 0 — berguna untuk testing soft pity berulang.
                        </div>

                        <!-- 5★ Pity Lock -->
                        <div class="flex items-center justify-between p-3 rounded-lg bg-[#0B1020]/60 border border-[#24314A]">
                                <div>
                                        <div class="text-xs font-bold text-[#E6C77A] uppercase tracking-wider">Lock Pity 5★</div>
                                        <div class="text-[11px] text-[#8E97AA] mt-0.5">
                                                Setelah dapat 5★, reset pity ke <span class="font-mono text-[#E6C77A]">{activeInput.pity5}</span> (bukan 0)
                                        </div>
                                </div>
                                <button
                                        onclick={() => { inputs[activeTab].pityLock5 = !inputs[activeTab].pityLock5; }}
                                        class="relative w-12 h-6 rounded-full transition-colors shrink-0 {activeInput.pityLock5 ? 'bg-[#C9A45A]' : 'bg-[#24314A]'}"
                                        aria-pressed={activeInput.pityLock5}
                                        aria-label="Toggle 5★ pity lock"
                                >
                                        <span class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-[#F2E6D0] transition-transform {activeInput.pityLock5 ? 'translate-x-6' : ''}"></span>
                                </button>
                        </div>

                        <!-- 4★ Pity Lock -->
                        <div class="flex items-center justify-between p-3 rounded-lg bg-[#0B1020]/60 border border-[#24314A]">
                                <div>
                                        <div class="text-xs font-bold text-[#B495F0] uppercase tracking-wider">Lock Pity 4★</div>
                                        <div class="text-[11px] text-[#8E97AA] mt-0.5">
                                                Setelah dapat 4★, reset pity ke <span class="font-mono text-[#B495F0]">{activeInput.pity4}</span> (bukan 0)
                                        </div>
                                </div>
                                <button
                                        onclick={() => { inputs[activeTab].pityLock4 = !inputs[activeTab].pityLock4; }}
                                        class="relative w-12 h-6 rounded-full transition-colors shrink-0 {activeInput.pityLock4 ? 'bg-[#8D72C9]' : 'bg-[#24314A]'}"
                                        aria-pressed={activeInput.pityLock4}
                                        aria-label="Toggle 4★ pity lock"
                                >
                                        <span class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-[#F2E6D0] transition-transform {activeInput.pityLock4 ? 'translate-x-6' : ''}"></span>
                                </button>
                        </div>

                        {#if activeInput.pityLock5 || activeInput.pityLock4}
                                <div class="text-[10px] text-[#E0B25A] bg-[#E0B25A]/10 border border-[#E0B25A]/30 rounded-md p-2 leading-relaxed">
                                        ⚠ Pity lock aktif untuk {TABS.find(t => t.mode === activeTab)?.label}. Pull 5★/4★ akan reset ke nilai yang di-set, bukan ke 0. Ini untuk simulasi/testing — di game asli pity selalu reset ke 0.
                                </div>
                        {/if}
                </div>

                <!-- Primogem (shared) -->
                <div class="space-y-2 pt-2 border-t border-[#24314A]">
                        <div class="flex justify-between items-center">
                                <label for="primogem" class="text-xs font-bold text-[#E6C77A] uppercase tracking-wider">Primogem <span class="text-[#8E97AA] normal-case font-normal">(dibagikan semua banner)</span></label>
                                <span class="text-[10px] font-mono text-[#8E97AA]">
                                        ≈ {Math.floor(parsedPrimo / 160)} wish ({Math.floor(parsedPrimo / 1600)}× 10-pull)
                                </span>
                        </div>
                        <div class="flex gap-2">
                                <div class="flex-1">
                                        <ThemedInput
                                                id="primogem"
                                                value={primogemInputStr}
                                                placeholder="0"
                                                inputmode="numeric"
                                                pattern="[0-9]*"
                                                prefix="★"
                                                oninput={(e) => {
                                                        const raw = (e.currentTarget as HTMLInputElement).value;
                                                        const clean = raw.replace(/[^\d]/g, '');
                                                        if (clean !== raw) (e.currentTarget as HTMLInputElement).value = clean;
                                                        primogemInputStr = clean;
                                                }}
                                        />
                                </div>
                                <button
                                        type="button"
                                        onclick={() => addPrimo(1600)}
                                        class="btn-press px-3 py-2.5 rounded-md border border-[#24314A] bg-[#0B1020]/60 text-[#B8C1D3] hover:text-[#E6C77A] hover:border-[#C9A45A]/40 text-xs font-mono transition-all"
                                >
                                        +1,600
                                </button>
                                <button
                                        type="button"
                                        onclick={() => addPrimo(8000)}
                                        class="btn-press px-3 py-2.5 rounded-md border border-[#24314A] bg-[#0B1020]/60 text-[#B8C1D3] hover:text-[#E6C77A] hover:border-[#C9A45A]/40 text-xs font-mono transition-all"
                                >
                                        +8,000
                                </button>
                                <button
                                        type="button"
                                        onclick={() => addPrimo(16000)}
                                        class="btn-press px-3 py-2.5 rounded-md border border-[#24314A] bg-[#0B1020]/60 text-[#B8C1D3] hover:text-[#E6C77A] hover:border-[#C9A45A]/40 text-xs font-mono transition-all"
                                >
                                        +16,000
                                </button>
                        </div>
                        <div class="text-[10px] text-[#8E97AA]">
                                Ketik jumlah primogem akunmu secara manual, atau pakai tombol quick-add. Klik <span class="text-[#E6C77A] font-semibold">Apply</span> untuk menyimpan.
                        </div>
                </div>

                <!-- Actions -->
                <div class="flex gap-2 pt-2 border-t border-[#24314A]">
                        <button
                                onclick={apply}
                                class="btn-press flex-1 px-4 py-2.5 rounded-md border border-[#C9A45A]/50 bg-gradient-to-r from-[#C9A45A] to-[#E6C77A] text-[#0B1020] font-heading font-semibold tracking-wider uppercase text-sm transition-all hover:shadow-[0_0_25px_rgba(230,199,122,0.45)]"
                        >
                                Apply
                        </button>
                        <button
                                onclick={resetAll}
                                class="btn-press px-4 py-2.5 rounded-md border border-[#8B3A3A]/50 bg-[#8B3A3A]/15 text-[#E8745A] text-sm font-semibold uppercase tracking-wider hover:bg-[#8B3A3A]/25 transition-all"
                        >
                                Reset All
                        </button>
                </div>

                {#if saved}
                        <div class="text-xs text-[#6FAF6E] flex items-center gap-2" in:fly={{ y: -6, duration: 200, easing: cubicOut }}>
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                Tersimpan ke localStorage.
                        </div>
                {/if}
        </section>

        <!-- ═══ Current State (all 3 modes at a glance) ═══ -->
        <section class="space-y-3">
                <h2 class="font-heading text-sm font-semibold text-[#E6C77A] uppercase tracking-wider">Current State — All Banners</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {#each TABS as tab}
                                {@const m = game.getModePity(tab.mode)}
                                <div class="bg-[#1A2337]/80 border border-[#C9A45A]/20 rounded-lg p-4 space-y-2">
                                        <div class="flex items-center justify-between">
                                                <span class="text-xs font-heading font-semibold {tab.accent} uppercase tracking-wider">{tab.icon} {tab.label}</span>
                                                {#if game.wishMode === tab.mode}
                                                        <span class="text-[9px] px-1.5 py-0.5 rounded bg-[#E6C77A]/20 text-[#E6C77A] font-bold">ACTIVE</span>
                                                {/if}
                                        </div>
                                        <div class="grid grid-cols-2 gap-2 text-center">
                                                <div class="bg-[#0B1020]/40 rounded p-2">
                                                        <div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">Pity 5★</div>
                                                        <div class="font-mono text-lg font-bold text-[#E6C77A] tabular-nums">{m.pity5}/90</div>
                                                </div>
                                                <div class="bg-[#0B1020]/40 rounded p-2">
                                                        <div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">Pity 4★</div>
                                                        <div class="font-mono text-lg font-bold text-[#B495F0] tabular-nums">{m.pity4}/10</div>
                                                </div>
                                        </div>
                                        {#if tab.mode === 'character'}
                                                <div class="text-[10px] text-[#8E97AA] text-center">
                                                        Guaranteed: <span class="{m.guaranteed5 ? 'text-[#E6C77A] font-bold' : 'text-[#5E6478]'}">{m.guaranteed5 ? 'YA' : 'TIDAK'}</span>
                                                </div>
                                        {/if}
                                        {#if m.pityLock5 !== null || m.pityLock4 !== null}
                                                <div class="text-[9px] text-[#E0B25A] text-center">🔒 Lock aktif</div>
                                        {/if}
                                </div>
                        {/each}
                </div>
                <div class="bg-[#1A2337]/80 border border-[#C9A45A]/20 rounded-lg p-4 text-center">
                        <div class="text-[10px] text-[#8E97AA] uppercase tracking-wider">Primogem (Shared)</div>
                        <div class="font-mono text-2xl font-bold text-[#E6C77A] tabular-nums mt-1">{game.primogem.toLocaleString('en-US')}</div>
                </div>
        </section>

        <!-- ═══ Info ═══ -->
        <div class="text-xs text-[#8E97AA] bg-[#1A2337]/40 border border-[#24314A] rounded-md p-4 leading-relaxed" in:fade>
                <span class="text-[#E6C77A] font-semibold">Catatan:</span>
                Tiap banner punya pity terpisah (sama seperti game asli). Pull di Character Event tidak menggeser pity Standard. Reset All akan menghapus primogem, semua pity, dan history. Untuk hanya menghapus history, gunakan tombol di halaman <a href="/history" class="text-[#C9A45A] hover:text-[#E6C77A]">/history</a>.
        </div>

</div>
