<script lang="ts">
        import '../app.css';
        import { page } from '$app/state';
        import { navigating } from '$app/state';
        import { fly, fade } from 'svelte/transition';
        import { cubicOut } from 'svelte/easing';
        import { getGameState } from '$lib/stores/gameState.svelte';
        import { getBannerStore } from '$lib/stores/bannerStore.svelte';
        import PrimoCounter from '$lib/components/PrimoCounter.svelte';
        import GenshinLoader from '$lib/components/GenshinLoader.svelte';
        import AreaLoader from '$lib/components/AreaLoader.svelte';
        import Toaster from '$lib/components/Toaster.svelte';
        import type { Region } from '$lib/components/AreaLoader.svelte';
        import { clickOutside } from '$lib/actions/clickOutside';
        import { t, localeKey, toggleLocale, type Locale } from '$lib/i18n/index.svelte';
        import { isSoundEnabled, toggleSound, primeAudio, playTick } from '$lib/audio/synth.svelte';
        import { regionForElement } from '$lib/utils/pityCalculator';

        // Re-render on locale change
        void localeKey();

        const game = getGameState();
        const banners = getBannerStore();

        let { children } = $props();

        // Nav items (Calculator inserted between Wish and RNG Sims)
        const navItems: { href: string; key: string; icon: string }[] = [
                { href: '/',           key: 'nav.home',       icon: '⌂' },
                { href: '/wish',       key: 'nav.wish',       icon: '✦' },
                { href: '/calculator', key: 'nav.calculator', icon: '◈' },
                { href: '/history',    key: 'nav.history',    icon: '☰' },
                { href: '/pity-setup', key: 'nav.pity-setup', icon: '⚙' },
                { href: '/redeem',     key: 'nav.redeem',     icon: '✉' },
                { href: '/settings',   key: 'nav.settings',   icon: '♪' }
        ];

        const rngSubItems: { href: string; key: string; icon: string; category: string }[] = [
                { href: '/rng/artifact',   key: 'Artifact Substat', icon: '◈', category: 'Wish & Artifact' },
                { href: '/rng/strongbox',  key: 'Strongbox',        icon: '▣', category: 'Wish & Artifact' },
                { href: '/rng/weapon',     key: 'Weapon Banner',    icon: '✦', category: 'Wish & Artifact' },
                { href: '/rng/boss',       key: 'Normal Boss',      icon: '✺', category: 'Domain & Boss' },
                { href: '/rng/domain',     key: 'Domain Drops',     icon: '⌬', category: 'Domain & Boss' },
                { href: '/rng/talent',     key: 'Talent Drops',     icon: '✚', category: 'Domain & Boss' },
                { href: '/rng/cooking',    key: 'Cooking',          icon: '♨', category: 'Crafting' },
                { href: '/rng/parametric', key: 'Parametric',       icon: '◈', category: 'Crafting' }
        ];

        const RNG_CATEGORY_KEYS = ['nav.category.wish-artifact', 'nav.category.domain-boss', 'nav.category.crafting'];
        const RNG_CATEGORY_RAW = ['Wish & Artifact', 'Domain & Boss', 'Crafting'];

        let rngDropdownOpen = $state(false);
        let mobileOpen = $state(false);
        let mobileRngOpen = $state(false);

        let isRngActive = $derived(page.url.pathname.startsWith('/rng'));

        // Close mobile nav + RNG dropdown on route change so the menu doesn't
        // stay open after navigating to a new page.
        $effect(() => {
                void page.url.pathname;
                mobileOpen = false;
                mobileRngOpen = false;
                rngDropdownOpen = false;
        });

        // ── Smart loader: only show full loader if navigation takes >280ms.
        //    Loader theme picks region based on the destination's featured char
        //    element if known, otherwise cycles Mondstadt → Liyue → Inazuma...
        let showFullLoader = $state(false);
        let loaderTimer: ReturnType<typeof setTimeout> | null = null;
        let loaderRegion: Region = $state('mondstadt');

        // Cycle through regions for variety on each navigation
        const REGION_CYCLE: Region[] = ['mondstadt', 'liyue', 'inazuma', 'sumeru', 'fontaine', 'natlan'];
        let regionIdx = 0;

        $effect(() => {
                const nav = navigating;
                if (nav && nav.to?.url.pathname !== nav.from?.url.pathname) {
                        if (loaderTimer) clearTimeout(loaderTimer);
                        // Pick region: try featured char element first, else cycle
                        const featured = banners.featured5Star;
                        if (featured?.element) {
                                loaderRegion = regionForElement(featured.element);
                        } else {
                                loaderRegion = REGION_CYCLE[regionIdx % REGION_CYCLE.length]!;
                                regionIdx++;
                        }
                        loaderTimer = setTimeout(() => {
                                if (navigating) showFullLoader = true;
                        }, 280);
                } else {
                        if (loaderTimer) { clearTimeout(loaderTimer); loaderTimer = null; }
                        showFullLoader = false;
                }
        });

        // ── Sound toggle UI state — read from synth module on each render
        let soundOn = $state(isSoundEnabled());
        function handleSoundToggle() {
                primeAudio();
                soundOn = toggleSound();
                if (soundOn) playTick();
        }

        // ── Language toggle
        function handleLangToggle() {
                toggleLocale();
                playTick();
        }
        let currentLocale: Locale = $derived(t('nav.lang') === 'Bahasa' ? 'id' : 'en');

        function isActive(href: string): boolean {
                if (href === '/') return page.url.pathname === '/';
                return page.url.pathname === href;
        }

        function navLabel(key: string, fallback: string): string {
                const translated = t(key);
                // For RNG sub-items, the keys are raw labels (not in dict) — fall back
                return translated === key ? fallback : translated;
        }
</script>

<svelte:head>
        <!-- Default social-share metadata; pages set og:title/og:description
             and their own og:image (screenshot or current banner character). -->
        <meta property="og:site_name" content="Genshin Impact Wish Simulator" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="theme-color" content="#0B1020" />
</svelte:head>

<!-- ═══ Top Bar ═══ -->
<header class="sticky top-0 z-40 backdrop-blur-md bg-[#0B1020]/80 border-b border-[#C9A45A]/15">
        <div class="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                <div class="flex items-center justify-between h-14">
                        <!-- Logo -->
                        <a href="/" class="flex items-center gap-2 group">
                                <span class="text-2xl text-[#E6C77A] group-hover:text-[#F2E6D0] transition-colors">✦</span>
                                <span class="font-heading text-base md:text-lg font-semibold text-[#F2E6D0] tracking-wide hidden sm:inline">
                                        Wish Simulator
                                </span>
                        </a>

                        <!-- Desktop Nav -->
                        <nav class="hidden md:flex items-center gap-1">
                                {#each navItems as item}
                                        <a
                                                href={item.href}
                                                class="btn-press px-3 py-1.5 rounded-md text-sm font-medium transition-all
                                                        {isActive(item.href)
                                                                ? 'text-[#E6C77A] bg-[#C9A45A]/10 border border-[#C9A45A]/30'
                                                                : 'text-[#B8C1D3] hover:text-[#F2E6D0] hover:bg-[#24314A]/50 border border-transparent'}"
                                        >
                                                <span class="mr-1 opacity-70">{item.icon}</span>
                                                {t(item.key)}
                                        </a>
                                {/each}

                                <!-- RNG Sims Dropdown -->
                                <div class="relative" use:clickOutside={() => rngDropdownOpen = false}>
                                        <button
                                                onclick={() => rngDropdownOpen = !rngDropdownOpen}
                                                class="btn-press px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1
                                                        {isRngActive
                                                                ? 'text-[#E6C77A] bg-[#C9A45A]/10 border border-[#C9A45A]/30'
                                                                : 'text-[#B8C1D3] hover:text-[#F2E6D0] hover:bg-[#24314A]/50 border border-transparent'}"
                                                aria-expanded={rngDropdownOpen}
                                                aria-haspopup="true"
                                        >
                                                <span class="mr-1 opacity-70">◈</span>
                                                {t('nav.rng-sims')}
                                                <svg class="w-3.5 h-3.5 ml-0.5 transition-transform {rngDropdownOpen ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                                                </svg>
                                        </button>

                                        {#if rngDropdownOpen}
                                                <div
                                                        class="absolute right-0 top-full mt-1 z-50 w-64 rounded-lg border border-[#C9A45A]/30 bg-[#141C2F] shadow-xl overflow-hidden"
                                                        transition:fly={{ y: -8, duration: 180, easing: cubicOut }}
                                                >
                                                        <a
                                                                href="/rng"
                                                                onclick={() => rngDropdownOpen = false}
                                                                class="block px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#E6C77A] hover:bg-[#24314A] transition-colors border-b border-[#24314A] bg-[#C9A45A]/5"
                                                        >
                                                                {t('nav.rng-overview')}
                                                        </a>

                                                        {#each RNG_CATEGORY_KEYS as catKey, i}
                                                                <div class="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#8E97AA] bg-[#0B1020]/40">
                                                                        {t(catKey)}
                                                                </div>
                                                                {#each rngSubItems as item}
                                                                        {#if item.category === RNG_CATEGORY_RAW[i]}
                                                                                <a
                                                                                        href={item.href}
                                                                                        onclick={() => rngDropdownOpen = false}
                                                                                        class="flex items-center gap-2 px-3 py-2 text-sm transition-colors {isActive(item.href) ? 'bg-[#C9A45A]/15 text-[#E6C77A]' : 'text-[#B8C1D3] hover:bg-[#24314A] hover:text-[#F2E6D0]'}"
                                                                                >
                                                                                        <span class="opacity-70 w-4 text-center">{item.icon}</span>
                                                                                        <span class="truncate">{item.key}</span>
                                                                                </a>
                                                                        {/if}
                                                                {/each}
                                                        {/each}
                                                </div>
                                        {/if}
                                </div>
                        </nav>

                        <!-- Right: Controls + Primo Counter + Mobile Toggle -->
                        <div class="flex items-center gap-1.5">
                                <!-- Language toggle -->
                                <button
                                        onclick={handleLangToggle}
                                        class="btn-press px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider border border-[#24314A] bg-[#1A2337]/60 text-[#B8C1D3] hover:text-[#E6C77A] hover:border-[#C9A45A]/40 transition-all"
                                        title={t('nav.lang')}
                                        aria-label={t('nav.lang')}
                                >
                                        {currentLocale}
                                </button>

                                <!-- Sound toggle -->
                                <button
                                        onclick={handleSoundToggle}
                                        class="btn-press p-2 rounded-md border border-[#24314A] bg-[#1A2337]/60 text-[#B8C1D3] hover:text-[#E6C77A] hover:border-[#C9A45A]/40 transition-all"
                                        title={soundOn ? t('nav.sound.on') : t('nav.sound.off')}
                                        aria-label={soundOn ? t('nav.sound.on') : t('nav.sound.off')}
                                >
                                        {#if soundOn}
                                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M5 9v6h4l5 4V5L9 9H5z" />
                                                </svg>
                                        {:else}
                                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 9v6h4l5 4V5L9 9H5zM17.95 6.05a8 8 0 010 11.9M15.536 8.464a5 5 0 010 7.072" />
                                                </svg>
                                        {/if}
                                </button>

                                <PrimoCounter amount={game.primogem} onTopUp={(amt) => game.addPrimogem(amt)} />

                                <!-- Mobile menu button -->
                                <button
                                        class="btn-press md:hidden p-2 rounded-md text-[#B8C1D3] hover:text-[#F2E6D0] hover:bg-[#24314A]/50 transition-colors"
                                        onclick={() => mobileOpen = !mobileOpen}
                                        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                                        aria-expanded={mobileOpen}
                                        aria-controls="mobile-nav"
                                >
                                        {#if mobileOpen}
                                                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                        {:else}
                                                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                                </svg>
                                        {/if}
                                </button>
                        </div>
                </div>

                <!-- Mobile Nav -->
                {#if mobileOpen}
                        <nav
                                id="mobile-nav"
                                class="md:hidden pb-3 flex flex-col gap-1"
                                use:clickOutside={() => mobileOpen = false}
                                transition:fly={{ y: -12, duration: 200, easing: cubicOut }}
                        >
                                {#each navItems as item}
                                        <a
                                                href={item.href}
                                                onclick={() => mobileOpen = false}
                                                class="btn-press px-3 py-2 rounded-md text-sm font-medium transition-all
                                                        {isActive(item.href)
                                                                ? 'text-[#E6C77A] bg-[#C9A45A]/10 border border-[#C9A45A]/30'
                                                                : 'text-[#B8C1D3] hover:text-[#F2E6D0] hover:bg-[#24314A]/50 border border-transparent'}"
                                        >
                                                <span class="mr-2 opacity-70">{item.icon}</span>
                                                {t(item.key)}
                                        </a>
                                {/each}

                                <button
                                        onclick={() => mobileRngOpen = !mobileRngOpen}
                                        class="btn-press px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-between
                                                {isRngActive
                                                        ? 'text-[#E6C77A] bg-[#C9A45A]/10 border border-[#C9A45A]/30'
                                                        : 'text-[#B8C1D3] hover:text-[#F2E6D0] hover:bg-[#24314A]/50 border border-transparent'}"
                                        aria-expanded={mobileRngOpen}
                                >
                                        <span class="flex items-center">
                                                <span class="mr-2 opacity-70">◈</span>
                                                {t('nav.rng-sims')}
                                        </span>
                                        <svg class="w-3.5 h-3.5 transition-transform {mobileRngOpen ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                </button>

                                {#if mobileRngOpen}
                                        <div class="ml-3 pl-3 border-l border-[#24314A] flex flex-col gap-0.5">
                                                <a
                                                        href="/rng"
                                                        onclick={() => { mobileOpen = false; mobileRngOpen = false; }}
                                                        class="px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider text-[#E6C77A] hover:bg-[#24314A] transition-colors"
                                                >
                                                        ◈ {t('nav.rng-overview')}
                                                </a>
                                                {#each RNG_CATEGORY_KEYS as catKey, i}
                                                        <div class="px-3 pt-2 pb-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#8E97AA]">{t(catKey)}</div>
                                                        {#each rngSubItems as item}
                                                                {#if item.category === RNG_CATEGORY_RAW[i]}
                                                                        <a
                                                                                href={item.href}
                                                                                onclick={() => { mobileOpen = false; mobileRngOpen = false; }}
                                                                                class="px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-2 {isActive(item.href) ? 'bg-[#C9A45A]/15 text-[#E6C77A]' : 'text-[#B8C1D3] hover:bg-[#24314A] hover:text-[#F2E6D0]'}"
                                                                        >
                                                                                <span class="opacity-70 w-4 text-center">{item.icon}</span>
                                                                                <span class="truncate">{item.key}</span>
                                                                        </a>
                                                                {/if}
                                                        {/each}
                                                {/each}
                                        </div>
                                {/if}
                        </nav>
                {/if}
        </div>
</header>

<!-- ═══ Thin progress bar on every navigation ═══ -->
{#if navigating && navigating.to?.url.pathname !== navigating.from?.url.pathname}
        <div class="fixed top-14 left-0 right-0 z-[55] h-0.5 pointer-events-none overflow-hidden">
                <div class="h-full bg-gradient-to-r from-transparent via-[#E6C77A] to-transparent origin-left animate-nav-progress gpu-layer"></div>
        </div>
{/if}

<!-- ═══ Full Genshin-style loading screen — only when navigation is slow (>280ms) ═══ -->
{#if showFullLoader}
        <div
                class="fixed inset-0 z-[60]"
                in:fade={{ duration: 150 }}
                out:fade={{ duration: 200 }}
        >
                <AreaLoader region={loaderRegion} />
        </div>
{/if}

<!-- ═══ Page Content ═══ -->
{#key page.url.pathname}
        <main
                in:fly={{ y: 12, duration: 280, easing: cubicOut }}
                out:fade={{ duration: 120 }}
        >
                {@render children()}
        </main>
{/key}

<!-- ═══ Global Toaster (mounted once, any page can push toasts) ═══ -->
<Toaster />

<!-- ═══ Footer ═══ -->
<footer class="border-t border-[#C9A45A]/15 mt-16 py-8 px-4">
        <div class="max-w-7xl mx-auto text-center space-y-2 text-xs text-[#8E97AA]">
                <p>
                        {t('footer.banner-source')}
                        <a href="https://api.ennead.cc" target="_blank" rel="noopener" class="text-[#C9A45A] hover:text-[#E6C77A]">api.ennead.cc</a>
                        • {t('footer.char-source')}
                        <a href="https://genshin.jmp.blue" target="_blank" rel="noopener" class="text-[#C9A45A] hover:text-[#E6C77A]">genshin.jmp.blue</a>
                </p>
                <p>{t('footer.copyright')}</p>
                <p class="text-[#5E6478]">{t('footer.storage')}</p>
        </div>
</footer>

<style>
        @keyframes nav-progress {
                0%   { transform: scaleX(0); opacity: 0.9; }
                50%  { transform: scaleX(0.7); opacity: 1; }
                100% { transform: scaleX(1); opacity: 0; }
        }
        .animate-nav-progress {
                animation: nav-progress 1.2s ease-out forwards;
        }
</style>
