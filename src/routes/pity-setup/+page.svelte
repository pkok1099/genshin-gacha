<script lang="ts">
        import { getGameState } from '$lib/stores/gameState.svelte';
        import { fly, fade } from 'svelte/transition';
        import { cubicOut } from 'svelte/easing';
        import ThemedRange from '$lib/components/ThemedRange.svelte';
        import ThemedInput from '$lib/components/ThemedInput.svelte';

        const game = getGameState();

        let pity5Input = $state(game.pity5);
        let pity4Input = $state(game.pity4);
        let guaranteed5Input = $state(game.guaranteed5);
        let primogemInput = $state(game.primogem);
        let primogemInputStr = $state(String(game.primogem));
        let pityLock5Enabled = $state(game.pityLock5 !== null);
        let pityLock4Enabled = $state(game.pityLock4 !== null);

        // Sync inputs when external state changes
        $effect(() => {
                pity5Input = game.pity5;
                pity4Input = game.pity4;
                guaranteed5Input = game.guaranteed5;
                primogemInput = game.primogem;
                primogemInputStr = String(game.primogem);
                pityLock5Enabled = game.pityLock5 !== null;
                pityLock4Enabled = game.pityLock4 !== null;
        });

        let saved = $state(false);

        function apply() {
                // Parse primogem input safely (allow empty = 0)
                const parsed = parseInt(primogemInputStr.replace(/[^\d]/g, ''), 10);
                const primoAmount = Number.isFinite(parsed) ? parsed : 0;
                game.setPity(pity5Input, pity4Input);
                game.setGuaranteed5(guaranteed5Input);
                game.setPrimogem(primoAmount);
                primogemInput = primoAmount;
                // Apply pity locks
                game.setPityLock5(pityLock5Enabled ? pity5Input : null);
                game.setPityLock4(pityLock4Enabled ? pity4Input : null);
                saved = true;
                setTimeout(() => { saved = false; }, 2000);
        }

        function resetAll() {
                game.resetAll();
                pity5Input = 0;
                pity4Input = 0;
                guaranteed5Input = false;
                primogemInput = game.DEFAULT_PRIMOGEM;
                primogemInputStr = String(game.DEFAULT_PRIMOGEM);
                pityLock5Enabled = false;
                pityLock4Enabled = false;
                saved = true;
                setTimeout(() => { saved = false; }, 2000);
        }

        const PRESETS: { label: string; pity5: number; pity4: number; guaranteed5: boolean; primogem: number; desc: string }[] = [
                { label: 'Fresh Account',      pity5: 0,  pity4: 0,  guaranteed5: false, primogem: 16000, desc: 'Akun baru, 0 pity, 16k primo' },
                { label: 'Soft Pity Zone',     pity5: 74, pity4: 5,  guaranteed5: false, primogem: 12800, desc: 'Tepat di soft pity 5★ (8× 10-pull worth)' },
                { label: 'Near Hard Pity',     pity5: 85, pity4: 9,  guaranteed5: false, primogem: 1600,  desc: 'Dekat hard pity 90, 1× 10-pull ready' },
                { label: 'Guaranteed Featured', pity5: 0, pity4: 0,  guaranteed5: true,  primogem: 16000, desc: '5★ berikutnya dijamin featured' }
        ];

        function applyPreset(p: typeof PRESETS[number]) {
                pity5Input = p.pity5;
                pity4Input = p.pity4;
                guaranteed5Input = p.guaranteed5;
                primogemInput = p.primogem;
                primogemInputStr = String(p.primogem);
                game.setPity(p.pity5, p.pity4);
                game.setGuaranteed5(p.guaranteed5);
                game.setPrimogem(p.primogem);
                saved = true;
                setTimeout(() => { saved = false; }, 2000);
        }

        let pity5Percent = $derived(Math.min((pity5Input / 90) * 100, 100));
        let pity4Percent = $derived(Math.min((pity4Input / 10) * 100, 100));

        // Quick primogem top-up helpers (added to current input)
        function addPrimo(amount: number) {
                const current = parseInt(primogemInputStr.replace(/[^\d]/g, ''), 10) || 0;
                primogemInputStr = String(current + amount);
        }

        // Live preview of parsed value for display under input
        let parsedPrimo = $derived(parseInt(primogemInputStr.replace(/[^\d]/g, ''), 10) || 0);
</script>

<svelte:head>
        <title>Pity Setup — Genshin Impact Simulator</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 space-y-6">

        <!-- ═══ Header ═══ -->
        <section class="space-y-2">
                <h1 class="font-heading text-3xl md:text-4xl font-bold text-[#F2E6D0]">Pity Setup</h1>
                <p class="text-sm text-[#B8C1D3] max-w-2xl">
                        Atur pity dan <span class="text-[#E6C77A] font-semibold">primogem</span> agar simulasi sesuai kondisi akun Genshin Impact aslimu. Semua disimpan otomatis di localStorage.
                </p>
        </section>

        <!-- ═══ Presets ═══ -->
        <section class="space-y-3">
                <h2 class="font-heading text-sm font-semibold text-[#E6C77A] uppercase tracking-wider">Quick Presets</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {#each PRESETS as p}
                                <button
                                        onclick={() => applyPreset(p)}
                                        class="text-left p-4 rounded-lg border border-[#C9A45A]/25 bg-gradient-to-br from-[#1A2337] to-[#0B1020] hover:border-[#E6C77A]/60 transition-all"
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

        <!-- ═══ Manual Setup ═══ -->
        <section class="bg-[#1A2337]/80 backdrop-blur-sm rounded-xl border border-[#C9A45A]/25 shadow-xl p-5 md:p-6 space-y-5">
                <h2 class="font-heading text-sm font-semibold text-[#F2E6D0] uppercase tracking-wider">Manual Configuration</h2>

                <!-- 5★ Pity -->
                <div class="space-y-2">
                        <ThemedRange
                                id="pity5"
                                label="5★ Pity"
                                value={pity5Input}
                                min={0}
                                max={89}
                                accent="gold"
                                oninput={(e) => { pity5Input = parseInt((e.currentTarget as HTMLInputElement).value, 10); }}
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
                                id="pity4"
                                label="4★ Pity"
                                value={pity4Input}
                                min={0}
                                max={9}
                                accent="purple"
                                oninput={(e) => { pity4Input = parseInt((e.currentTarget as HTMLInputElement).value, 10); }}
                        />
                </div>

                <!-- Primogem Manual Input -->
                <div class="space-y-2 pt-2 border-t border-[#24314A]">
                        <div class="flex justify-between items-center">
                                <label for="primogem" class="text-xs font-bold text-[#E6C77A] uppercase tracking-wider">Primogem</label>
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
                                        class="px-3 py-2.5 rounded-md border border-[#24314A] bg-[#0B1020]/60 text-[#B8C1D3] hover:text-[#E6C77A] hover:border-[#C9A45A]/40 text-xs font-mono transition-all"
                                >
                                        +1,600
                                </button>
                                <button
                                        type="button"
                                        onclick={() => addPrimo(8000)}
                                        class="px-3 py-2.5 rounded-md border border-[#24314A] bg-[#0B1020]/60 text-[#B8C1D3] hover:text-[#E6C77A] hover:border-[#C9A45A]/40 text-xs font-mono transition-all"
                                >
                                        +8,000
                                </button>
                                <button
                                        type="button"
                                        onclick={() => addPrimo(16000)}
                                        class="px-3 py-2.5 rounded-md border border-[#24314A] bg-[#0B1020]/60 text-[#B8C1D3] hover:text-[#E6C77A] hover:border-[#C9A45A]/40 text-xs font-mono transition-all"
                                >
                                        +16,000
                                </button>
                        </div>
                        <div class="text-[10px] text-[#8E97AA]">
                                Ketik jumlah primogem akunmu secara manual, atau pakai tombol quick-add. Klik <span class="text-[#E6C77A] font-semibold">Apply</span> untuk menyimpan.
                        </div>
                </div>

                <!-- 5★ Guaranteed Toggle -->
                <div class="flex items-center justify-between p-3 rounded-lg bg-[#0B1020]/60 border border-[#24314A]">
                        <div>
                                <div class="text-xs font-bold text-[#E6C77A] uppercase tracking-wider">5★ Guaranteed Featured</div>
                                <div class="text-[11px] text-[#8E97AA] mt-0.5">Aktifkan jika 5★ sebelumnya kalah 50/50 (lost). Berikutnya dijamin featured.</div>
                        </div>
                        <button
                                onclick={() => guaranteed5Input = !guaranteed5Input}
                                class="relative w-12 h-6 rounded-full transition-colors shrink-0 {guaranteed5Input ? 'bg-[#C9A45A]' : 'bg-[#24314A]'}"
                                aria-pressed={guaranteed5Input}
                                aria-label="Toggle 5★ guaranteed featured"
                        >
                                <span class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-[#F2E6D0] transition-transform {guaranteed5Input ? 'translate-x-6' : ''}"></span>
                        </button>
                </div>

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
                                                Setelah dapat 5★, reset pity ke <span class="font-mono text-[#E6C77A]">{pity5Input}</span> (bukan 0)
                                        </div>
                                </div>
                                <button
                                        onclick={() => pityLock5Enabled = !pityLock5Enabled}
                                        class="relative w-12 h-6 rounded-full transition-colors shrink-0 {pityLock5Enabled ? 'bg-[#C9A45A]' : 'bg-[#24314A]'}"
                                        aria-pressed={pityLock5Enabled}
                                        aria-label="Toggle 5★ pity lock"
                                >
                                        <span class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-[#F2E6D0] transition-transform {pityLock5Enabled ? 'translate-x-6' : ''}"></span>
                                </button>
                        </div>

                        <!-- 4★ Pity Lock -->
                        <div class="flex items-center justify-between p-3 rounded-lg bg-[#0B1020]/60 border border-[#24314A]">
                                <div>
                                        <div class="text-xs font-bold text-[#B495F0] uppercase tracking-wider">Lock Pity 4★</div>
                                        <div class="text-[11px] text-[#8E97AA] mt-0.5">
                                                Setelah dapat 4★, reset pity ke <span class="font-mono text-[#B495F0]">{pity4Input}</span> (bukan 0)
                                        </div>
                                </div>
                                <button
                                        onclick={() => pityLock4Enabled = !pityLock4Enabled}
                                        class="relative w-12 h-6 rounded-full transition-colors shrink-0 {pityLock4Enabled ? 'bg-[#8D72C9]' : 'bg-[#24314A]'}"
                                        aria-pressed={pityLock4Enabled}
                                        aria-label="Toggle 4★ pity lock"
                                >
                                        <span class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-[#F2E6D0] transition-transform {pityLock4Enabled ? 'translate-x-6' : ''}"></span>
                                </button>
                        </div>

                        {#if pityLock5Enabled || pityLock4Enabled}
                                <div class="text-[10px] text-[#E0B25A] bg-[#E0B25A]/10 border border-[#E0B25A]/30 rounded-md p-2 leading-relaxed">
                                        ⚠ Pity lock aktif. Pull 5★/4★ akan reset ke nilai yang di-set, bukan ke 0. Ini untuk simulasi/testing — di game asli pity selalu reset ke 0.
                                </div>
                        {/if}
                </div>

                <!-- Actions -->
                <div class="flex gap-2 pt-2 border-t border-[#24314A]">
                        <button
                                onclick={apply}
                                class="flex-1 px-4 py-2.5 rounded-md border border-[#C9A45A]/50 bg-gradient-to-r from-[#C9A45A] to-[#E6C77A] text-[#0B1020] font-heading font-semibold tracking-wider uppercase text-sm transition-all hover:shadow-[0_0_25px_rgba(230,199,122,0.45)]"
                        >
                                Apply
                        </button>
                        <button
                                onclick={resetAll}
                                class="px-4 py-2.5 rounded-md border border-[#8B3A3A]/50 bg-[#8B3A3A]/15 text-[#E8745A] text-sm font-semibold uppercase tracking-wider hover:bg-[#8B3A3A]/25 transition-all"
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

        <!-- ═══ Current State ═══ -->
        <section class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div class="bg-[#1A2337]/80 border border-[#C9A45A]/20 rounded-lg p-4 text-center">
                        <div class="text-[10px] text-[#8E97AA] uppercase tracking-wider">Current Pity 5★</div>
                        <div class="font-mono text-2xl font-bold text-[#E6C77A] tabular-nums mt-1">{game.pity5}/90</div>
                </div>
                <div class="bg-[#1A2337]/80 border border-[#8D72C9]/20 rounded-lg p-4 text-center">
                        <div class="text-[10px] text-[#8E97AA] uppercase tracking-wider">Current Pity 4★</div>
                        <div class="font-mono text-2xl font-bold text-[#B495F0] tabular-nums mt-1">{game.pity4}/10</div>
                </div>
                <div class="bg-[#1A2337]/80 border border-[#C9A45A]/20 rounded-lg p-4 text-center">
                        <div class="text-[10px] text-[#8E97AA] uppercase tracking-wider">Guaranteed 5★</div>
                        <div class="font-mono text-2xl font-bold mt-1 {game.guaranteed5 ? 'text-[#E6C77A]' : 'text-[#5E6478]'}">{game.guaranteed5 ? 'YA' : 'TIDAK'}</div>
                </div>
                <div class="bg-[#1A2337]/80 border border-[#C9A45A]/20 rounded-lg p-4 text-center">
                        <div class="text-[10px] text-[#8E97AA] uppercase tracking-wider">Primogem</div>
                        <div class="font-mono text-2xl font-bold text-[#E6C77A] tabular-nums mt-1">{game.primogem.toLocaleString('en-US')}</div>
                </div>
        </section>

        <!-- ═══ Info ═══ -->
        <div class="text-xs text-[#8E97AA] bg-[#1A2337]/40 border border-[#24314A] rounded-md p-4 leading-relaxed" in:fade>
                <span class="text-[#E6C77A] font-semibold">Catatan:</span>
                Reset All akan menghapus primogem, pity, dan history. Untuk hanya menghapus history, gunakan tombol di halaman <a href="/history" class="text-[#C9A45A] hover:text-[#E6C77A]">/history</a>.
        </div>

</div>
