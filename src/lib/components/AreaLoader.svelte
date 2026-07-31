<script lang="ts">
        // ─── Genshin Region-Themed Loading Screen ──────────────────────────────
        // Shows a rotating element compass with the name & signature color of one
        // of Teyvat's seven nations. Pick a region by passing a region prop, or
        // let the component auto-pick based on the element arg.
        //
        // Lightweight by design:
        //   - 1 rotating SVG ring (GPU layer)
        //   - 1 pulsing center element glyph
        //   - 4 sparkle dots orbiting
        //   - region color tint via single radial gradient
        // All animations are transform/opacity only.

        import { t } from '$lib/i18n/index.svelte';

        export type Region = 'mondstadt' | 'liyue' | 'inazuma' | 'sumeru' | 'fontaine' | 'natlan';

        let { region = 'mondstadt' }: { region?: Region } = $props();

        // Per-region signature palette + element glyph
        const REGION_DATA: Record<Region, {
                color: string;
                glow: string;
                glyph: string; // SVG path data
                taglineKey: string;
        }> = {
                mondstadt: {
                        color: '#5FC9B8',
                        glow: 'rgba(95, 201, 184, 0.35)',
                        glyph: 'M50 10 L60 40 L90 50 L60 60 L50 90 L40 60 L10 50 L40 40 Z', // anemo spore
                        taglineKey: 'region.tagline'
                },
                liyue: {
                        color: '#E0B25A',
                        glow: 'rgba(224, 178, 90, 0.35)',
                        glyph: 'M50 15 L80 35 L80 65 L50 85 L20 65 L20 35 Z M50 35 L65 45 L65 55 L50 65 L35 55 L35 45 Z', // geo cube
                        taglineKey: 'region.tagline.liyue'
                },
                inazuma: {
                        color: '#B495F0',
                        glow: 'rgba(180, 149, 240, 0.35)',
                        glyph: 'M50 10 L55 35 L80 30 L60 50 L80 70 L55 65 L50 90 L45 65 L20 70 L40 50 L20 30 L45 35 Z', // electro bolt
                        taglineKey: 'region.tagline.inazuma'
                },
                sumeru: {
                        color: '#6FAF6E',
                        glow: 'rgba(111, 175, 110, 0.35)',
                        glyph: 'M50 10 Q70 30 70 50 Q70 70 50 90 Q30 70 30 50 Q30 30 50 10 Z M50 30 Q40 40 40 50 Q40 60 50 70 Q60 60 60 50 Q60 40 50 30 Z', // dendro leaf
                        taglineKey: 'region.tagline.sumeru'
                },
                fontaine: {
                        color: '#4A8FE0',
                        glow: 'rgba(74, 143, 224, 0.35)',
                        glyph: 'M50 10 Q70 40 70 60 Q70 85 50 90 Q30 85 30 60 Q30 40 50 10 Z', // hydro droplet
                        taglineKey: 'region.tagline.fontaine'
                },
                natlan: {
                        color: '#E8745A',
                        glow: 'rgba(232, 116, 90, 0.35)',
                        glyph: 'M50 15 Q60 30 55 45 Q70 35 75 50 Q70 65 55 55 Q60 70 50 85 Q40 70 45 55 Q30 65 25 50 Q30 35 45 45 Q40 30 50 15 Z', // pyro flame
                        taglineKey: 'region.tagline.natlan'
                }
        };

        let data = $derived(REGION_DATA[region]);

        // Region name from i18n
        let regionName = $derived(t(`region.${region}`));
        let tagline = $derived(t(data.taglineKey));
</script>

<div class="area-loader fixed inset-0 z-[60] flex items-center justify-center bg-[#0B1020] pointer-events-auto">
        <!-- Region color radial glow -->
        <div class="absolute inset-0 opacity-70 transition-opacity duration-500"
                style="background: radial-gradient(ellipse at center, {data.glow}, transparent 60%);"></div>

        <!-- Center compass -->
        <div class="relative flex flex-col items-center justify-center gap-5">
                <!-- Compass emblem -->
                <div class="relative w-28 h-28 gpu-layer">
                        <!-- Outer rotating ring with region color -->
                        <svg class="absolute inset-0 w-full h-full animate-spin-slow" viewBox="0 0 100 100" fill="none">
                                <circle cx="50" cy="50" r="46" stroke={data.color} stroke-width="1.5" stroke-dasharray="4 6" opacity="0.5"/>
                                <circle cx="50" cy="50" r="40" stroke={data.color} stroke-width="0.5" opacity="0.25"/>
                        </svg>

                        <!-- Inner counter-rotating ring -->
                        <svg class="absolute inset-3 w-22 h-22 animate-spin-reverse" viewBox="0 0 100 100" fill="none">
                                <circle cx="50" cy="50" r="35" stroke={data.color} stroke-width="1" stroke-dasharray="2 8" opacity="0.4"/>
                        </svg>

                        <!-- Element glyph (pulsing) -->
                        <div class="absolute inset-0 flex items-center justify-center">
                                <svg class="w-12 h-12 animate-pulse-glyph" viewBox="0 0 100 100" fill="none">
                                        <path d={data.glyph} fill={data.color} fill-opacity="0.85" stroke={data.color} stroke-width="1"/>
                                </svg>
                        </div>

                        <!-- 4 orbiting sparkle dots -->
                        <div class="absolute inset-0 animate-spin-slow">
                                <div class="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                                        style="background: {data.color}; box-shadow: 0 0 6px {data.color};"></div>
                                <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                                        style="background: {data.color}; box-shadow: 0 0 6px {data.color};"></div>
                                <div class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0.5 rounded-full"
                                        style="background: {data.color}; box-shadow: 0 0 4px {data.color};"></div>
                                <div class="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-0.5 rounded-full"
                                        style="background: {data.color}; box-shadow: 0 0 4px {data.color};"></div>
                        </div>
                </div>

                <!-- Region name + tagline -->
                <div class="flex flex-col items-center gap-1.5 text-center">
                        <div class="font-heading text-2xl md:text-3xl font-bold tracking-[0.15em] uppercase"
                                style="color: {data.color}; text-shadow: 0 0 18px {data.glow};">
                                {regionName}
                        </div>
                        <div class="text-[10px] uppercase tracking-[0.35em] text-[#8E97AA]">
                                {tagline}
                        </div>
                </div>

                <!-- Progress bar -->
                <div class="w-48 h-0.5 bg-[#1A2337] rounded-full overflow-hidden">
                        <div class="h-full animate-progress gpu-layer"
                                style="background: linear-gradient(90deg, transparent, {data.color}, transparent);"></div>
                </div>
        </div>

        <!-- Floating sparkle particles (4 only — kept light) -->
        <div class="absolute inset-0 pointer-events-none overflow-hidden">
                {#each Array(4) as _, i}
                        <div
                                class="absolute w-1 h-1 rounded-full opacity-0 animate-sparkle gpu-layer"
                                style="
                                        background: {data.color};
                                        left: {25 + (i * 18) % 50}%;
                                        top: {30 + (i * 13) % 40}%;
                                        animation-delay: {i * 0.4}s;
                                        animation-duration: {2 + (i % 2) * 0.5}s;
                                        box-shadow: 0 0 6px {data.color};
                                "
                        ></div>
                {/each}
        </div>
</div>

<style>
        .animate-spin-slow {
                animation: spin 5s linear infinite;
        }
        .animate-spin-reverse {
                animation: spin 3.5s linear infinite reverse;
        }
        .animate-pulse-glyph {
                animation: pulse-glyph 1.8s ease-in-out infinite;
        }
        .animate-progress {
                animation: progress 1.6s ease-in-out infinite;
        }
        .animate-sparkle {
                animation: sparkle 2s ease-in-out infinite;
        }

        @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
        }

        @keyframes pulse-glyph {
                0%, 100% { transform: scale(1); opacity: 0.85; filter: drop-shadow(0 0 4px currentColor); }
                50%      { transform: scale(1.18); opacity: 1; filter: drop-shadow(0 0 12px currentColor); }
        }

        @keyframes progress {
                0%   { transform: translateX(-100%); }
                50%  { transform: translateX(0%); }
                100% { transform: translateX(100%); }
        }

        @keyframes sparkle {
                0%, 100% { opacity: 0; transform: scale(0); }
                50%      { opacity: 0.8; transform: scale(1); }
        }

        @media (prefers-reduced-motion: reduce) {
                .animate-spin-slow,
                .animate-spin-reverse,
                .animate-pulse-glyph,
                .animate-progress,
                .animate-sparkle {
                        animation: none !important;
                }
        }
</style>
