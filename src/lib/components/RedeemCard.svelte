<script lang="ts">
        import ThemedModal from './ThemedModal.svelte';
        import type { RedeemCode } from '$lib/services/redeemApi';
        import { buildRedeemUrl, extractPrimogemAmount } from '$lib/services/redeemApi';

        let {
                code,
                onRedeem
        }: {
                code: RedeemCode;
                onRedeem?: (code: RedeemCode, primoAmount: number) => void;
        } = $props();

        let copied = $state(false);
        let showConfirm = $state(false);

        let primoAmount = $derived(extractPrimogemAmount(code.rewards));

        async function copyCode() {
                try {
                        await navigator.clipboard.writeText(code.code);
                        copied = true;
                        setTimeout(() => { copied = false; }, 1500);
                } catch {
                        // Fallback for older browsers
                        const ta = document.createElement('textarea');
                        ta.value = code.code;
                        document.body.appendChild(ta);
                        ta.select();
                        try { document.execCommand('copy'); copied = true; setTimeout(() => { copied = false; }, 1500); }
                        catch { /* ignore */ }
                        document.body.removeChild(ta);
                }
        }

        function openRedeemUrl() {
                window.open(buildRedeemUrl(code.code), '_blank', 'noopener,noreferrer');
        }

        function handleRedeemClick() {
                if (primoAmount > 0) {
                        showConfirm = true;
                } else {
                        openRedeemUrl();
                }
        }

        function confirmRedeem() {
                showConfirm = false;
                onRedeem?.(code, primoAmount);
                openRedeemUrl();
        }
</script>

<div
        class="rounded-lg border {code.isExpired ? 'border-[#5E6478]/40 opacity-60' : 'border-[#C9A45A]/30 hover:border-[#E6C77A]/60'} bg-gradient-to-br from-[#1A2337] to-[#0B1020] p-4 transition-all"
>
        <div class="flex items-start justify-between gap-3 mb-3">
                <div class="min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                                <span class="font-mono text-sm font-bold text-[#E6C77A] truncate">{code.code}</span>
                                {#if code.isExpired}
                                        <span class="text-[9px] px-1.5 py-0.5 rounded bg-[#8B3A3A]/30 text-[#E8745A] border border-[#8B3A3A]/40 uppercase tracking-wider">Expired</span>
                                {:else}
                                        <span class="text-[9px] px-1.5 py-0.5 rounded bg-[#6FAF6E]/20 text-[#6FAF6E] border border-[#6FAF6E]/40 uppercase tracking-wider">Active</span>
                                {/if}
                        </div>
                        {#if code.description}
                                <p class="text-[11px] text-[#8E97AA] line-clamp-2">{code.description}</p>
                        {/if}
                </div>
                {#if primoAmount > 0}
                        <div class="shrink-0 text-right">
                                <div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">Primo</div>
                                <div class="font-mono text-base font-bold text-[#E6C77A] tabular-nums">+{primoAmount}</div>
                        </div>
                {/if}
        </div>

        <!-- Rewards list -->
        {#if code.rewards.length > 0}
                <div class="flex flex-wrap gap-1.5 mb-3">
                        {#each code.rewards as reward}
                                <span class="text-[10px] px-2 py-0.5 rounded bg-[#24314A]/60 text-[#B8C1D3] border border-[#24314A]">
                                        {#if reward.quantity > 0}{reward.quantity}× {/if}{reward.name}
                                </span>
                        {/each}
                </div>
        {/if}

        <!-- Actions -->
        <div class="flex gap-2">
                <button
                        onclick={copyCode}
                        class="flex-1 px-3 py-2 rounded-md border border-[#24314A] bg-[#0B1020]/60 hover:bg-[#24314A] text-[#B8C1D3] hover:text-[#F2E6D0] text-xs font-medium transition-all flex items-center justify-center gap-1.5"
                >
                        {#if copied}
                                <svg class="w-3.5 h-3.5 text-[#6FAF6E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                <span class="text-[#6FAF6E]">Copied!</span>
                        {:else}
                                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Copy
                        {/if}
                </button>
                <button
                        onclick={handleRedeemClick}
                        disabled={code.isExpired}
                        class="flex-1 px-3 py-2 rounded-md border border-[#C9A45A]/40 bg-gradient-to-r from-[#24314A] to-[#1A2337] hover:from-[#2A3856] hover:to-[#24314A] text-[#E6C77A] text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Redeem
                </button>
        </div>
</div>

<!-- Confirmation modal -->
<ThemedModal open={showConfirm} title="Konfirmasi Redeem" onClose={() => showConfirm = false}>
        <div class="text-center mb-4">
                <div class="inline-flex w-12 h-12 items-center justify-center rounded-full bg-gradient-to-br from-[#E6C77A] to-[#C9A45A] text-[#0B1020] text-xl font-bold mb-3 shadow-lg">
                        ★
                </div>
                <p class="text-sm text-[#B8C1D3] mt-2">
                        Kamu akan menerima <span class="font-bold text-[#E6C77A]">{primoAmount} Primogem</span> dari kode
                        <span class="font-mono text-[#E6C77A]">{code.code}</span>.
                </p>
                <p class="text-[11px] text-[#8E97AA] mt-2">
                        (Kode akan dibuka di tab baru — simulasi ini menambah primo otomatis.)
                </p>
        </div>
        <div class="flex gap-2">
                <button
                        onclick={() => showConfirm = false}
                        class="flex-1 px-3 py-2 rounded-md border border-[#24314A] bg-[#0B1020]/60 text-[#8E97AA] hover:text-[#B8C1D3] text-sm transition-colors"
                >
                        Batal
                </button>
                <button
                        onclick={confirmRedeem}
                        class="flex-1 px-3 py-2 rounded-md border border-[#C9A45A]/50 bg-gradient-to-r from-[#C9A45A] to-[#E6C77A] text-[#0B1020] text-sm font-bold transition-all hover:shadow-[0_0_20px_rgba(230,199,122,0.45)]"
                >
                        Klaim {primoAmount} Primo
                </button>
        </div>
</ThemedModal>
