<script lang="ts">
        // ─── Settings Page ──────────────────────────────────────────────────────
        // Centralized preferences: sound settings, wish animation, language,
        // and quick links to related pages (pity-setup, calculator). Keeps the
        // wish page's left column clean by moving SoundSettings here.

        import { getGameState } from '$lib/stores/gameState.svelte';
        import SoundSettings from '$lib/components/SoundSettings.svelte';
        import { isSoundEnabled, setSoundEnabled, primeAudio } from '$lib/audio/synth.svelte';
        import { t, localeKey, setLocale, getLocale, type Locale } from '$lib/i18n/index.svelte';
        import { fade } from 'svelte/transition';

        // Re-render on locale change
        void localeKey();

        const game = getGameState();

        // ── Master sound enable ──
        let soundOn = $state(isSoundEnabled());
        function toggleMasterSound() {
                setSoundEnabled(!soundOn);
                soundOn = isSoundEnabled();
                if (soundOn) primeAudio();
        }

        // ── Locale ──
        // localeKey() returns the reactive locale state — touching it inside
        // $derived makes this re-run whenever the locale changes.
        let currentLocale = $derived(localeKey());
        function switchLocale(loc: Locale) {
                setLocale(loc);
        }
</script>

<svelte:head>
        <title>{t('nav.settings')} — Genshin Impact Simulator</title>
        <meta name="description" content="Atur preferensi simulasi: bahasa, suara, animasi wish, dan lainnya." />
        <meta property="og:title" content="{t('nav.settings')} — Genshin Impact Simulator" />
        <meta property="og:description" content="Atur preferensi simulasi: bahasa, suara, animasi wish, dan lainnya." />
        <meta name="twitter:title" content="{t('nav.settings')} — Genshin Impact Simulator" />
        <meta property="og:image" content="https://xiaoxiaohui.my.id/screenshot.png" />
        <meta property="og:image:alt" content="Genshin Impact Wish Simulator" />
        <meta name="twitter:image" content="https://xiaoxiaohui.my.id/screenshot.png" />
</svelte:head>

<div class="max-w-3xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 space-y-6">

        <!-- ═══ Header ═══ -->
        <section class="space-y-2">
                <h1 class="font-heading text-3xl md:text-4xl font-bold text-[#F2E6D0]">{t('settings.title')}</h1>
                <p class="text-sm text-[#B8C1D3]">
                        {t('settings.subtitle')}
                </p>
        </section>

        <!-- ═══ Master Sound Toggle ═══ -->
        <section class="bg-[#1A2337]/80 backdrop-blur-sm rounded-xl border border-[#C9A45A]/25 shadow-xl p-5 space-y-4">
                <h2 class="font-heading text-sm font-semibold text-[#F2E6D0] uppercase tracking-wider">
                        {t('settings.audio')}
                </h2>

                <!-- Master enable -->
                <div class="flex items-center justify-between p-3 rounded-lg bg-[#0B1020]/60 border border-[#24314A]">
                        <div>
                                <div class="text-xs font-bold text-[#E6C77A] uppercase tracking-wider">{t('settings.master-sound')}</div>
                                <div class="text-[11px] text-[#8E97AA] mt-0.5">
                                        {soundOn ? t('settings.master-on') : t('settings.master-off')}
                                </div>
                        </div>
                        <button
                                onclick={toggleMasterSound}
                                class="relative w-12 h-6 rounded-full transition-colors shrink-0 {soundOn ? 'bg-[#C9A45A]' : 'bg-[#24314A]'}"
                                aria-pressed={soundOn}
                                aria-label="Toggle master sound"
                        >
                                <span class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-[#F2E6D0] transition-transform {soundOn ? 'translate-x-6' : ''}"></span>
                        </button>
                </div>

                <!-- Granular settings (only relevant if master is on) -->
                {#if soundOn}
                        <div in:fade>
                                <SoundSettings />
                        </div>
                {:else}
                        <div class="text-[11px] text-[#8E97AA] italic p-3 bg-[#0B1020]/40 rounded-md border border-[#24314A]">
                                {t('settings.master-hint')}
                        </div>
                {/if}
        </section>

        <!-- ═══ Wish Animation ═══ -->
        <section class="bg-[#1A2337]/80 backdrop-blur-sm rounded-xl border border-[#C9A45A]/25 shadow-xl p-5 space-y-4">
                <h2 class="font-heading text-sm font-semibold text-[#F2E6D0] uppercase tracking-wider">
                        {t('settings.wish-anim')}
                </h2>

                <div class="flex items-center justify-between p-3 rounded-lg bg-[#0B1020]/60 border border-[#24314A]">
                        <div>
                                <div class="text-xs font-bold text-[#E6C77A] uppercase tracking-wider">{t('wish.skip-animation.label')}</div>
                                <div class="text-[11px] text-[#8E97AA] mt-0.5">
                                        {game.skipAnimation
                                                ? t('wish.skip-animation.on')
                                                : t('wish.skip-animation.off')}
                                </div>
                        </div>
                        <button
                                onclick={() => game.setSkipAnimation(!game.skipAnimation)}
                                class="relative w-12 h-6 rounded-full transition-colors shrink-0 {game.skipAnimation ? 'bg-[#C9A45A]' : 'bg-[#24314A]'}"
                                aria-pressed={game.skipAnimation}
                                aria-label="Toggle skip animation"
                        >
                                <span class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-[#F2E6D0] transition-transform {game.skipAnimation ? 'translate-x-6' : ''}"></span>
                        </button>
                </div>

                <div class="text-[11px] text-[#8E97AA] leading-relaxed">
                        {t('settings.wish-anim-hint')}
                </div>
        </section>

        <!-- ═══ Language ═══ -->
        <section class="bg-[#1A2337]/80 backdrop-blur-sm rounded-xl border border-[#C9A45A]/25 shadow-xl p-5 space-y-4">
                <h2 class="font-heading text-sm font-semibold text-[#F2E6D0] uppercase tracking-wider">
                        {t('settings.language')}
                </h2>

                <div class="grid grid-cols-2 gap-3">
                        <button
                                onclick={() => switchLocale('id')}
                                class="btn-press p-3 rounded-lg border transition-all {currentLocale === 'id'
                                        ? 'border-[#E6C77A] bg-[#E6C77A]/10 text-[#E6C77A]'
                                        : 'border-[#24314A] bg-[#0B1020]/40 text-[#B8C1D3] hover:border-[#C9A45A]/40'}"
                        >
                                <div class="text-sm font-bold uppercase tracking-wider">Bahasa Indonesia</div>
                                <div class="text-[10px] mt-0.5 opacity-70">ID</div>
                        </button>
                        <button
                                onclick={() => switchLocale('en')}
                                class="btn-press p-3 rounded-lg border transition-all {currentLocale === 'en'
                                        ? 'border-[#E6C77A] bg-[#E6C77A]/10 text-[#E6C77A]'
                                        : 'border-[#24314A] bg-[#0B1020]/40 text-[#B8C1D3] hover:border-[#C9A45A]/40'}"
                        >
                                <div class="text-sm font-bold uppercase tracking-wider">English</div>
                                <div class="text-[10px] mt-0.5 opacity-70">EN</div>
                        </button>
                </div>
        </section>

        <!-- ═══ Quick Links ═══ -->
        <section class="bg-[#1A2337]/80 backdrop-blur-sm rounded-xl border border-[#C9A45A]/25 shadow-xl p-5 space-y-3">
                <h2 class="font-heading text-sm font-semibold text-[#F2E6D0] uppercase tracking-wider">
                        {t('settings.related')}
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <a href="/pity-setup" class="btn-press p-3 rounded-lg border border-[#C9A45A]/30 bg-gradient-to-br from-[#1A2337] to-[#0B1020] hover:border-[#E6C77A]/60 transition-all text-center">
                                <div class="text-xl text-[#E6C77A] mb-1">⚙</div>
                                <div class="text-xs font-bold text-[#F2E6D0] uppercase tracking-wider">{t('settings.related-pity')}</div>
                                <div class="text-[10px] text-[#8E97AA] mt-0.5">{t('settings.related-pity-desc')}</div>
                        </a>
                        <a href="/calculator" class="btn-press p-3 rounded-lg border border-[#C9A45A]/30 bg-gradient-to-br from-[#1A2337] to-[#0B1020] hover:border-[#E6C77A]/60 transition-all text-center">
                                <div class="text-xl text-[#E6C77A] mb-1">◈</div>
                                <div class="text-xs font-bold text-[#F2E6D0] uppercase tracking-wider">{t('settings.related-calc')}</div>
                                <div class="text-[10px] text-[#8E97AA] mt-0.5">{t('settings.related-calc-desc')}</div>
                        </a>
                        <a href="/history" class="btn-press p-3 rounded-lg border border-[#C9A45A]/30 bg-gradient-to-br from-[#1A2337] to-[#0B1020] hover:border-[#E6C77A]/60 transition-all text-center">
                                <div class="text-xl text-[#E6C77A] mb-1">☰</div>
                                <div class="text-xs font-bold text-[#F2E6D0] uppercase tracking-wider">{t('settings.related-history')}</div>
                                <div class="text-[10px] text-[#8E97AA] mt-0.5">{t('settings.related-history-desc')}</div>
                        </a>
                </div>
        </section>

        <!-- ═══ Data Management ═══ -->
        <section class="bg-[#1A2337]/80 backdrop-blur-sm rounded-xl border border-[#C9A45A]/25 shadow-xl p-5 space-y-3">
                <h2 class="font-heading text-sm font-semibold text-[#F2E6D0] uppercase tracking-wider">
                        {t('settings.data')}
                </h2>
                <div class="text-[11px] text-[#8E97AA] leading-relaxed space-y-1">
                        <div>• {t('settings.data-1')}</div>
                        <div>• {t('settings.data-2')}</div>
                        <div>• {t('settings.data-3')}</div>
                        <div>• {t('settings.data-4')}</div>
                </div>
        </section>

</div>
