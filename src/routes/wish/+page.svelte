<script lang="ts">
        import { onMount } from 'svelte';
        import { getBannerStore } from '$lib/stores/bannerStore.svelte';
        import { getGameState, type WishResult, type WishMode } from '$lib/stores/gameState.svelte';
        import { toast } from '$lib/stores/toast.svelte';
        import BannerCard from '$lib/components/BannerCard.svelte';
        import SkeletonCard from '$lib/components/SkeletonCard.svelte';
        import SkeletonImage from '$lib/components/SkeletonImage.svelte';
        import PityBar from '$lib/components/PityBar.svelte';
        import ModePityBadge from '$lib/components/ModePityBadge.svelte';
        import WhatIfSimulator from '$lib/components/WhatIfSimulator.svelte';
        import StreakTracker from '$lib/components/StreakTracker.svelte';
        import WishAnimation from '$lib/components/WishAnimation.svelte';
        import { characterIconBigUrl, slugifyName } from '$lib/services/characterApi';
        import { STANDARD_WISH_POOLS } from '$lib/utils/standardWishEngine';
        import { fade, fly } from 'svelte/transition';
        import { cubicOut } from 'svelte/easing';
        import { t, localeKey } from '$lib/i18n/index.svelte';
        import { primeAudio, playWishClick, playError } from '$lib/audio/synth.svelte';

        // Re-render on locale change
        void localeKey();

        let { data } = $props();

        const banners = getBannerStore();
        const game = getGameState();

        // Seed from build-time (SSG) banner data before first render so the
        // hydrated DOM matches the prerendered HTML (names/versions included).
        if (data?.banners?.length && banners.banners.length === 0) {
                banners.hydrateBanners(data.banners);
        }

        let pendingResults: WishResult[] = $state([]);
        let showAnimation = $state(false);
        let pullError = $state('');

        onMount(() => {
                // Background refresh — swap stale or offline build-time data for
                // fresh API data, but skip the extra request when data is current.
                if (banners.banners.length === 0 && !banners.isLoading) {
                        banners.fetchBanners();
                } else if (
                        banners.banners.some((b) => b.id === 0) ||
                        banners.banners.every((b) => b.end_time * 1000 < Date.now())
                ) {
                        banners.fetchBanners();
                }
        });

        // Surface banner API failures as a toast so the user knows the live
        // API is down (a fallback banner is used silently otherwise — the user
        // would see a generic banner with no indication anything went wrong).
        // Dismissible; only fires once per failure (tracked via a ref so the
        // effect doesn't re-fire on unrelated reactive changes).
        let lastApiError = '';
        $effect(() => {
                const err = banners.apiError;
                if (err && err !== lastApiError) {
                        lastApiError = err;
                        toast.warning(
                                'Banner API Offline',
                                `${err}. Using fallback banner — kamu masih bisa wish.`
                        );
                } else if (!err) {
                        lastApiError = '';
                }
        });

        // Reset splash error when switching modes

        function handleSinglePull() {
                primeAudio();
                playWishClick();
                pullError = '';
                const result = game.doSinglePull();
                if (!result.ok) {
                        pullError = mapError(result.reason);
                        playError();
                        return;
                }
                pendingResults = [result.wish];
                // Skip animation entirely if user has turned it off — results
                // are already pushed to history by doSinglePull, so we just
                // don't open the modal.
                if (game.skipAnimation) return;
                showAnimation = true;
        }

        function handleTenPull() {
                primeAudio();
                playWishClick();
                pullError = '';
                const result = game.doTenPull();
                if (!result.ok) {
                        pullError = mapError(result.reason);
                        playError();
                        return;
                }
                pendingResults = result.wishes;
                if (game.skipAnimation) return;
                showAnimation = true;
        }

        function toggleSkipAnimation() {
                game.setSkipAnimation(!game.skipAnimation);
                toast.info(
                        'Skip Animation',
                        game.skipAnimation ? 'ON — pull tanpa modal flip' : 'OFF — tampilkan animasi flip'
                );
        }

        // ── Keyboard shortcuts ──────────────────────────────────────────────────
        // 1 = single pull, 0 = 10-pull, S = toggle skip animation, ? = show hints.
        // Disabled when an input/textarea/select is focused (so typing in the
        // primogem field on pity-setup doesn't trigger pulls) or when the wish
        // animation modal is open.
        let showShortcutHint = $state(false);

        function isTypingTarget(el: EventTarget | null): boolean {
                if (!(el instanceof HTMLElement)) return false;
                const tag = el.tagName.toLowerCase();
                return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
        }

        function handleKeydown(e: KeyboardEvent) {
                // Show hint overlay on '?' (Shift+/)
                if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
                        showShortcutHint = !showShortcutHint;
                        return;
                }
                // Don't intercept when typing in a field
                if (isTypingTarget(e.target)) return;
                // Don't intercept when a modal is open (animation modal)
                if (showAnimation) return;

                if (e.key === '1' && canSingle) {
                        e.preventDefault();
                        handleSinglePull();
                } else if (e.key === '0' && canTen) {
                        e.preventDefault();
                        handleTenPull();
                } else if (e.key === 's' || e.key === 'S') {
                        e.preventDefault();
                        toggleSkipAnimation();
                } else if (e.key === 'Escape' && showShortcutHint) {
                        showShortcutHint = false;
                }
        }

        // Hint overlay auto-dismiss after 5s
        $effect(() => {
                if (showShortcutHint) {
                        const timer = setTimeout(() => { showShortcutHint = false; }, 5000);
                        return () => clearTimeout(timer);
                }
        });

        function mapError(reason: 'no_banner' | 'insufficient_primo' | 'novice_maxed'): string {
                if (reason === 'no_banner') return t('wish.error.no-banner');
                if (reason === 'novice_maxed') return t('wish.error.novice-maxed');
                const tenCost = game.wishMode === 'novice' ? game.NOVICE_COST_TEN : game.COST_TEN;
                return t('wish.error.insufficient-primo', { cost: tenCost.toLocaleString('en-US') });
        }

        function closeAnimation() {
                showAnimation = false;
                pendingResults = [];
        }

        function switchMode(mode: WishMode) {
                game.setWishMode(mode);
                pullError = '';
        }

        // Pull button disabled state — depends on mode
        let canSingle = $derived(
                game.primogem >= game.COST_SINGLE &&
                (game.wishMode !== 'character' || banners.currentBanner !== null) &&
                // Novice Wish in the real game only allows 10-pulls (Beginner's
                // Wish has no single-pull option). We mirror that here so that:
                //   1. Users can't do 20 singles and finish the banner without
                //      ever receiving the guaranteed Noelle (which only fires
                //      on the first 10-pull).
                //   2. The 20-pull cap stays clean (10-pulls only → exactly 2
                //      10-pulls to finish, no remainder).
                game.wishMode !== 'novice'
        );
        let canTen = $derived(
                game.primogem >= (game.wishMode === 'novice' ? game.NOVICE_COST_TEN : game.COST_TEN) &&
                (game.wishMode !== 'character' || banners.currentBanner !== null) &&
                // Novice: a 10-pull must not push novicePullsUsed past the 20 cap.
                // Singles are allowed up to 19 (the 20th single completes the banner),
                // but 10-pull requires novicePullsUsed + 10 <= 20, i.e. <= 10 used.
                (game.wishMode !== 'novice' || game.novicePullsUsed + 10 <= game.NOVICE_MAX_PULLS)
        );

        let tenPullCost = $derived(game.wishMode === 'novice' ? game.NOVICE_COST_TEN : game.COST_TEN);
        let noviceRemaining = $derived(game.NOVICE_MAX_PULLS - game.novicePullsUsed);

        // Standard wish pool preview
        let standardCharCount = $derived(STANDARD_WISH_POOLS.fiveStarChars.length);
        let standardWeaponCount = $derived(STANDARD_WISH_POOLS.fiveStarWeapons.length);
</script>

<svelte:head>
        <title>{t('wish.title')}</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 space-y-6">

        <!-- ═══ Banner Type Selector ═══ -->
        <section class="flex gap-1 p-1 rounded-lg bg-[#1A2337]/60 border border-[#24314A]">
                <button
                        onclick={() => switchMode('character')}
                        class="flex-1 min-w-[100px] px-3 py-2.5 rounded-md text-xs font-heading font-semibold uppercase tracking-wider transition-all {game.wishMode === 'character' ? 'bg-gradient-to-r from-[#C9A45A] to-[#E6C77A] text-[#0B1020] shadow-md' : 'text-[#B8C1D3] hover:text-[#F2E6D0] hover:bg-[#24314A]/60'}"
                >
                        ✦ {t('wish.mode.character')}
                </button>
                <button
                        onclick={() => switchMode('standard')}
                        class="flex-1 min-w-[100px] px-3 py-2.5 rounded-md text-xs font-heading font-semibold uppercase tracking-wider transition-all {game.wishMode === 'standard' ? 'bg-gradient-to-r from-[#C9A45A] to-[#E6C77A] text-[#0B1020] shadow-md' : 'text-[#B8C1D3] hover:text-[#F2E6D0] hover:bg-[#24314A]/60'}"
                >
                        ◈ {t('wish.mode.standard')}
                </button>
                <button
                        onclick={() => switchMode('novice')}
                        class="flex-1 min-w-[100px] px-3 py-2.5 rounded-md text-xs font-heading font-semibold uppercase tracking-wider transition-all {game.wishMode === 'novice' ? 'bg-gradient-to-r from-[#C9A45A] to-[#E6C77A] text-[#0B1020] shadow-md' : 'text-[#B8C1D3] hover:text-[#F2E6D0] hover:bg-[#24314A]/60'}"
                >
                        ✚ {t('wish.mode.novice')}
                </button>
        </section>

        <!-- ═══ Banner Stage ═══ -->
        <section class="relative overflow-hidden rounded-2xl border border-[#C9A45A]/25 bg-gradient-to-b from-[#1A2337] via-[#141C2F] to-[#0B1020] min-h-[420px] md:min-h-[480px]">
                <!-- Decorative gradient -->
                <div class="absolute inset-0 pointer-events-none">
                        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-64 opacity-40"
                                style="background: radial-gradient(ellipse at center top, rgba(230,199,122,0.35), transparent 60%);"></div>
                </div>

                <div class="relative grid grid-cols-1 md:grid-cols-2 gap-6 p-5 md:p-8 h-full">

                        <!-- Featured splash -->
                        <div class="relative h-64 md:h-80 lg:h-96 flex items-end justify-center">
                                {#if game.wishMode === 'character'}
                                        <!-- Character Event: featured character splash -->
                                        {#if banners.featured5Star}
                                                {#key banners.featured5Star.name}
                                                        <div class="absolute inset-0 flex items-end justify-center" in:fly={{ y: 20, duration: 500, easing: cubicOut }}>
                                                                <div class="absolute inset-0 opacity-50"
                                                                        style="background: radial-gradient(ellipse at center 80%, rgba(230,199,122,0.5), transparent 65%);"></div>
                                                                <SkeletonImage
                                                                        src={characterIconBigUrl(slugifyName(banners.featured5Star.name))}
                                                                        fallbacks={[banners.featured5Star.icon ?? '']}
                                                                        alt={banners.featured5Star.name}
                                                                        loading="eager"
                                                                        class="absolute inset-0"
                                                                        imgClass="object-contain object-bottom drop-shadow-2xl"
                                                                        glyph={banners.featured5Star.name.charAt(0)}
                                                                        label={banners.featured5Star.element}
                                                                />
                                                        </div>
                                                {/key}
                                        {:else}
                                                <div class="absolute inset-0 flex items-end justify-center">
                                                        <SkeletonCard variant="splash" />
                                                </div>
                                        {/if}
                                {:else if game.wishMode === 'standard'}
                                        <!-- Standard Wish: show a generic permanent banner splash -->
                                        <div class="absolute inset-0 flex flex-col items-center justify-center" in:fly={{ y: 20, duration: 500, easing: cubicOut }}>
                                                <div class="absolute inset-0 opacity-40"
                                                        style="background: radial-gradient(ellipse at center, rgba(180,193,211,0.3), transparent 60%);"></div>
                                                <div class="relative text-center space-y-3">
                                                        <div class="text-7xl text-[#E6C77A] drop-shadow-2xl">✦</div>
                                                        <div class="font-heading text-2xl font-bold text-[#F2E6D0]">{t('wish.standard.banner-name')}</div>
                                                        <div class="text-xs text-[#8E97AA] uppercase tracking-wider">{t('wish.standard.banner-kind')}</div>
                                                        <div class="text-[11px] text-[#B8C1D3] max-w-xs mx-auto leading-relaxed pt-2">
                                                                {t('wish.standard.pool-desc', { chars: standardCharCount, weapons: standardWeaponCount })}
                                                        </div>
                                                </div>
                                        </div>
                                {:else if game.wishMode === 'novice'}
                                        <!-- Novice Wish: show Noelle splash -->
                                        <div class="absolute inset-0 flex items-end justify-center" in:fly={{ y: 20, duration: 500, easing: cubicOut }}>
                                                <div class="absolute inset-0 opacity-50"
                                                        style="background: radial-gradient(ellipse at center 80%, rgba(230,199,122,0.5), transparent 65%);"></div>
                                                <SkeletonImage
                                                        src={characterIconBigUrl('noelle')}
                                                        alt="Noelle"
                                                        loading="eager"
                                                        class="absolute inset-0"
                                                        imgClass="object-contain object-bottom drop-shadow-2xl"
                                                        glyph="N"
                                                        label="Noelle"
                                                />
                                        </div>
                                {/if}
                        </div>

                        <!-- Pull panel -->
                        <div class="relative flex flex-col justify-between space-y-4">
                                <div class="space-y-3">
                                        <div class="flex items-center gap-2 flex-wrap">
                                                {#if game.wishMode === 'character'}
                                                        <span class="text-[10px] px-2 py-0.5 rounded border border-[#C9A45A]/30 bg-[#C9A45A]/10 text-[#E6C77A] uppercase tracking-wider">
                                                                {banners.featured5Star?.element ?? '—'}
                                                        </span>
                                                        <span class="text-[10px] text-[#8E97AA] font-mono">v{banners.currentBanner?.version ?? '—'}</span>
                                                        {#if banners.countdownText}
                                                                <span class="text-[10px] text-[#E8745A] font-mono ml-auto">⏳ {banners.countdownText}</span>
                                                        {/if}
                                                {:else if game.wishMode === 'standard'}
                                                        <span class="text-[10px] px-2 py-0.5 rounded border border-[#B8C1D3]/30 bg-[#B8C1D3]/10 text-[#B8C1D3] uppercase tracking-wider">Permanent</span>
                                                        <span class="text-[10px] text-[#8E97AA] font-mono">No rate-up</span>
                                                {:else if game.wishMode === 'novice'}
                                                        <span class="text-[10px] px-2 py-0.5 rounded border border-[#C9A45A]/30 bg-[#C9A45A]/10 text-[#E6C77A] uppercase tracking-wider">Beginner</span>
                                                        <span class="text-[10px] text-[#8E97AA] font-mono">{game.novicePullsUsed}/{game.NOVICE_MAX_PULLS} pulls used</span>
                                                {/if}
                                        </div>

                                        {#if game.wishMode === 'character'}
                                                <h2 class="font-heading text-3xl md:text-4xl font-bold text-[#F2E6D0] leading-tight">
                                                        {banners.featured5Star?.name ?? 'No Banner'}
                                                </h2>
                                                <div class="text-[#C9A45A] tracking-widest text-sm">★ ★ ★ ★ ★</div>
                                                {#if banners.featured4Stars.length > 0}
                                                        <div class="flex flex-wrap gap-1.5 pt-1">
                                                                {#each banners.featured4Stars as c4}
                                                                        <span class="text-[10px] px-2 py-0.5 rounded bg-[#8D72C9]/15 text-[#B495F0] border border-[#8D72C9]/30">{c4.name}</span>
                                                                {/each}
                                                        </div>
                                                {/if}
                                                <!-- Banner selector — when multiple Character Event banners are
                                                     active (e.g. two phase-2 banners running concurrently), let the
                                                     user switch without scrolling down to the BannerCard grid. -->
                                                {#if banners.banners.length > 1}
                                                        <div class="pt-2">
                                                                <label for="banner-select" class="text-[10px] text-[#8E97AA] uppercase tracking-wider mr-2">Banner:</label>
                                                                <select
                                                                        id="banner-select"
                                                                        value={banners.selectedBannerId}
                                                                        onchange={(e) => banners.selectBanner((e.currentTarget as HTMLSelectElement).value)}
                                                                        class="bg-[#0B1020] border border-[#C9A45A]/30 text-[#F2E6D0] text-xs rounded-md px-2 py-1.5 focus:ring-1 focus:ring-[#E6C77A] focus:border-[#E6C77A] outline-none cursor-pointer hover:border-[#C9A45A]/60 transition-colors max-w-[260px]"
                                                                >
                                                                        {#each banners.banners as b}
                                                                                <option value={String(b.id)}>
                                                                                        {b.characters.find(c => c.rarity === 5)?.name ?? `Banner #${b.id}`} · v{b.version}
                                                                                </option>
                                                                        {/each}
                                                                </select>
                                                        </div>
                                                {/if}
                                        {:else if game.wishMode === 'standard'}
                                                <h2 class="font-heading text-3xl md:text-4xl font-bold text-[#F2E6D0] leading-tight">
                                                        Wanderlust Invocation
                                                </h2>
                                                <div class="text-[#B8C1D3] text-xs leading-relaxed">
                                                        Banner permanen. 5★ split 50/50 antara character & weapon. Tidak ada rate-up, tidak ada 50/50.
                                                </div>
                                        {:else if game.wishMode === 'novice'}
                                                <h2 class="font-heading text-3xl md:text-4xl font-bold text-[#F2E6D0] leading-tight">
                                                        Beginners' Wish
                                                </h2>
                                                <div class="text-[#C9A45A] tracking-widest text-sm">★ ★ ★ ★ ★</div>
                                                <div class="text-xs text-[#B8C1D3] leading-relaxed">
                                                        First 10-pull: <span class="text-[#E6C77A] font-semibold">guaranteed Noelle</span>. 10-pull diskon 20% (1,280 primo). Max 20 pull.
                                                </div>
                                                {#if game.noviceFirstTenUsed}
                                                        <div class="text-[10px] text-[#8E97AA]">✓ First 10-pull (Noelle) sudah digunakan</div>
                                                {:else}
                                                        <div class="text-[10px] text-[#E6C77A]">★ First 10-pull Noelle guarantee tersedia</div>
                                                {/if}
                                        {/if}

                                        <!-- Pity lock indicator -->
                                        {#if game.pityLock5 !== null || game.pityLock4 !== null}
                                                <div class="text-[10px] text-[#E0B25A] bg-[#E0B25A]/10 border border-[#E0B25A]/30 rounded-md px-2 py-1.5">
                                                        🔒 Pity Lock aktif: 
                                                        {#if game.pityLock5 !== null}5★ → {game.pityLock5}{/if}
                                                        {#if game.pityLock5 !== null && game.pityLock4 !== null} · {/if}
                                                        {#if game.pityLock4 !== null}4★ → {game.pityLock4}{/if}
                                                </div>
                                        {/if}
                                </div>

                                <!-- Pull buttons -->
                                <div class="space-y-2">
                                        {#if pullError}
                                                <div class="text-xs text-[#E8745A] bg-[#8B3A3A]/15 border border-[#8B3A3A]/40 rounded-md px-3 py-2" in:fade>
                                                        {pullError}
                                                </div>
                                        {/if}

                                        {#if game.wishMode === 'novice' && noviceRemaining <= 0}
                                                <div class="text-xs text-[#E0B25A] bg-[#E0B25A]/10 border border-[#E0B25A]/30 rounded-md px-3 py-2 text-center">
                                                        Novice Wish sudah selesai (20/20 pull). Pilih banner lain.
                                                </div>
                                        {:else}
                                                <div class="grid grid-cols-2 gap-3">
                                                        <button
                                                                onclick={handleSinglePull}
                                                                disabled={!canSingle}
                                                                class="btn-glow relative group bg-gradient-to-br from-[#24314A] to-[#1A2337] hover:from-[#2A3856] hover:to-[#24314A] text-[#E6C77A] font-heading font-semibold py-4 px-4 rounded-lg border border-[#C9A45A]/30 text-sm flex flex-col items-center justify-center gap-0.5 overflow-hidden"
                                                        >
                                                                <span class="text-base tracking-wider uppercase">✦ 1× Wish</span>
                                                                <span class="text-[10px] text-[#8E97AA] font-mono">{game.COST_SINGLE} Primo</span>
                                                        </button>
                                                        <button
                                                                onclick={handleTenPull}
                                                                disabled={!canTen}
                                                                class="btn-glow relative group bg-gradient-to-br from-[#C9A45A] to-[#8D72C9] hover:from-[#E6C77A] hover:to-[#B495F0] text-[#0B1020] font-heading font-bold py-4 px-4 rounded-lg border border-[#E6C77A]/50 text-sm flex flex-col items-center justify-center gap-0.5 overflow-hidden"
                                                        >
                                                                <span class="text-base tracking-wider uppercase">✦✦ 10× Wish</span>
                                                                <span class="text-[10px] text-[#0B1020]/70 font-mono font-semibold">{tenPullCost.toLocaleString('en-US')} Primo</span>
                                                                {#if game.wishMode === 'novice'}
                                                                        <span class="text-[9px] text-[#0B1020]/60 font-mono">20% OFF</span>
                                                                {/if}
                                                        </button>
                                                </div>
                                        {/if}

                                        <!-- Quick info -->
                                        <div class="grid grid-cols-3 gap-2 text-center text-[10px] pt-2">
                                                <div class="bg-[#0B1020]/60 p-2 rounded-md border border-[#24314A]">
                                                        <div class="text-[#8E97AA] uppercase tracking-wider">Base 5★</div>
                                                        <div class="font-mono text-[#E6C77A] font-bold">0.6%</div>
                                                </div>
                                                <div class="bg-[#0B1020]/60 p-2 rounded-md border border-[#24314A]">
                                                        <div class="text-[#8E97AA] uppercase tracking-wider">Soft Pity</div>
                                                        <div class="font-mono text-[#E8745A] font-bold">74+</div>
                                                </div>
                                                <div class="bg-[#0B1020]/60 p-2 rounded-md border border-[#24314A]">
                                                        <div class="text-[#8E97AA] uppercase tracking-wider">Hard Pity</div>
                                                        <div class="font-mono text-[#E8745A] font-bold">90</div>
                                                </div>
                                        </div>

                                        <!-- Skip Animation toggle -->
                                        <button
                                                type="button"
                                                onclick={toggleSkipAnimation}
                                                class="w-full flex items-center justify-between p-2.5 rounded-md border border-[#24314A] bg-[#0B1020]/40 hover:bg-[#0B1020]/70 hover:border-[#C9A45A]/30 transition-all text-left"
                                                aria-pressed={game.skipAnimation}
                                                aria-label="Toggle skip wish animation"
                                        >
                                                <div class="flex items-center gap-2">
                                                        <svg class="w-4 h-4 {game.skipAnimation ? 'text-[#E6C77A]' : 'text-[#8E97AA]'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                                {#if game.skipAnimation}
                                                                        <path stroke-linecap="round" stroke-linejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                                                {:else}
                                                                        <path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                                        <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                {/if}
                                                        </svg>
                                                        <div>
                                                                <div class="text-[11px] font-bold {game.skipAnimation ? 'text-[#E6C77A]' : 'text-[#B8C1D3]'} uppercase tracking-wider">Skip Animation</div>
                                                                <div class="text-[9px] text-[#8E97AA] leading-tight">
                                                                        {#if game.skipAnimation}
                                                                                ON — pull langsung masuk history, tanpa modal flip
                                                                        {:else}
                                                                                OFF — tampilkan animasi flip card setelah pull
                                                                        {/if}
                                                                </div>
                                                        </div>
                                                </div>
                                                <div class="relative w-10 h-5 rounded-full transition-colors shrink-0 {game.skipAnimation ? 'bg-[#C9A45A]' : 'bg-[#24314A]'}">
                                                        <span class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-[#F2E6D0] transition-transform {game.skipAnimation ? 'translate-x-5' : ''}"></span>
                                                </div>
                                        </button>
                                </div>
                        </div>
                </div>
        </section>

        <!-- ═══ Banner Carousel (only for Character Event mode) ═══ -->
        {#if game.wishMode === 'character'}
                <section class="space-y-3">
                        <div class="flex justify-between items-center">
                                <h3 class="font-heading text-sm font-semibold text-[#F2E6D0] uppercase tracking-wider">Pilih Banner</h3>
                                <button
                                        onclick={() => banners.fetchBanners()}
                                        class="text-[10px] text-[#8E97AA] hover:text-[#E6C77A] transition-colors flex items-center gap-1"
                                        disabled={banners.isLoading}
                                >
                                        <svg class="w-3 h-3 {banners.isLoading ? 'animate-spin' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Sync
                                </button>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {#each banners.banners as banner (banner.id)}
                                        <BannerCard
                                                {banner}
                                                selected={banners.selectedBannerId === String(banner.id)}
                                                onclick={() => banners.selectBanner(String(banner.id))}
                                        />
                                {/each}
                        </div>
                </section>
        {:else if game.wishMode === 'standard'}
                <!-- Standard Wish pool preview -->
                <section class="space-y-3">
                        <h3 class="font-heading text-sm font-semibold text-[#F2E6D0] uppercase tracking-wider">Standard Pool Preview</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div class="bg-[#1A2337]/80 border border-[#C9A45A]/20 rounded-lg p-4">
                                        <div class="text-[10px] text-[#E6C77A] uppercase tracking-wider mb-2">5★ Characters ({standardCharCount})</div>
                                        <div class="flex flex-wrap gap-1.5">
                                                {#each STANDARD_WISH_POOLS.fiveStarChars as char}
                                                        <span class="text-[10px] px-2 py-0.5 rounded bg-[#C9A45A]/10 text-[#E6C77A] border border-[#C9A45A]/30">{char.name}</span>
                                                {/each}
                                        </div>
                                </div>
                                <div class="bg-[#1A2337]/80 border border-[#C9A45A]/20 rounded-lg p-4">
                                        <div class="text-[10px] text-[#E6C77A] uppercase tracking-wider mb-2">5★ Weapons ({standardWeaponCount})</div>
                                        <div class="flex flex-wrap gap-1.5">
                                                {#each STANDARD_WISH_POOLS.fiveStarWeapons as wpn}
                                                        <span class="text-[10px] px-2 py-0.5 rounded bg-[#C9A45A]/10 text-[#E6C77A] border border-[#C9A45A]/30">{wpn.name}</span>
                                                {/each}
                                        </div>
                                </div>
                        </div>
                </section>
        {:else if game.wishMode === 'novice'}
                <!-- Novice Wish info -->
                <section class="space-y-3">
                        <h3 class="font-heading text-sm font-semibold text-[#F2E6D0] uppercase tracking-wider">Novice Wish Info</h3>
                        <div class="bg-[#1A2337]/80 border border-[#C9A45A]/20 rounded-lg p-4 space-y-2 text-xs text-[#B8C1D3] leading-relaxed">
                                <div>• <span class="text-[#E6C77A] font-semibold">First 10-pull:</span> Guaranteed Noelle (4★ Geo) di slot pertama</div>
                                <div>• <span class="text-[#E6C77A] font-semibold">10-pull discount:</span> Hanya 1,280 Primo (8 Acquaint Fate × 160) — hemat 320 Primo</div>
                                <div>• <span class="text-[#E6C77A] font-semibold">Max 20 pull:</span> Setelah 20 pull, banner menghilang (sama seperti game asli)</div>
                                <div>• <span class="text-[#E6C77A] font-semibold">Pool:</span> Sama seperti Standard Wish (Wanderlust Invocation)</div>
                                <div>• <span class="text-[#B8C1D3]">Pity:</span> Hard pity 90, soft pity 74, 4★ dijamin setiap 10 pull</div>
                        </div>
                </section>
        {/if}

        <!-- ═══ Pity + Recent ═══ -->
        <section class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div class="lg:col-span-1 space-y-4">
                        <!-- Active mode detailed pity (existing PityBar) -->
                        <PityBar
                                pity5={game.pity5}
                                pity4={game.pity4}
                                guaranteed5={game.guaranteed5}
                                guaranteed4={game.guaranteed4}
                        />
                        <!-- What-if calculator: pulls/primo to reach milestones -->
                        <WhatIfSimulator />
                        <!-- No-5★ streak tracker for active banner -->
                        <StreakTracker />
                        <!-- Compact per-mode pity overview (all 3 banners at a glance) -->
                        <ModePityBadge />
                </div>

                <div class="lg:col-span-2 bg-[#1A2337]/80 backdrop-blur-sm rounded-xl border border-[#C9A45A]/20 shadow-xl p-4 space-y-3">
                        <div class="flex items-center justify-between">
                                <h3 class="font-heading text-sm font-semibold text-[#F2E6D0] uppercase tracking-wider">Pull Terakhir</h3>
                                <a href="/history" class="text-[10px] text-[#C9A45A] hover:text-[#E6C77A] uppercase tracking-wider">Lihat semua →</a>
                        </div>
                        {#if game.wishHistory.length === 0}
                                <div class="flex flex-col items-center justify-center py-12 px-4 text-center space-y-3">
                                        <div class="relative">
                                                <div class="text-5xl text-[#C9A45A]/30 select-none">✦</div>
                                                <div class="absolute inset-0 text-5xl text-[#E6C77A]/20 select-none animate-pulse">✦</div>
                                        </div>
                                        <div class="space-y-1">
                                                <div class="text-sm font-heading font-semibold text-[#B8C1D3]">Belum ada wish</div>
                                                <div class="text-[11px] text-[#8E97AA] max-w-xs">
                                                        Tekan tombol <span class="text-[#E6C77A] font-semibold">1× Wish</span> atau <span class="text-[#E6C77A] font-semibold">10× Wish</span> di atas untuk memulai!
                                                </div>
                                        </div>
                                </div>
                        {:else}
                                <div class="grid grid-cols-5 md:grid-cols-10 gap-2">
                                        {#each game.wishHistory.slice(-10).reverse() as item (item.id)}
                                                <div class="aspect-[3/4] rounded-md overflow-hidden border {item.rarity === 5 ? 'border-[#E6C77A] gold-glow' : item.rarity === 4 ? 'border-[#B495F0] purple-glow' : 'border-[#5E90D6]'} bg-[#0B1020] relative group">
                                                        <img
                                                                src={item.fallbackIcon ?? item.icon}
                                                                alt={item.name}
                                                                loading="eager"
                                                                decoding="async"
                                                                class="w-full h-full object-cover"
                                                                onerror={(e: Event) => {
                                                                        const img = e.currentTarget as HTMLImageElement;
                                                                        // Try primary jmp.blue URL if we started with fallback
                                                                        if (img.src !== item.icon && item.icon) {
                                                                                img.src = item.icon;
                                                                        } else {
                                                                                // Final fallback: hide image, show rarity stars only
                                                                                img.style.display = 'none';
                                                                        }
                                                                }}
                                                        />
                                                        <div class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#0B1020] to-transparent p-1 text-center">
                                                                <div class="text-[8px] text-[#E6C77A] font-bold leading-none">{'★'.repeat(item.rarity)}</div>
                                                        </div>
                                                </div>
                                        {/each}
                                </div>
                        {/if}
                </div>
        </section>

</div>

<!-- ═══ Keyboard handler ═══ -->
<svelte:window onkeydown={handleKeydown} />

<!-- ═══ Shortcut hint overlay (press ? to toggle) ═══ -->
{#if showShortcutHint}
        <div
                role="button"
                tabindex="-1"
                class="fixed inset-0 z-[90] flex items-center justify-center bg-[#0B1020]/80 backdrop-blur-sm cursor-pointer"
                onclick={() => showShortcutHint = false}
                onkeydown={(e) => { if (e.key === 'Escape') showShortcutHint = false; }}
                transition:fade={{ duration: 150 }}
        >
                <div class="bg-[#1A2337] border border-[#C9A45A]/30 rounded-xl shadow-2xl p-6 max-w-sm w-[calc(100vw-2rem)] space-y-4">
                        <div class="flex items-center justify-between">
                                <h3 class="font-heading text-lg font-bold text-[#E6C77A] uppercase tracking-wider">Keyboard Shortcuts</h3>
                                <button
                                        onclick={() => showShortcutHint = false}
                                        class="text-[#8E97AA] hover:text-[#F2E6D0] text-xl"
                                        aria-label="Close"
                                >✕</button>
                        </div>
                        <div class="space-y-2">
                                <div class="flex items-center justify-between p-2 rounded-md bg-[#0B1020]/40">
                                        <span class="text-sm text-[#B8C1D3]">Single pull (1×)</span>
                                        <kbd class="px-2.5 py-1 rounded border border-[#C9A45A]/40 bg-[#24314A] text-[#E6C77A] font-mono text-xs font-bold">1</kbd>
                                </div>
                                <div class="flex items-center justify-between p-2 rounded-md bg-[#0B1020]/40">
                                        <span class="text-sm text-[#B8C1D3]">10-pull</span>
                                        <kbd class="px-2.5 py-1 rounded border border-[#C9A45A]/40 bg-[#24314A] text-[#E6C77A] font-mono text-xs font-bold">0</kbd>
                                </div>
                                <div class="flex items-center justify-between p-2 rounded-md bg-[#0B1020]/40">
                                        <span class="text-sm text-[#B8C1D3]">Toggle skip animation</span>
                                        <kbd class="px-2.5 py-1 rounded border border-[#C9A45A]/40 bg-[#24314A] text-[#E6C77A] font-mono text-xs font-bold">S</kbd>
                                </div>
                                <div class="flex items-center justify-between p-2 rounded-md bg-[#0B1020]/40">
                                        <span class="text-sm text-[#B8C1D3]">Show/hide this help</span>
                                        <kbd class="px-2.5 py-1 rounded border border-[#C9A45A]/40 bg-[#24314A] text-[#E6C77A] font-mono text-xs font-bold">?</kbd>
                                </div>
                        </div>
                        <div class="text-[10px] text-[#8E97AA] text-center pt-2 border-t border-[#24314A]">
                                Tekan <kbd class="px-1 py-0.5 rounded bg-[#24314A] text-[#E6C77A] font-mono text-[10px]">?</kbd> lagi atau klik di luar untuk tutup. Auto-tutup dalam 5 detik.
                        </div>
                </div>
        </div>
{/if}

<!-- ═══ Wish Animation Modal ═══ -->
{#if showAnimation}
        <WishAnimation results={pendingResults} onClose={closeAnimation} />
{/if}
