<script lang="ts">
        // Toaster — renders the global toast stack in a fixed top-right position.
        // Mount once in +layout.svelte; any page can push toasts via the toast store.

        import { getToasts, dismiss, type ToastKind } from '$lib/stores/toast.svelte';
        import { fly } from 'svelte/transition';
        import { cubicOut } from 'svelte/easing';

        const toasts = $derived(getToasts());

        const KIND_META: Record<ToastKind, { icon: string; accent: string; border: string; bg: string }> = {
                success: { icon: '✓', accent: 'text-[#6FAF6E]', border: 'border-[#6FAF6E]/50', bg: 'bg-[#1A2337]' },
                error:   { icon: '✗', accent: 'text-[#E8745A]', border: 'border-[#E8745A]/50', bg: 'bg-[#1A2337]' },
                info:    { icon: 'ℹ', accent: 'text-[#7DCBE0]', border: 'border-[#7DCBE0]/50', bg: 'bg-[#1A2337]' },
                warning: { icon: '⚠', accent: 'text-[#E0B25A]', border: 'border-[#E0B25A]/50', bg: 'bg-[#1A2337]' }
        };
</script>

<div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] sm:w-96 pointer-events-none">
        {#each toasts as t (t.id)}
                <div
                        class="pointer-events-auto flex items-start gap-3 p-3 rounded-lg border shadow-xl backdrop-blur-sm {KIND_META[t.kind].bg} {KIND_META[t.kind].border}"
                        in:fly={{ x: 320, duration: 250, easing: cubicOut }}
                        out:fly={{ x: 320, duration: 200, easing: cubicOut }}
                >
                        <!-- Icon -->
                        <div class="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold {KIND_META[t.kind].accent} bg-[#0B1020]/60 border border-[#24314A]">
                                {KIND_META[t.kind].icon}
                        </div>

                        <!-- Content -->
                        <div class="flex-1 min-w-0">
                                <div class="text-sm font-bold {KIND_META[t.kind].accent} uppercase tracking-wider">
                                        {t.title}
                                </div>
                                {#if t.message}
                                        <div class="text-xs text-[#B8C1D3] mt-0.5 leading-relaxed break-words">
                                                {t.message}
                                        </div>
                                {/if}
                        </div>

                        <!-- Dismiss button -->
                        <button
                                onclick={() => dismiss(t.id)}
                                class="shrink-0 text-[#8E97AA] hover:text-[#F2E6D0] transition-colors -mr-1 -mt-1 p-1"
                                aria-label="Dismiss notification"
                        >
                                ✕
                        </button>
                </div>
        {/each}
</div>
