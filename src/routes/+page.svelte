<script lang="ts">
        import { onMount } from 'svelte';
        import { getBannerStore } from '$lib/stores/bannerStore.svelte';
        import { getGameState } from '$lib/stores/gameState.svelte';
        import BannerCard from '$lib/components/BannerCard.svelte';
        import SkeletonCard from '$lib/components/SkeletonCard.svelte';
        import SkeletonImage from '$lib/components/SkeletonImage.svelte';
        import { characterIconBigUrl, characterGachaSplashUrl, slugifyName } from '$lib/services/characterApi';
        import { fly, fade } from 'svelte/transition';
        import { cubicOut } from 'svelte/easing';
        import { t, localeKey } from '$lib/i18n/index.svelte';
        import { primeAudio, playTick } from '$lib/audio/synth.svelte';

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

        // OG/share image = current featured banner character's splash art
        // (build-time data, so it renders into the prerendered HTML).
        let ogFeatured = $derived(
                data?.banners
                        ?.find((b) => b.characters.some((c) => c.rarity === 5))
                        ?.characters.find((c) => c.rarity === 5)
        );
        let ogImageUrl = $derived(
                ogFeatured ? characterGachaSplashUrl(slugifyName(ogFeatured.name)) : ''
        );
        let ogImageAlt = $derived(ogFeatured?.name ?? 'Genshin Impact Wish Simulator');

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

        function handleCta() {
                primeAudio();
                playTick();
        }
</script>

<svelte:head>
        <title>{t('home.title')} — Home</title>
        <meta name="description" content={t('home.tagline')} />
        <meta property="og:title" content="{t('home.title')} — Home" />
        <meta property="og:description" content={t('home.tagline')} />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:alt" content={ogImageAlt} />
        <meta name="twitter:image" content={ogImageUrl} />
        <meta name="twitter:title" content="{t('home.title')} — Home" />
</svelte:head>

<div class="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 space-y-10">

        <!-- ═══ Hero ═══ -->
        <section class="relative overflow-hidden rounded-2xl border border-[#C9A45A]/20 bg-gradient-to-br from-[#1A2337] via-[#141C2F] to-[#0B1020]">
                <div class="absolute inset-0 pointer-events-none">
                        <div class="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-40"
                                style="background: radial-gradient(circle, rgba(230,199,122,0.35), transparent 70%);"></div>
                        <div class="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-30"
                                style="background: radial-gradient(circle, rgba(141,114,201,0.35), transparent 70%);"></div>
                </div>

                <div class="relative grid grid-cols-1 md:grid-cols-2 gap-6 p-6 md:p-10 lg:p-12 items-center">
                        <div class="space-y-4">
                                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9A45A]/10 border border-[#C9A45A]/30 text-[#E6C77A] text-xs font-semibold uppercase tracking-wider">
                                        <span class="w-1.5 h-1.5 rounded-full bg-[#E6C77A] animate-pulse"></span>
                                        {#if banners.currentBanner}
                                                v{banners.currentBanner.version} • {t('home.live-banner')}
                                        {:else}
                                                {t('home.loading-banner')}
                                        {/if}
                                </div>

                                <h1 class="font-heading text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-[#F2E6D0]">
                                        {t('home.title').split(' ')[0]}
                                        <span class="block text-shimmer">
                                                {t('home.title').split(' ').slice(1).join(' ')}
                                        </span>
                                </h1>

                                <p class="text-[#B8C1D3] text-sm md:text-base max-w-md leading-relaxed">
                                        {t('home.tagline')}
                                </p>

                                <div class="flex flex-wrap gap-3 pt-2">
                                        <a
                                                href="/wish"
                                                onclick={handleCta}
                                                class="btn-glow inline-flex items-center gap-2 px-6 py-3 rounded-md border border-[#E6C77A]/50 bg-gradient-to-r from-[#C9A45A] to-[#E6C77A] text-[#0B1020] font-heading font-semibold tracking-wider uppercase text-sm"
                                        >
                                                <span>✦</span> {t('home.cta.wish')}
                                        </a>
                                        <a
                                                href="/pity-setup"
                                                onclick={handleCta}
                                                class="btn-press inline-flex items-center gap-2 px-6 py-3 rounded-md border border-[#24314A] bg-[#1A2337]/70 text-[#F2E6D0] hover:text-[#E6C77A] hover:border-[#C9A45A]/40 font-heading font-semibold tracking-wider uppercase text-sm transition-all"
                                        >
                                                ⚙ {t('home.cta.pity-setup')}
                                        </a>
                                </div>

                                <div class="grid grid-cols-3 gap-3 pt-4 border-t border-[#24314A]">
                                        <div>
                                                <div class="text-[10px] text-[#8E97AA] uppercase tracking-wider">{t('home.stats.total-wish')}</div>
                                                <div class="font-mono text-lg font-bold text-[#F2E6D0] tabular-nums">{game.totalWishes.toLocaleString('en-US')}</div>
                                        </div>
                                        <div>
                                                <div class="text-[10px] text-[#8E97AA] uppercase tracking-wider">{t('home.stats.5star')}</div>
                                                <div class="font-mono text-lg font-bold text-[#E6C77A] tabular-nums">
                                                        {game.wishHistory.filter((w) => w.rarity === 5).length}
                                                </div>
                                        </div>
                                        <div>
                                                <div class="text-[10px] text-[#8E97AA] uppercase tracking-wider">{t('home.stats.primogem')}</div>
                                                <div class="font-mono text-lg font-bold text-[#E6C77A] tabular-nums">{game.primogem.toLocaleString('en-US')}</div>
                                        </div>
                                </div>
                        </div>

                        <div class="relative h-72 md:h-96 lg:h-[28rem]">
                                {#if banners.featured5Star}
                                        <div class="absolute inset-0 flex items-end justify-center" in:fly={{ y: 20, duration: 600, easing: cubicOut }}>
                                                <div class="absolute inset-0 opacity-50"
                                                        style="background: radial-gradient(ellipse at center 70%, rgba(230,199,122,0.4), transparent 60%);"></div>

                                                <SkeletonImage
                                                        src={characterGachaSplashUrl(slugifyName(banners.featured5Star.name))}
                                                        fallbacks={[characterIconBigUrl(slugifyName(banners.featured5Star.name)), banners.featured5Star.icon ?? '']}
                                                        alt={banners.featured5Star.name}
                                                        loading="eager"
                                                        class="absolute inset-0"
                                                        imgClass="object-contain object-bottom drop-shadow-2xl"
                                                        glyph={banners.featured5Star.name.charAt(0)}
                                                        label={banners.featured5Star.element}
                                                />

                                                <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0B1020] via-[#0B1020]/70 to-transparent">
                                                        <div class="text-[10px] text-[#E6C77A] uppercase tracking-wider mb-1">{t('wish.featured')}</div>
                                                        <div class="font-heading text-2xl md:text-3xl font-bold text-[#F2E6D0]">
                                                                {banners.featured5Star.name}
                                                        </div>
                                                        <div class="text-xs text-[#B8C1D3] mt-0.5">{banners.featured5Star.element} • {t('wish.rate-up')}</div>
                                                </div>
                                        </div>
                                {:else}
                                        <div class="absolute inset-0 flex items-end justify-center">
                                                <SkeletonCard variant="splash" />
                                        </div>
                                {/if}
                        </div>
                </div>
        </section>

        <!-- ═══ Banner Selection ═══ -->
        <section class="space-y-4">
                <div class="flex justify-between items-center">
                        <div>
                                <h2 class="font-heading text-2xl font-semibold text-[#F2E6D0]">{t('home.section.active-banners')}</h2>
                                <p class="text-xs text-[#8E97AA] mt-1">{t('home.section.active-banners.sub')}</p>
                        </div>
                        <button
                                onclick={() => banners.fetchBanners()}
                                class="btn-press text-xs bg-[#1A2337] hover:bg-[#24314A] text-[#E6C77A] px-3 py-1.5 rounded-md border border-[#C9A45A]/30 transition-all flex items-center gap-1.5"
                                disabled={banners.isLoading}
                        >
                                <svg class="w-3 h-3 {banners.isLoading ? 'animate-spin' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                {t('common.sync')}
                        </button>
                </div>

                {#if banners.apiError && banners.banners.length === 0}
                        <div class="bg-[#8B3A3A]/15 border border-[#8B3A3A]/40 text-[#E8745A] px-4 py-3 rounded-md text-sm flex items-center gap-3" in:fade>
                                <svg class="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>
                                <div>
                                        <p class="font-semibold">{t('home.error.banner-failed')}</p>
                                        <p class="text-xs mt-0.5 opacity-80">{t('home.error.banner-failed.sub')}</p>
                                </div>
                        </div>
                {/if}

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {#if banners.isLoading && banners.banners.length === 0}
                                {#each [0, 1] as _}
                                        <SkeletonCard variant="banner-card" />
                                {/each}
                        {:else}
                                {#each banners.banners as banner (banner.id)}
                                        <BannerCard
                                                {banner}
                                                selected={banners.selectedBannerId === String(banner.id)}
                                                onclick={() => banners.selectBanner(String(banner.id))}
                                        />
                                {/each}
                        {/if}
                </div>
        </section>

        <!-- ═══ Mechanics Info ═══ -->
        <section class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-[#1A2337]/80 border border-[#C9A45A]/20 rounded-xl p-5 space-y-2">
                        <div class="font-heading text-sm font-semibold text-[#E6C77A] uppercase tracking-wider">{t('home.section.mechanics.5star')}</div>
                        <div class="space-y-1 text-xs text-[#B8C1D3] leading-relaxed">
                                <p>• Base rate: <span class="font-mono text-[#E6C77A]">0.6%</span></p>
                                <p>• Soft pity @ <span class="font-mono text-[#E6C77A]">pull 74</span></p>
                                <p>• Hard pity @ <span class="font-mono text-[#E6C77A]">pull 90</span></p>
                                <p>• 50/50 featured — loss → next 5★ guaranteed featured</p>
                        </div>
                </div>
                <div class="bg-[#1A2337]/80 border border-[#8D72C9]/20 rounded-xl p-5 space-y-2">
                        <div class="font-heading text-sm font-semibold text-[#B495F0] uppercase tracking-wider">{t('home.section.mechanics.4star')}</div>
                        <div class="space-y-1 text-xs text-[#B8C1D3] leading-relaxed">
                                <p>• Base rate: <span class="font-mono text-[#B495F0]">5.1%</span></p>
                                <p>• Guaranteed <span class="font-mono text-[#B495F0]">4★ every 10 pulls</span></p>
                                <p>• 50/50 on featured 4★</p>
                                <p>• Pulling a 5★ also resets 4★ pity</p>
                        </div>
                </div>
                <div class="bg-[#1A2337]/80 border border-[#5E90D6]/20 rounded-xl p-5 space-y-2">
                        <div class="font-heading text-sm font-semibold text-[#5E90D6] uppercase tracking-wider">{t('home.section.mechanics.economy')}</div>
                        <div class="space-y-1 text-xs text-[#B8C1D3] leading-relaxed">
                                <p>• 1 pull = <span class="font-mono text-[#E6C77A]">160 primo</span></p>
                                <p>• 10 pull = <span class="font-mono text-[#E6C77A]">1,600 primo</span></p>
                                <p>• Default balance: <span class="font-mono text-[#E6C77A]">16,000 primo</span></p>
                                <p>• Top-up simulasi: <span class="font-mono">+1,600 / +8,000 / +16,000</span></p>
                        </div>
                </div>
        </section>

        <!-- ═══ CTA Banner ═══ -->
        <section class="rounded-2xl border border-[#C9A45A]/20 bg-gradient-to-r from-[#1A2337] via-[#24314A]/40 to-[#1A2337] p-6 md:p-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div class="text-center md:text-left">
                        <h3 class="font-heading text-xl font-semibold text-[#F2E6D0]">{t('home.cta.pity-setup-banner.title')}</h3>
                        <p class="text-sm text-[#B8C1D3] mt-1">{t('home.cta.pity-setup-banner.body')}</p>
                </div>
                <a
                        href="/pity-setup"
                        onclick={handleCta}
                        class="btn-press shrink-0 px-6 py-3 rounded-md border border-[#C9A45A]/50 bg-gradient-to-r from-[#24314A] to-[#1A2337] hover:from-[#2A3856] hover:to-[#24314A] text-[#E6C77A] font-heading font-semibold tracking-wider uppercase text-sm transition-all"
                >
                        {t('home.cta.pity-setup-banner.btn')}
                </a>
        </section>

</div>
