<script lang="ts">
        // Sound settings panel — master volume + per-category mute toggles.
        // Designed to sit at the bottom of the wish page's left column (or
        // anywhere compact). Reads/writes the synth module's persisted state.

        import {
                soundSettingsState,
                setSoundVolume,
                setCategoryMuted,
                type SoundCategory
        } from '$lib/audio/synth.svelte';
        import { playWishClick, playCardFlip, playReveal, playTick, playError, playSuccess } from '$lib/audio/synth.svelte';
        import { t, localeKey } from '$lib/i18n/index.svelte';

        // Re-render on locale change
        void localeKey();

        // Read the live settings object (reactive via Svelte 5 runes).
        const settings = soundSettingsState();

        type CatMeta = {
                key: SoundCategory;
                label: string;
                icon: string;
                desc: string;
                preview: () => void;
        };

        const CATEGORIES: CatMeta[] = [
                { key: 'click',   label: t('sound.click'),   icon: '✦', desc: t('sound.click.desc'),   preview: playWishClick },
                { key: 'flip',    label: t('sound.flip'),    icon: '↻', desc: t('sound.flip.desc'),    preview: playCardFlip },
                { key: 'reveal',  label: t('sound.reveal'),  icon: '★', desc: t('sound.reveal.desc'),  preview: () => playReveal(5) },
                { key: 'tick',    label: t('sound.tick'),    icon: '·', desc: t('sound.tick.desc'),    preview: playTick },
                { key: 'error',   label: t('sound.error'),   icon: '✗', desc: t('sound.error.desc'),   preview: playError },
                { key: 'success', label: t('sound.success'), icon: '✓', desc: t('sound.success.desc'), preview: playSuccess }
        ];

        function volumePercent(): number {
                return Math.round(settings.volume * 100);
        }

        function onVolumeInput(e: Event) {
                const v = parseInt((e.currentTarget as HTMLInputElement).value, 10);
                setSoundVolume(v / 100);
        }
</script>

<div class="bg-[#1A2337]/80 backdrop-blur-sm p-4 rounded-xl border border-[#C9A45A]/20 shadow-xl space-y-3">
        <h3 class="font-heading text-xs font-semibold text-[#F2E6D0] uppercase tracking-wider">
                <span class="text-[#E6C77A]">♪</span> {t('sound.title')}
        </h3>

        <!-- Master volume slider -->
        <div class="space-y-1.5">
                <div class="flex justify-between items-center">
                        <label for="sound-volume" class="text-[11px] font-bold text-[#E6C77A] uppercase tracking-wider">{t('sound.volume')}</label>
                        <span class="text-[10px] font-mono text-[#F2E6D0] tabular-nums">{volumePercent()}%</span>
                </div>
                <input
                        id="sound-volume"
                        type="range"
                        min="0"
                        max="100"
                        value={volumePercent()}
                        oninput={onVolumeInput}
                        class="w-full h-1.5 bg-[#0B1020] rounded-full appearance-none cursor-pointer accent-[#E6C77A]"
                />
        </div>

        <!-- Per-category mutes -->
        <div class="space-y-1.5 pt-2 border-t border-[#24314A]">
                <div class="text-[10px] text-[#8E97AA] uppercase tracking-wider mb-1">{t('sound.categories')}</div>
                {#each CATEGORIES as cat}
                        {@const muted = settings.muted[cat.key]}
                        <div class="flex items-center justify-between p-1.5 rounded-md bg-[#0B1020]/40 border border-[#24314A]/60">
                                <div class="flex items-center gap-2 min-w-0">
                                        <span class="text-sm {muted ? 'text-[#5E6478]' : 'text-[#E6C77A]'} shrink-0">{cat.icon}</span>
                                        <div class="min-w-0">
                                                <div class="text-[11px] font-bold {muted ? 'text-[#5E6478]' : 'text-[#F2E6D0]'} uppercase tracking-wider truncate">{cat.label}</div>
                                                <div class="text-[9px] text-[#8E97AA] truncate">{cat.desc}</div>
                                        </div>
                                </div>
                                <div class="flex items-center gap-1.5 shrink-0">
                                        <button
                                                type="button"
                                                onclick={cat.preview}
                                                class="px-1.5 py-0.5 rounded text-[10px] text-[#8E97AA] hover:text-[#E6C77A] border border-[#24314A] hover:border-[#C9A45A]/40 transition-colors"
                                                title={t('sound.preview')}
                                        >
                                                ▶
                                        </button>
                                        <button
                                                type="button"
                                                onclick={() => setCategoryMuted(cat.key, !muted)}
                                                class="relative w-9 h-4.5 rounded-full transition-colors shrink-0 {muted ? 'bg-[#24314A]' : 'bg-[#C9A45A]'}"
                                                style="height: 1.125rem; width: 2.25rem;"
                                                aria-pressed={!muted}
                                                aria-label="Toggle {cat.label} sound"
                                        >
                                                <span class="absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-[#F2E6D0] transition-transform {muted ? '' : 'translate-x-4'}"></span>
                                        </button>
                                </div>
                        </div>
                {/each}
        </div>

        <div class="text-[9px] text-[#8E97AA] pt-2 border-t border-[#24314A] leading-relaxed">
                {t('sound.footer')}
        </div>
</div>
