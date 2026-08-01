<script lang="ts">
        import { fly } from 'svelte/transition';
        import { cubicOut } from 'svelte/easing';
        import { clickOutside } from '$lib/actions/clickOutside';
        import { t, localeKey } from '$lib/i18n/index.svelte';

        // Re-render on locale change
        void localeKey();

        interface Option {
                value: string;
                label: string;
        }

        let {
                value = '',
                options,
                label,
                id,
                placeholder,
                disabled = false,
                onchange
        }: {
                value?: string;
                options: Option[];
                label?: string;
                id?: string;
                placeholder?: string;
                disabled?: boolean;
                onchange?: (value: string) => void;
        } = $props();

        // i18n placeholder — falls back to 'Pilih…' (ID) if no prop given.
        const effectivePlaceholder = $derived(placeholder ?? t('common.select-placeholder'));

        let isOpen = $state(false);
        let highlightedIndex = $state(-1);
        let triggerEl: HTMLButtonElement | null = $state(null);
        let listboxEl: HTMLDivElement | null = $state(null);

        let selectedOption = $derived(options.find((o) => o.value === value));

        function open() {
                if (disabled) return;
                isOpen = true;
                // Start highlight on the currently-selected option (or 0 if none).
                highlightedIndex = options.findIndex((o) => o.value === value);
                if (highlightedIndex < 0) highlightedIndex = 0;
        }

        function close() {
                isOpen = false;
                highlightedIndex = -1;
        }

        function toggle() {
                if (isOpen) close();
                else open();
        }

        function selectOption(optValue: string) {
                close();
                onchange?.(optValue);
                // Restore focus to the trigger after selection.
                triggerEl?.focus();
        }

        function selectHighlighted() {
                if (highlightedIndex >= 0 && highlightedIndex < options.length) {
                        selectOption(options[highlightedIndex]!.value);
                }
        }

        function highlightPrev() {
                highlightedIndex = highlightedIndex <= 0 ? options.length - 1 : highlightedIndex - 1;
                scrollHighlightedIntoView();
        }

        function highlightNext() {
                highlightedIndex = highlightedIndex >= options.length - 1 ? 0 : highlightedIndex + 1;
                scrollHighlightedIntoView();
        }

        function highlightFirst() {
                highlightedIndex = 0;
                scrollHighlightedIntoView();
        }

        function highlightLast() {
                highlightedIndex = options.length - 1;
                scrollHighlightedIntoView();
        }

        function scrollHighlightedIntoView() {
                // Defer to next frame so the highlight class is applied first.
                requestAnimationFrame(() => {
                        if (!listboxEl) return;
                        const highlighted = listboxEl.children[highlightedIndex] as HTMLElement | undefined;
                        highlighted?.scrollIntoView({ block: 'nearest' });
                });
        }

        function handleTriggerKeydown(e: KeyboardEvent) {
                if (disabled) return;
                switch (e.key) {
                        case 'Enter':
                        case ' ':
                        case 'ArrowDown':
                        case 'ArrowUp':
                                e.preventDefault();
                                if (!isOpen) open();
                                break;
                }
        }

        function handleListboxKeydown(e: KeyboardEvent) {
                switch (e.key) {
                        case 'ArrowDown':
                                e.preventDefault();
                                highlightNext();
                                break;
                        case 'ArrowUp':
                                e.preventDefault();
                                highlightPrev();
                                break;
                        case 'Home':
                                e.preventDefault();
                                highlightFirst();
                                break;
                        case 'End':
                                e.preventDefault();
                                highlightLast();
                                break;
                        case 'Enter':
                        case ' ':
                                e.preventDefault();
                                selectHighlighted();
                                break;
                        case 'Escape':
                                e.preventDefault();
                                close();
                                triggerEl?.focus();
                                break;
                        case 'Tab':
                                close();
                                break;
                }
        }
</script>

<div class="relative" use:clickOutside={() => close()}>
        {#if label}
                <label for={id} class="block text-xs font-bold text-[#E6C77A] uppercase tracking-wider mb-1.5">{label}</label>
        {/if}

        <!-- Trigger button -->
        <button
                type="button"
                {id}
                {disabled}
                bind:this={triggerEl}
                onclick={toggle}
                onkeydown={handleTriggerKeydown}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={isOpen && id ? `${id}-listbox` : undefined}
                class="btn-press w-full flex items-center justify-between px-3 py-2.5 rounded-md bg-[#0B1020] border border-[#24314A] text-[#F2E6D0] text-sm transition-all focus:outline-none focus:border-[#C9A45A]/60 focus:ring-1 focus:ring-[#C9A45A]/40 hover:border-[#C9A45A]/40 disabled:opacity-50 disabled:cursor-not-allowed"
        >
                <span class="{selectedOption ? 'text-[#F2E6D0]' : 'text-[#5E6478]'} truncate">
                        {selectedOption?.label ?? effectivePlaceholder}
                </span>
                <svg class="w-4 h-4 text-[#8E97AA] transition-transform shrink-0 ml-2 {isOpen ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
        </button>

        {#if isOpen}
                <!-- Options dropdown — role="listbox" with keyboard navigation.
                     Arrow Up/Down move highlight, Home/End jump to first/last,
                     Enter/Space selects, Escape closes and restores focus to trigger. -->
                <div
                        bind:this={listboxEl}
                        role="listbox"
                        id={id ? `${id}-listbox` : undefined}
                        tabindex="-1"
                        onkeydown={handleListboxKeydown}
                        class="absolute z-50 mt-1 w-full rounded-md border border-[#C9A45A]/30 bg-[#141C2F] shadow-xl overflow-hidden max-h-60 overflow-y-auto"
                        transition:fly={{ y: -8, duration: 180, easing: cubicOut }}
                >
                        {#each options as opt, i}
                                <button
                                        type="button"
                                        role="option"
                                        tabindex="-1"
                                        aria-selected={opt.value === value ? 'true' : 'false'}
                                        onclick={() => selectOption(opt.value)}
                                        onmouseenter={() => highlightedIndex = i}
                                        class="w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center justify-between cursor-pointer {opt.value === value ? 'bg-[#C9A45A]/15 text-[#E6C77A]' : 'text-[#B8C1D3] hover:bg-[#24314A] hover:text-[#F2E6D0]'} {i === highlightedIndex && opt.value !== value ? 'bg-[#24314A] text-[#F2E6D0]' : ''}"
                                >
                                        <span class="truncate">{opt.label}</span>
                                        {#if opt.value === value}
                                                <svg class="w-4 h-4 text-[#E6C77A] shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                        {/if}
                                </button>
                        {/each}
                </div>
        {/if}
</div>
