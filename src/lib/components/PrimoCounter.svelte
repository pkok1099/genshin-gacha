<script lang="ts">
        import { fly, fade } from 'svelte/transition';
        import { cubicOut } from 'svelte/easing';

        let { amount, onTopUp }: {
                amount: number;
                onTopUp?: (amount: number) => void;
        } = $props();

        const TOP_UP_OPTIONS: { label: string; amount: number }[] = [
                { label: '+1,600',  amount: 1600 },
                { label: '+8,000',  amount: 8000 },
                { label: '+16,000', amount: 16000 }
        ];

        let showMenu = $state(false);

        function handleTopUp(amt: number) {
                onTopUp?.(amt);
                showMenu = false;
        }
</script>

<div class="relative">
        <!-- Primo pill -->
        <button
                class="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#C9A45A]/40 bg-gradient-to-r from-[#1A2337] to-[#24314A] hover:from-[#24314A] hover:to-[#2A3856] transition-all shadow-sm"
                onclick={() => showMenu = !showMenu}
                aria-label="Primogem balance"
        >
                <!-- Primo icon (CSS) -->
                <span class="inline-flex w-5 h-5 items-center justify-center rounded-full bg-gradient-to-br from-[#E6C77A] to-[#C9A45A] text-[#0B1020] text-[10px] font-bold shadow-inner">
                        ★
                </span>
                <span class="font-mono text-sm font-semibold text-[#F2E6D0] tabular-nums">
                        {amount.toLocaleString('en-US')}
                </span>
                <span class="text-[10px] text-[#8E97AA] uppercase tracking-wider hidden sm:inline">Primo</span>
                <svg class="w-3 h-3 text-[#8E97AA] transition-transform {showMenu ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
        </button>

        <!-- Top-up menu -->
        {#if showMenu}
                <!-- Click-outside catcher -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <div
                        class="fixed inset-0 z-40"
                        onclick={() => showMenu = false}
                        transition:fade={{ duration: 100 }}
                ></div>

                <div
                        class="absolute right-0 top-full mt-2 z-50 w-44 rounded-lg border border-[#C9A45A]/30 bg-[#141C2F] shadow-xl overflow-hidden"
                        transition:fly={{ y: -6, duration: 150, easing: cubicOut }}
                >
                        <div class="px-3 py-2 text-[10px] uppercase tracking-wider text-[#8E97AA] border-b border-[#24314A]">
                                Simulation Top-Up
                        </div>
                        {#each TOP_UP_OPTIONS as opt}
                                <button
                                        class="w-full text-left px-3 py-2 hover:bg-[#24314A] transition-colors flex items-center justify-between text-sm"
                                        onclick={() => handleTopUp(opt.amount)}
                                >
                                        <span class="text-[#F2E6D0]">{opt.label}</span>
                                        <span class="text-[10px] text-[#8E97AA]">Primo</span>
                                </button>
                        {/each}
                </div>
        {/if}
</div>
