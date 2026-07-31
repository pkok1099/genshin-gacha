<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	interface Option {
		value: string;
		label: string;
	}

	let {
		value = '',
		options,
		label,
		id,
		placeholder = 'Pilih…',
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

	let isOpen = $state(false);

	let selectedOption = $derived(options.find((o) => o.value === value));

	function selectOption(optValue: string) {
		isOpen = false;
		onchange?.(optValue);
	}

	function toggle() {
		if (!disabled) isOpen = !isOpen;
	}
</script>

<div class="relative">
	{#if label}
		<label for={id} class="block text-xs font-bold text-[#E6C77A] uppercase tracking-wider mb-1.5">{label}</label>
	{/if}

	<!-- Trigger button -->
	<button
		type="button"
		{id}
		{disabled}
		onclick={toggle}
		class="w-full flex items-center justify-between px-3 py-2.5 rounded-md bg-[#0B1020] border border-[#24314A] text-[#F2E6D0] text-sm transition-all focus:outline-none focus:border-[#C9A45A]/60 focus:ring-1 focus:ring-[#C9A45A]/40 hover:border-[#C9A45A]/40 disabled:opacity-50 disabled:cursor-not-allowed"
	>
		<span class="{selectedOption ? 'text-[#F2E6D0]' : 'text-[#5E6478]'} truncate">
			{selectedOption?.label ?? placeholder}
		</span>
		<svg class="w-4 h-4 text-[#8E97AA] transition-transform shrink-0 ml-2 {isOpen ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	{#if isOpen}
		<!-- Backdrop -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="fixed inset-0 z-40"
			onclick={() => isOpen = false}
			transition:fade={{ duration: 100 }}
		></div>

		<!-- Options dropdown -->
		<div
			class="absolute z-50 mt-1 w-full rounded-md border border-[#C9A45A]/30 bg-[#141C2F] shadow-xl overflow-hidden max-h-60 overflow-y-auto"
			transition:fly={{ y: -6, duration: 150, easing: cubicOut }}
		>
			{#each options as opt}
				<button
					type="button"
					onclick={() => selectOption(opt.value)}
					class="w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center justify-between {opt.value === value ? 'bg-[#C9A45A]/15 text-[#E6C77A]' : 'text-[#B8C1D3] hover:bg-[#24314A] hover:text-[#F2E6D0]'}"
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
