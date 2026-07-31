<script lang="ts">
	let {
		value = 0,
		min = 0,
		max = 100,
		step = 1,
		label,
		id,
		suffix,
		accent = 'gold',
		oninput,
		onchange
	}: {
		value?: number;
		min?: number;
		max?: number;
		step?: number;
		label?: string;
		id?: string;
		suffix?: string;
		accent?: 'gold' | 'purple' | 'blue' | 'red';
		oninput?: (e: Event) => void;
		onchange?: (e: Event) => void;
	} = $props();

	function handleInput(e: Event) {
		const target = e.currentTarget as HTMLInputElement;
		oninput?.(e);
		// Return new value via event target — parent should update value prop
		void target;
	}

	let percent = $derived(((value - min) / (max - min)) * 100);

	const accentClass = $derived(
		accent === 'purple' ? 'accent-[#8D72C9]'
		: accent === 'blue' ? 'accent-[#5E90D6]'
		: accent === 'red' ? 'accent-[#E8745A]'
		: 'accent-[#C9A45A]'
	);

	const barClass = $derived(
		accent === 'purple' ? 'from-[#8D72C9] to-[#B495F0]'
		: accent === 'blue' ? 'from-[#5E90D6] to-[#7DCBE0]'
		: accent === 'red' ? 'from-[#8B3A3A] to-[#E8745A]'
		: 'from-[#C9A45A] to-[#E6C77A]'
	);
</script>

<div class="space-y-2">
	{#if label}
		<div class="flex justify-between items-center">
			<label for={id} class="text-xs font-bold text-[#E6C77A] uppercase tracking-wider">{label}</label>
			<span class="text-xs font-mono text-[#F2E6D0] tabular-nums">
				{value}{suffix ? ` ${suffix}` : ''}
			</span>
		</div>
	{/if}

	<input
		{id}
		type="range"
		{min}
		{max}
		{step}
		{value}
		oninput={handleInput}
		{onchange}
		class="w-full {accentClass} cursor-pointer"
	/>

	<!-- Progress bar visualization -->
	<div class="h-1.5 bg-[#0B1020] rounded-full overflow-hidden border border-[#24314A]">
		<div
			class="h-full bg-gradient-to-r {barClass} rounded-full transition-all duration-150"
			style="width: {percent}%"
		></div>
	</div>
</div>
