<script lang="ts">
        import { onMount } from 'svelte';
        import { getBannerStore } from '$lib/stores/bannerStore.svelte';
        import { getGameState } from '$lib/stores/gameState.svelte';
        import BannerCard from '$lib/components/BannerCard.svelte';
        import { characterIconBigUrl, characterGachaSplashUrl, slugifyName } from '$lib/services/characterApi';
        import { fly, fade } from 'svelte/transition';
        import { cubicOut } from 'svelte/easing';

        const banners = getBannerStore();
        const game = getGameState();

        onMount(() => {
                if (banners.banners.length === 0 && !banners.isLoading) {
                        banners.fetchBanners();
                }
        });

        let splashFailed = $state(false);
</script>

<svelte:head>
        <title>Genshin Impact Wish Simulator — Home</title>
        <meta name="description" content="Simulasi gacha Genshin Impact dengan pity system akurat, localStorage persistence, dan data banner real-time." />
</svelte:head>

<div class="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 space-y-10">

        <!-- ═══ Hero ═══ -->
        <section class="relative overflow-hidden rounded-2xl border border-[#C9A45A]/20 bg-gradient-to-br from-[#1A2337] via-[#141C2F] to-[#0B1020]">
                <!-- Decorative gradient -->
                <div class="absolute inset-0 pointer-events-none">
                        <div class="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-40"
                                style="background: radial-gradient(circle, rgba(230,199,122,0.35), transparent 70%);"></div>
                        <div class="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-30"
                                style="background: radial-gradient(circle, rgba(141,114,201,0.35), transparent 70%);"></div>
                </div>

                <div class="relative grid grid-cols-1 md:grid-cols-2 gap-6 p-6 md:p-10 lg:p-12 items-center">
                        <!-- Left: Text -->
                        <div class="space-y-4">
                                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9A45A]/10 border border-[#C9A45A]/30 text-[#E6C77A] text-xs font-semibold uppercase tracking-wider">
                                        <span class="w-1.5 h-1.5 rounded-full bg-[#E6C77A] animate-pulse"></span>
                                        {#if banners.currentBanner}
                                                v{banners.currentBanner.version} • Live Banner
                                        {:else}
                                                Loading banner…
                                        {/if}
                                </div>

                                <h1 class="font-heading text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-[#F2E6D0]">
                                        Wish
                                        <span class="block bg-gradient-to-r from-[#E6C77A] via-[#C9A45A] to-[#E6C77A] bg-clip-text text-transparent">
                                                Simulator
                                        </span>
                                </h1>

                                <p class="text-[#B8C1D3] text-sm md:text-base max-w-md leading-relaxed">
                                        Simulasikan gacha Genshin Impact dengan pity system akurat (soft pity 74, hard pity 90, 50/50). Semua progress tersimpan otomatis di browser.
                                </p>

                                <div class="flex flex-wrap gap-3 pt-2">
                                        <a
                                                href="/wish"
                                                class="inline-flex items-center gap-2 px-6 py-3 rounded-md border border-[#C9A45A]/50 bg-gradient-to-r from-[#C9A45A] to-[#E6C77A] text-[#0B1020] font-heading font-semibold tracking-wider uppercase text-sm transition-all hover:shadow-[0_0_30px_rgba(230,199,122,0.5)]"
                                        >
                                                <span>✦</span> Mulai Wish
                                        </a>
                                        <a
                                                href="/pity-setup"
                                                class="inline-flex items-center gap-2 px-6 py-3 rounded-md border border-[#24314A] bg-[#1A2337]/70 text-[#F2E6D0] hover:text-[#E6C77A] hover:border-[#C9A45A]/40 font-heading font-semibold tracking-wider uppercase text-sm transition-all"
                                        >
                                                ⚙ Pity Setup
                                        </a>
                                </div>

                                <!-- Quick stats -->
                                <div class="grid grid-cols-3 gap-3 pt-4 border-t border-[#24314A]">
                                        <div>
                                                <div class="text-[10px] text-[#8E97AA] uppercase tracking-wider">Total Wish</div>
                                                <div class="font-mono text-lg font-bold text-[#F2E6D0] tabular-nums">{game.totalWishes.toLocaleString('en-US')}</div>
                                        </div>
                                        <div>
                                                <div class="text-[10px] text-[#8E97AA] uppercase tracking-wider">5★ Diperoleh</div>
                                                <div class="font-mono text-lg font-bold text-[#E6C77A] tabular-nums">
                                                        {game.wishHistory.filter((w) => w.rarity === 5).length}
                                                </div>
                                        </div>
                                        <div>
                                                <div class="text-[10px] text-[#8E97AA] uppercase tracking-wider">Primogem</div>
                                                <div class="font-mono text-lg font-bold text-[#E6C77A] tabular-nums">{game.primogem.toLocaleString('en-US')}</div>
                                        </div>
                                </div>
                        </div>

                        <!-- Right: Featured character splash -->
                        <div class="relative h-72 md:h-96 lg:h-[28rem]">
                                {#if banners.featured5Star}
                                        <div class="absolute inset-0 flex items-end justify-center" in:fly={{ y: 20, duration: 600, easing: cubicOut }}>
                                                <!-- Glow background -->
                                                <div class="absolute inset-0 opacity-50"
                                                        style="background: radial-gradient(ellipse at center 70%, rgba(230,199,122,0.4), transparent 60%);"></div>

                                                <!-- Splash image -->
                                                {#if !splashFailed}
                                                        <img
                                                                src={characterGachaSplashUrl(slugifyName(banners.featured5Star.name))}
                                                                alt={banners.featured5Star.name}
                                                                class="relative h-full w-full object-contain object-bottom drop-shadow-2xl"
                                                                onerror={(e: Event) => { splashFailed = true; (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                                        />
                                                {:else}
                                                        <img
                                                                src={characterIconBigUrl(slugifyName(banners.featured5Star.name))}
                                                                alt={banners.featured5Star.name}
                                                                class="relative h-3/4 w-auto object-contain object-bottom drop-shadow-2xl"
                                                                onerror={(e: Event) => {
                                                                        const img = e.currentTarget as HTMLImageElement;
                                                                        const fb = banners.featured5Star?.icon;
                                                                        if (fb && img.src !== fb) img.src = fb;
                                                                }}
                                                        />
                                                {/if}

                                                <!-- Character name overlay -->
                                                <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0B1020] via-[#0B1020]/70 to-transparent">
                                                        <div class="text-[10px] text-[#E6C77A] uppercase tracking-wider mb-1">Featured 5★</div>
                                                        <div class="font-heading text-2xl md:text-3xl font-bold text-[#F2E6D0]">
                                                                {banners.featured5Star.name}
                                                        </div>
                                                        <div class="text-xs text-[#B8C1D3] mt-0.5">{banners.featured5Star.element} • Rate-Up</div>
                                                </div>
                                        </div>
                                {:else if banners.isLoading}
                                        <div class="absolute inset-0 flex items-center justify-center">
                                                <div class="text-[#8E97AA] text-sm animate-pulse">Memuat banner…</div>
                                        </div>
                                {/if}
                        </div>
                </div>
        </section>

        <!-- ═══ Banner Selection ═══ -->
        <section class="space-y-4">
                <div class="flex justify-between items-center">
                        <div>
                                <h2 class="font-heading text-2xl font-semibold text-[#F2E6D0]">Banner Aktif</h2>
                                <p class="text-xs text-[#8E97AA] mt-1">Pilih banner untuk wish. Banner dipakai oleh halaman <a href="/wish" class="text-[#C9A45A] hover:text-[#E6C77A]">/wish</a>.</p>
                        </div>
                        <button
                                onclick={() => banners.fetchBanners()}
                                class="text-xs bg-[#1A2337] hover:bg-[#24314A] text-[#E6C77A] px-3 py-1.5 rounded-md border border-[#C9A45A]/30 transition-all flex items-center gap-1.5"
                                disabled={banners.isLoading}
                        >
                                <svg class="w-3 h-3 {banners.isLoading ? 'animate-spin' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Sync
                        </button>
                </div>

                {#if banners.apiError && banners.banners.length === 0}
                        <div class="bg-[#8B3A3A]/15 border border-[#8B3A3A]/40 text-[#E8745A] px-4 py-3 rounded-md text-sm flex items-center gap-3" in:fade>
                                <svg class="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>
                                <div>
                                        <p class="font-semibold">Gagal memuat banner dari API.</p>
                                        <p class="text-xs mt-0.5 opacity-80">Menggunakan banner fallback. Klik Sync untuk mencoba lagi.</p>
                                </div>
                        </div>
                {/if}

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {#if banners.isLoading && banners.banners.length === 0}
                                {#each [0, 1] as _}
                                        <div class="bg-[#1A2337] p-4 rounded-xl border border-[#24314A] animate-pulse">
                                                <div class="flex gap-4 items-center">
                                                        <div class="w-20 h-20 bg-[#24314A] rounded-lg"></div>
                                                        <div class="flex-1 space-y-2">
                                                                <div class="h-3 w-12 bg-[#24314A] rounded-full"></div>
                                                                <div class="h-5 w-28 bg-[#24314A] rounded"></div>
                                                                <div class="h-2 w-20 bg-[#24314A] rounded"></div>
                                                        </div>
                                                </div>
                                        </div>
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
                        <div class="font-heading text-sm font-semibold text-[#E6C77A] uppercase tracking-wider">5★ Mechanics</div>
                        <div class="space-y-1 text-xs text-[#B8C1D3] leading-relaxed">
                                <p>• Base rate: <span class="font-mono text-[#E6C77A]">0.6%</span></p>
                                <p>• Soft pity starts at <span class="font-mono text-[#E6C77A]">pull 74</span></p>
                                <p>• Hard pity at <span class="font-mono text-[#E6C77A]">pull 90</span></p>
                                <p>• 50/50 on featured — loss → next 5★ guaranteed featured</p>
                        </div>
                </div>
                <div class="bg-[#1A2337]/80 border border-[#8D72C9]/20 rounded-xl p-5 space-y-2">
                        <div class="font-heading text-sm font-semibold text-[#B495F0] uppercase tracking-wider">4★ Mechanics</div>
                        <div class="space-y-1 text-xs text-[#B8C1D3] leading-relaxed">
                                <p>• Base rate: <span class="font-mono text-[#B495F0]">5.1%</span></p>
                                <p>• Guaranteed <span class="font-mono text-[#B495F0]">4★ every 10 pulls</span></p>
                                <p>• 50/50 on featured 4★</p>
                                <p>• Pulling a 5★ also resets 4★ pity</p>
                        </div>
                </div>
                <div class="bg-[#1A2337]/80 border border-[#5E90D6]/20 rounded-xl p-5 space-y-2">
                        <div class="font-heading text-sm font-semibold text-[#5E90D6] uppercase tracking-wider">Primogem Economy</div>
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
                        <h3 class="font-heading text-xl font-semibold text-[#F2E6D0]">Sudah punya pity dari akun asli?</h3>
                        <p class="text-sm text-[#B8C1D3] mt-1">Atur pity awal di Pity Setup agar simulasi sesuai kondisi akunmu.</p>
                </div>
                <a
                        href="/pity-setup"
                        class="shrink-0 px-6 py-3 rounded-md border border-[#C9A45A]/50 bg-gradient-to-r from-[#24314A] to-[#1A2337] hover:from-[#2A3856] hover:to-[#24314A] text-[#E6C77A] font-heading font-semibold tracking-wider uppercase text-sm transition-all"
                >
                        Atur Pity →
                </a>
        </section>

</div>
