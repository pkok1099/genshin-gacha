<script lang="ts">
        import { fade, fly } from 'svelte/transition';
        import { cubicOut } from 'svelte/easing';

        let {
                open = false,
                title,
                onClose,
                children,
                size = 'md'
        }: {
                open?: boolean;
                title?: string;
                onClose?: () => void;
                children?: import('svelte').Snippet;
                size?: 'sm' | 'md' | 'lg';
        } = $props();

        const sizeClass = $derived(
                size === 'sm' ? 'max-w-xs'
                : size === 'lg' ? 'max-w-md'
                : 'max-w-sm'
        );

        function handleKeydown(e: KeyboardEvent) {
                if (e.key === 'Escape' && open) onClose?.();
        }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
                class="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1020]/90 backdrop-blur-sm p-4"
                onclick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
                transition:fade={{ duration: 150 }}
        >
                <div
                        class="w-full {sizeClass} rounded-xl border border-[#C9A45A]/40 bg-gradient-to-br from-[#1A2337] to-[#0B1020] shadow-2xl overflow-hidden"
                        transition:fly={{ y: 20, duration: 200, easing: cubicOut }}
                >
                        <!-- Header -->
                        {#if title}
                                <div class="flex items-center justify-between px-5 py-3 border-b border-[#24314A]">
                                        <h3 class="font-heading text-base font-semibold text-[#F2E6D0]">{title}</h3>
                                        <button
                                                onclick={onClose}
                                                class="text-[#8E97AA] hover:text-[#F2E6D0] transition-colors p-1 rounded"
                                                aria-label="Close"
                                        >
                                                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                        </button>
                                </div>
                        {/if}

                        <!-- Body -->
                        <div class="p-5">
                                {@render children?.()}
                        </div>
                </div>
        </div>
{/if}
