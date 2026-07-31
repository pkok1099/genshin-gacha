<script lang="ts">
        import '../app.css';
        import { page } from '$app/state';
        import { getGameState } from '$lib/stores/gameState.svelte';
        import PrimoCounter from '$lib/components/PrimoCounter.svelte';
        import { clickOutside } from '$lib/actions/clickOutside';

        const game = getGameState();

        let { children } = $props();

        // Top-level nav items (alphabetical, Home first)
        const navItems: { href: string; label: string; icon: string }[] = [
                { href: '/',           label: 'Home',       icon: '⌂' },
                { href: '/history',    label: 'History',    icon: '☰' },
                { href: '/pity-setup', label: 'Pity Setup', icon: '⚙' },
                { href: '/redeem',     label: 'Redeem',     icon: '✉' },
                { href: '/wish',       label: 'Wish',       icon: '✦' }
        ];

        // RNG Sims sub-pages (alphabetical within each category)
        const rngSubItems: { href: string; label: string; icon: string; category: string }[] = [
                { href: '/rng/artifact',   label: 'Artifact Substat', icon: '◈', category: 'Wish & Artifact' },
                { href: '/rng/strongbox',  label: 'Strongbox',        icon: '▣', category: 'Wish & Artifact' },
                { href: '/rng/weapon',     label: 'Weapon Banner',    icon: '✦', category: 'Wish & Artifact' },
                { href: '/rng/boss',       label: 'Normal Boss',      icon: '✺', category: 'Domain & Boss' },
                { href: '/rng/domain',     label: 'Domain Drops',     icon: '⌬', category: 'Domain & Boss' },
                { href: '/rng/talent',     label: 'Talent Drops',     icon: '✚', category: 'Domain & Boss' },
                { href: '/rng/cooking',    label: 'Cooking',          icon: '♨', category: 'Crafting' },
                { href: '/rng/parametric', label: 'Parametric',       icon: '◈', category: 'Crafting' }
        ];

        const RNG_CATEGORIES = ['Wish & Artifact', 'Domain & Boss', 'Crafting'];

        let rngDropdownOpen = $state(false);
        let mobileOpen = $state(false);
        let mobileRngOpen = $state(false);

        // Determine if current page is under /rng/*
        let isRngActive = $derived(page.url.pathname.startsWith('/rng'));

        function isActive(href: string): boolean {
                if (href === '/') return page.url.pathname === '/';
                return page.url.pathname === href;
        }
</script>

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
                                                {item.label}
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
                                                RNG Sims
                                                <svg class="w-3.5 h-3.5 ml-0.5 transition-transform {rngDropdownOpen ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                                                </svg>
                                        </button>

                                        {#if rngDropdownOpen}
                                                <!-- Dropdown menu -->
                                                <div class="absolute right-0 top-full mt-1 z-50 w-64 rounded-lg border border-[#C9A45A]/30 bg-[#141C2F] shadow-xl overflow-hidden animate-dropdown">
                                                        <!-- Overview link -->
                                                        <a
                                                                href="/rng"
                                                                onclick={() => rngDropdownOpen = false}
                                                                class="block px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#E6C77A] hover:bg-[#24314A] transition-colors border-b border-[#24314A] bg-[#C9A45A]/5"
                                                        >
                                                                ◈ RNG Overview
                                                        </a>

                                                        {#each RNG_CATEGORIES as cat}
                                                                <div class="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#8E97AA] bg-[#0B1020]/40">
                                                                        {cat}
                                                                </div>
                                                                {#each rngSubItems as item}
                                                                        {#if item.category === cat}
                                                                                <a
                                                                                        href={item.href}
                                                                                        onclick={() => rngDropdownOpen = false}
                                                                                        class="flex items-center gap-2 px-3 py-2 text-sm transition-colors {isActive(item.href) ? 'bg-[#C9A45A]/15 text-[#E6C77A]' : 'text-[#B8C1D3] hover:bg-[#24314A] hover:text-[#F2E6D0]'}"
                                                                                >
                                                                                        <span class="opacity-70 w-4 text-center">{item.icon}</span>
                                                                                        <span class="truncate">{item.label}</span>
                                                                                </a>
                                                                        {/if}
                                                                {/each}
                                                        {/each}
                                                </div>
                                        {/if}
                                </div>
                        </nav>

                        <!-- Right: Primo Counter + Mobile Toggle -->
                        <div class="flex items-center gap-2">
                                <PrimoCounter amount={game.primogem} onTopUp={(amt) => game.addPrimogem(amt)} />

                                <!-- Mobile menu button -->
                                <button
                                        class="btn-press md:hidden p-2 rounded-md text-[#B8C1D3] hover:text-[#F2E6D0] hover:bg-[#24314A]/50 transition-colors"
                                        onclick={() => mobileOpen = !mobileOpen}
                                        aria-label="Toggle menu"
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
                        <nav class="md:hidden pb-3 flex flex-col gap-1 animate-slide-down" use:clickOutside={() => mobileOpen = false}>
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
                                                {item.label}
                                        </a>
                                {/each}

                                <!-- RNG Sims collapsible section -->
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
                                                RNG Sims
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
                                                        ◈ Overview
                                                </a>
                                                {#each RNG_CATEGORIES as cat}
                                                        <div class="px-3 pt-2 pb-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#8E97AA]">{cat}</div>
                                                        {#each rngSubItems as item}
                                                                {#if item.category === cat}
                                                                        <a
                                                                                href={item.href}
                                                                                onclick={() => { mobileOpen = false; mobileRngOpen = false; }}
                                                                                class="px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-2 {isActive(item.href) ? 'bg-[#C9A45A]/15 text-[#E6C77A]' : 'text-[#B8C1D3] hover:bg-[#24314A] hover:text-[#F2E6D0]'}"
                                                                        >
                                                                                <span class="opacity-70 w-4 text-center">{item.icon}</span>
                                                                                <span class="truncate">{item.label}</span>
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

<!-- ═══ Page Content ═══ -->
<main class="animate-page">
        {@render children()}
</main>

<!-- ═══ Footer ═══ -->
<footer class="border-t border-[#C9A45A]/15 mt-16 py-8 px-4">
        <div class="max-w-7xl mx-auto text-center space-y-2 text-xs text-[#8E97AA]">
                <p>
                        Data banner dari
                        <a href="https://api.ennead.cc" target="_blank" rel="noopener" class="text-[#C9A45A] hover:text-[#E6C77A]">api.ennead.cc</a>
                        • Karakter & gambar dari
                        <a href="https://genshin.jmp.blue" target="_blank" rel="noopener" class="text-[#C9A45A] hover:text-[#E6C77A]">genshin.jmp.blue</a>
                </p>
                <p>Genshin Impact © HoYoverse — Fan-made simulator, bukan resmi.</p>
                <p class="text-[#5E6478]">Semua progress tersimpan otomatis di browser (localStorage).</p>
        </div>
</footer>
