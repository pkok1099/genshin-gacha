<script lang="ts">
	let { disabled = false, onSinglePull, onTenPull }: { disabled?: boolean; onSinglePull: () => void; onTenPull: () => void } = $props();
</script>

<div class="grid grid-cols-2 gap-3">
	<button
		onclick={onSinglePull}
		{disabled}
		class="relative group bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-400 font-bold py-4 px-4 rounded-xl border border-amber-500/30 transition-all text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
	>
		<div class="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 group-hover:via-amber-500/10 transition-all"></div>
		<span class="relative z-10">✨ 1x Wish</span>
		<span class="relative z-10 text-[10px] text-slate-500 font-mono">160 Primogem</span>
	</button>
	<button
		onclick={onTenPull}
		{disabled}
		class="relative group bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 active:scale-95 text-white font-bold py-4 px-4 rounded-xl transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
	>
		<div class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-all"></div>
		<span class="relative z-10">🌟 10x Wish</span>
		<span class="relative z-10 text-[10px] text-white/60 font-mono">1600 Primogem</span>
	</button>
</div>
