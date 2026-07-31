<script lang="ts">
        import { fade, scale } from 'svelte/transition';
        import { cubicOut } from 'svelte/easing';

        type RngPage = {
                href: string;
                label: string;
                icon: string;
                desc: string;
                category: string;
        };

        const RNG_PAGES: RngPage[] = [
                { href: '/rng/artifact',   label: 'Artifact Substat', icon: '◈', desc: 'Roll artifact +0 → +20, simulasikan substat upgrade',                       category: 'Wish & Artifact' },
                { href: '/rng/strongbox',  label: 'Strongbox',        icon: '▣', desc: 'Trade 3× 5★ artifact → 1 random (66/34 substat odds, better than domain)', category: 'Wish & Artifact' },
                { href: '/rng/weapon',     label: 'Weapon Banner',    icon: '✦', desc: 'Gacha weapon dengan Epitomized Path & fate points',                       category: 'Wish & Artifact' },
                { href: '/rng/boss',       label: 'Normal Boss',      icon: '✺', desc: 'Boss drops: 1 guaranteed 5★ artifact + ascension gems (40 resin)',        category: 'Domain & Boss' },
                { href: '/rng/domain',     label: 'Domain Drops',     icon: '⌬', desc: 'Talent book / Weapon ascension / Artifact domain (20 resin)',             category: 'Domain & Boss' },
                { href: '/rng/talent',     label: 'Talent Drops',     icon: '✚', desc: 'Weekly boss talent material drops (post-5.0 guaranteed)',                 category: 'Domain & Boss' },
                { href: '/rng/cooking',    label: 'Cooking',          icon: '♨', desc: 'Special dish chance + 12% dupe talent (Jean, Hu Tao, dll)',              category: 'Crafting' },
                { href: '/rng/parametric', label: 'Parametric',       icon: '◈', desc: 'Parametric Transformer weekly reward (7-day cooldown gadget)',            category: 'Crafting' }
        ];

        const CATEGORIES = ['Wish & Artifact', 'Domain & Boss', 'Crafting'];

        let pagesByCategory = $derived(
                CATEGORIES.map((cat) => ({
                        category: cat,
                        pages: RNG_PAGES.filter((p) => p.category === cat)
                }))
        );
</script>

<svelte:head>
        <title>RNG Simulators — Genshin Impact</title>
</svelte:head>

<div class="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 space-y-8">

        <!-- ═══ Header ═══ -->
        <section class="space-y-2">
                <h1 class="font-heading text-3xl md:text-4xl font-bold text-[#F2E6D0]">Genshin RNG Simulators</h1>
                <p class="text-sm text-[#B8C1D3] max-w-2xl">
                        Simulasi RNG permanen di Genshin Impact. Pilih simulator di bawah — setiap halaman punya engine tersendiri dengan drop rate sesuai data resmi (Genshin Wiki Loot System).
                </p>
        </section>

        <!-- ═══ Pages by Category ═══ -->
        {#each pagesByCategory as group}
                <section class="space-y-3">
                        <h2 class="font-heading text-sm font-semibold text-[#E6C77A] uppercase tracking-wider">{group.category}</h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {#each group.pages as page (page.href)}
                                        <a
                                                href={page.href}
                                                class="card-hover group block p-4 rounded-lg border border-[#C9A45A]/25 bg-gradient-to-br from-[#1A2337] to-[#0B1020] hover:border-[#E6C77A]/60 transition-all hover:shadow-[0_0_24px_rgba(201,164,90,0.3)]"
                                                in:scale={{ start: 0.95, duration: 250, easing: cubicOut }}
                                        >
                                                <div class="flex items-center gap-3 mb-2">
                                                        <span class="text-2xl text-[#E6C77A] group-hover:text-[#F2E6D0] transition-colors">{page.icon}</span>
                                                        <span class="font-heading text-sm font-semibold text-[#F2E6D0] group-hover:text-[#E6C77A] transition-colors">{page.label}</span>
                                                </div>
                                                <p class="text-[11px] text-[#8E97AA] leading-relaxed">{page.desc}</p>
                                                <div class="mt-2 text-[10px] text-[#C9A45A] uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                                                        Buka simulator →
                                                </div>
                                        </a>
                                {/each}
                        </div>
                </section>
        {/each}

</div>
