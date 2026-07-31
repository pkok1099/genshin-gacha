<script lang="ts">
        // Genshin Impact-style loading screen.
        // Heavy on visual identity, light on the compositor:
        //   - 2 SVG rings (no DOM nodes per-frame)
        //   - 1 pulsing center star
        //   - 6 floating sparkles (down from 12)
        // All animations are transform/opacity only — no layout/paint thrash.

        let { message = 'Loading' }: { message?: string } = $props();
</script>

<div class="genshin-loader fixed inset-0 z-[60] flex items-center justify-center bg-[#0B1020] pointer-events-auto">
        <!-- Soft radial glow background -->
        <div class="absolute inset-0 opacity-60"
                style="background: radial-gradient(ellipse at center, rgba(201, 164, 90, 0.15), transparent 60%);"></div>

        <!-- Center wish emblem -->
        <div class="relative flex flex-col items-center justify-center gap-6">
                <!-- Animated wish swirl -->
                <div class="relative w-24 h-24 gpu-layer">
                        <!-- Outer rotating ring -->
                        <svg class="absolute inset-0 w-full h-full animate-spin-slow" viewBox="0 0 100 100" fill="none">
                                <circle cx="50" cy="50" r="45" stroke="url(#goldGradient)" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.6"/>
                                <defs>
                                        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stop-color="#E6C77A"/>
                                                <stop offset="100%" stop-color="#C9A45A"/>
                                        </linearGradient>
                                </defs>
                        </svg>

                        <!-- Inner counter-rotating ring -->
                        <svg class="absolute inset-2 w-20 h-20 animate-spin-reverse" viewBox="0 0 100 100" fill="none">
                                <circle cx="50" cy="50" r="35" stroke="#C9A45A" stroke-width="1" stroke-dasharray="3 6" opacity="0.4"/>
                        </svg>

                        <!-- Center star -->
                        <div class="absolute inset-0 flex items-center justify-center">
                                <svg class="w-10 h-10 animate-pulse-star" viewBox="0 0 24 24" fill="none">
                                        <path
                                                d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
                                                fill="url(#starGradient)"
                                                stroke="#E6C77A"
                                                stroke-width="0.5"
                                        />
                                        <defs>
                                                <linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                        <stop offset="0%" stop-color="#F2E6D0"/>
                                                        <stop offset="50%" stop-color="#E6C77A"/>
                                                        <stop offset="100%" stop-color="#C9A45A"/>
                                                </linearGradient>
                                        </defs>
                                </svg>
                        </div>

                        <!-- Orbiting sparkles (single rotating container, 4 dots) -->
                        <div class="absolute inset-0 animate-spin-slow">
                                <div class="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#E6C77A] shadow-[0_0_6px_#E6C77A]"></div>
                                <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#F2E6D0] shadow-[0_0_6px_#F2E6D0]"></div>
                                <div class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0.5 rounded-full bg-[#C9A45A] shadow-[0_0_4px_#C9A45A]"></div>
                                <div class="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-0.5 rounded-full bg-[#E6C77A] shadow-[0_0_4px_#E6C77A]"></div>
                        </div>
                </div>

                <!-- Loading text with animated dots -->
                <div class="flex flex-col items-center gap-2">
                        <div class="font-heading text-sm font-semibold tracking-[0.3em] uppercase text-[#E6C77A]">
                                {message}
                                <span class="animate-dots"></span>
                        </div>
                        <div class="text-[10px] text-[#8E97AA] uppercase tracking-wider">
                                Genshin Wish Simulator
                        </div>
                </div>

                <!-- Progress bar -->
                <div class="w-48 h-0.5 bg-[#1A2337] rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-[#C9A45A] via-[#E6C77A] to-[#C9A45A] animate-progress gpu-layer"></div>
                </div>
        </div>

        <!-- Floating sparkle particles — reduced from 12 to 6, all transform/opacity -->
        <div class="absolute inset-0 pointer-events-none overflow-hidden">
                {#each Array(6) as _, i}
                        <div
                                class="absolute w-1 h-1 rounded-full bg-[#E6C77A] opacity-0 animate-sparkle gpu-layer"
                                style="
                                        left: {20 + (i * 12) % 60}%;
                                        top: {25 + (i * 17) % 50}%;
                                        animation-delay: {i * 0.35}s;
                                        animation-duration: {2 + (i % 3) * 0.5}s;
                                "
                        ></div>
                {/each}
        </div>
</div>

<style>
        .animate-spin-slow {
                animation: spin 4s linear infinite;
        }
        .animate-spin-reverse {
                animation: spin 3s linear infinite reverse;
        }
        .animate-pulse-star {
                animation: pulse-star 1.5s ease-in-out infinite;
        }
        .animate-dots {
                display: inline-block;
                width: 1.5em;
                text-align: left;
        }
        .animate-dots::after {
                content: '...';
                animation: dots 1.5s steps(4, end) infinite;
        }
        .animate-progress {
                animation: progress 1.5s ease-in-out infinite;
        }
        .animate-sparkle {
                animation: sparkle 2s ease-in-out infinite;
        }

        @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
        }

        @keyframes pulse-star {
                0%, 100% { transform: scale(1); opacity: 0.9; filter: drop-shadow(0 0 4px rgba(230, 199, 122, 0.6)); }
                50% { transform: scale(1.15); opacity: 1; filter: drop-shadow(0 0 10px rgba(230, 199, 122, 0.9)); }
        }

        @keyframes dots {
                0%, 20% { content: ''; opacity: 0; }
                25% { content: '.'; opacity: 1; }
                50% { content: '..'; opacity: 1; }
                75%, 100% { content: '...'; opacity: 1; }
        }

        @keyframes progress {
                0% { transform: translateX(-100%); }
                50% { transform: translateX(0%); }
                100% { transform: translateX(100%); }
        }

        @keyframes sparkle {
                0%, 100% { opacity: 0; transform: scale(0); }
                50% { opacity: 0.8; transform: scale(1); box-shadow: 0 0 6px #E6C77A; }
        }

        @media (prefers-reduced-motion: reduce) {
                .animate-spin-slow,
                .animate-spin-reverse,
                .animate-pulse-star,
                .animate-progress,
                .animate-sparkle,
                .animate-dots::after {
                        animation: none !important;
                }
                .animate-dots::after { content: '...'; opacity: 1; }
        }
</style>
