<script lang="ts">
	import type { GachaState } from '$lib/utils/gachaEngine';

	let { state }: { state: GachaState } = $props();

	let pity5Percent: number = $derived(Math.min((state.pity5 / 90) * 100, 100));
	let pity4Percent: number = $derived(Math.min((state.pity4 / 10) * 100, 100));

	let pity5Color: string = $derived(
		state.pity5 >= 73 ? 'bg-rose-500' : state.pity5 >= 60 ? 'bg-amber-500' : 'bg-emerald-500'
	);

	let pity5BarColor: string = $derived(
		state.pity5 >= 73 ? 'bg-rose-500/30' : state.pity5 >= 60 ? 'bg-amber-500/30' : 'bg-emerald-500/30'
	);
</script>

<div class="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
	<h3 class="text-sm font-bold text-slate-200 flex items-center gap-2">
		<svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2L12.5 7.5H18L13.75 11L15.5 17L10 13.5L4.5 17L6.25 11L2 7.5H7.5L10 2Z"></path></svg>
		Pity Counter
	</h3>

	<!-- 5★ Pity -->
	<div>
		<div class="flex justify-between items-center mb-1.5">
			<span class="text-xs text-amber-400 font-bold">Pity 5★</span>
			<span class="text-xs font-mono {state.pity5 >= 73 ? 'text-rose-400 font-extrabold animate-pulse' : 'text-amber-300'} font-bold">
				{state.pity5} / 90
			</span>
		</div>
		<div class="h-2.5 bg-slate-800 rounded-full overflow-hidden">
			<div class="h-full {pity5Color} rounded-full transition-all duration-300" style="width: {pity5Percent}%"></div>
		</div>
		{#if state.pity5 >= 73}
			<div class="text-[9px] text-rose-400 mt-1 font-bold">⚠️ SOFT PITY AKTIF!</div>
		{:else if state.pity5 >= 60}
			<div class="text-[9px] text-amber-400/60 mt-1">Mendekati soft pity...</div>
		{/if}
	</div>

	<!-- 4★ Pity -->
	<div>
		<div class="flex justify-between items-center mb-1.5">
			<span class="text-xs text-purple-400 font-bold">Pity 4★</span>
			<span class="text-xs font-mono text-purple-300 font-bold">{state.pity4} / 10</span>
		</div>
		<div class="h-2.5 bg-slate-800 rounded-full overflow-hidden">
			<div class="h-full bg-purple-500 rounded-full transition-all duration-300" style="width: {pity4Percent}%"></div>
		</div>
	</div>

	<!-- Guaranteed Status -->
	<div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
		<div class="text-center p-2 rounded-lg bg-slate-950/60 border border-slate-700/50">
			<div class="text-[9px] text-slate-500 uppercase tracking-wider">5★ Guaranteed</div>
			<div class="text-lg font-bold {state.guaranteed5 ? 'text-amber-400' : 'text-slate-600'}">
				{state.guaranteed5 ? '✅' : '❌'}
			</div>
		</div>
		<div class="text-center p-2 rounded-lg bg-slate-950/60 border border-slate-700/50">
			<div class="text-[9px] text-slate-500 uppercase tracking-wider">4★ Guaranteed</div>
			<div class="text-lg font-bold {state.guaranteed4 ? 'text-purple-400' : 'text-slate-600'}">
				{state.guaranteed4 ? '✅' : '❌'}
			</div>
		</div>
	</div>

	<!-- Total Pulls -->
	<div class="text-center pt-2 border-t border-slate-800">
		<span class="text-[10px] text-slate-500">Total Pulls: </span>
		<span class="text-sm font-mono font-bold text-amber-300">{state.totalPulls.toLocaleString()}</span>
		<span class="text-[10px] text-slate-500 ml-1">({(state.totalPulls * 160).toLocaleString()} Primo)</span>
	</div>
</div>
