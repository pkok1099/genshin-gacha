<script lang="ts">
	let {
		value = '',
		label,
		id,
		placeholder = '',
		type = 'text',
		inputmode,
		pattern,
		min,
		max,
		step,
		prefix,
		suffix,
		disabled = false,
		oninput,
		onchange,
		onkeydown
	}: {
		value?: string;
		label?: string;
		id?: string;
		placeholder?: string;
		type?: 'text' | 'number' | 'password';
		inputmode?: 'numeric' | 'decimal' | 'text';
		pattern?: string;
		min?: number;
		max?: number;
		step?: number;
		prefix?: string;
		suffix?: string;
		disabled?: boolean;
		oninput?: (e: Event) => void;
		onchange?: (e: Event) => void;
		onkeydown?: (e: KeyboardEvent) => void;
	} = $props();
</script>

<div class="space-y-1.5">
	{#if label}
		<label for={id} class="block text-xs font-bold text-[#E6C77A] uppercase tracking-wider">{label}</label>
	{/if}

	<div class="relative">
		{#if prefix}
			<span class="absolute left-3 top-1/2 -translate-y-1/2 text-[#E6C77A] text-sm font-bold pointer-events-none">{prefix}</span>
		{/if}

		<input
			{id}
			{type}
			{inputmode}
			{pattern}
			{min}
			{max}
			{step}
			{placeholder}
			{disabled}
			{value}
			{oninput}
			{onchange}
			{onkeydown}
			class="w-full {prefix ? 'pl-8' : 'pl-3'} {suffix ? 'pr-12' : 'pr-3'} py-2.5 rounded-md bg-[#0B1020] border border-[#24314A] text-[#F2E6D0] font-mono text-sm placeholder-[#5E6478] transition-all focus:outline-none focus:border-[#C9A45A]/60 focus:ring-1 focus:ring-[#C9A45A]/40 hover:border-[#C9A45A]/30 disabled:opacity-50 disabled:cursor-not-allowed"
		/>

		{#if suffix}
			<span class="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E97AA] text-[10px] font-mono uppercase tracking-wider pointer-events-none">{suffix}</span>
		{/if}
	</div>
</div>
