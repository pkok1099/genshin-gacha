<script lang="ts">
	import type { LuckStats as LuckStatsData } from '$lib/utils/luckScore';

	let { stats }: { stats: LuckStatsData } = $props();

	function scoreColor(score: number): string {
		if (score >= 90) return 'text-[#E6C77A]';
		if (score >= 75) return 'text-[#C9A45A]';
		if (score >= 60) return 'text-[#B495F0]';
		if (score >= 40) return 'text-[#B8C1D3]';
		if (score >= 25) return 'text-[#E8745A]';
		return 'text-[#E8745A]';
	}

	function scoreBarColor(score: number): string {
		if (score >= 75) return 'bg-gradient-to-r from-[#C9A45A] to-[#E6C77A]';
		if (score >= 60) return 'bg-gradient-to-r from-[#8D72C9] to-[#B495F0]';
		if (score >= 40) return 'bg-gradient-to-r from-[#5E90D6] to-[#7DCBE0]';
		return 'bg-gradient-to-r from-[#8B3A3A] to-[#E8745A]';
	}

	let winRatePercent = $derived(Math.round(stats.winRate5050 * 100));
</script>

<div class="bg-[#1A2337]/80 backdrop-blur-sm rounded-xl border border-[#C9A45A]/20 shadow-xl p-5 space-y-4">
	<h3 class="font-heading text-sm font-semibold text-[#F2E6D0] flex items-center gap-2 uppercase tracking-wider">
		<span class="text-[#E6C77A]">✦</span>
		Luck Analysis
	</h3>

	<!-- Score -->
	<div class="text-center py-2">
		<div class="text-[10px] text-[#8E97AA] uppercase tracking-wider mb-1">Luck Score</div>
		<div class="font-mono text-5xl font-bold tabular-nums {scoreColor(stats.luckScore)}">
			{stats.luckScore}
			<span class="text-xl text-[#8E97AA]">/100</span>
		</div>
		<div class="mt-1 font-heading text-base font-semibold {scoreColor(stats.luckScore)} tracking-wider uppercase">
			{stats.luckLabel}
		</div>
		<div class="mt-3 h-2 bg-[#0B1020] rounded-full overflow-hidden border border-[#24314A]">
			<div class="h-full {scoreBarColor(stats.luckScore)} rounded-full transition-all duration-500" style="width: {stats.luckScore}%"></div>
		</div>
	</div>

	<!-- Stat Grid -->
	<div class="grid grid-cols-2 gap-2 pt-2 border-t border-[#24314A]">
		<div class="p-2 rounded-md bg-[#0B1020]/60 border border-[#24314A] text-center">
			<div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">Total Wish</div>
			<div class="font-mono text-base font-bold text-[#F2E6D0] tabular-nums">{stats.totalWishes}</div>
		</div>
		<div class="p-2 rounded-md bg-[#0B1020]/60 border border-[#24314A] text-center">
			<div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">Actual 5★ Rate</div>
			<div class="font-mono text-base font-bold text-[#E6C77A] tabular-nums">{stats.actual5StarRate.toFixed(2)}%</div>
		</div>
		<div class="p-2 rounded-md bg-[#0B1020]/60 border border-[#24314A] text-center">
			<div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">Avg Pulls / 5★</div>
			<div class="font-mono text-base font-bold text-[#F2E6D0] tabular-nums">
				{stats.count5 > 0 ? stats.averagePityPer5Star.toFixed(1) : '—'}
			</div>
		</div>
		<div class="p-2 rounded-md bg-[#0B1020]/60 border border-[#24314A] text-center">
			<div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">50/50 Win Rate</div>
			<div class="font-mono text-base font-bold text-[#B495F0] tabular-nums">
				{stats.wins5050 + stats.losses5050 > 0 ? `${winRatePercent}%` : '—'}
			</div>
		</div>
	</div>

	<!-- Rarity Counts -->
	<div class="grid grid-cols-3 gap-2 pt-2 border-t border-[#24314A]">
		<div class="text-center p-2 rounded-md bg-[#C9A45A]/10 border border-[#C9A45A]/30">
			<div class="text-[9px] text-[#E6C77A] uppercase tracking-wider">★5</div>
			<div class="font-mono text-base font-bold text-[#E6C77A] tabular-nums">{stats.count5}</div>
		</div>
		<div class="text-center p-2 rounded-md bg-[#8D72C9]/10 border border-[#8D72C9]/30">
			<div class="text-[9px] text-[#B495F0] uppercase tracking-wider">★4</div>
			<div class="font-mono text-base font-bold text-[#B495F0] tabular-nums">{stats.count4}</div>
		</div>
		<div class="text-center p-2 rounded-md bg-[#5E90D6]/10 border border-[#5E90D6]/30">
			<div class="text-[9px] text-[#5E90D6] uppercase tracking-wider">★3</div>
			<div class="font-mono text-base font-bold text-[#5E90D6] tabular-nums">{stats.count3}</div>
		</div>
	</div>

	<!-- Best / Worst Pity -->
	<div class="grid grid-cols-2 gap-2 pt-2 border-t border-[#24314A]">
		<div class="text-center p-2 rounded-md bg-[#0B1020]/60 border border-[#24314A]">
			<div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">Best Pity</div>
			<div class="font-mono text-base font-bold text-[#E6C77A] tabular-nums">
				{stats.bestPity !== null ? `${stats.bestPity}★` : '—'}
			</div>
		</div>
		<div class="text-center p-2 rounded-md bg-[#0B1020]/60 border border-[#24314A]">
			<div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">Worst Pity</div>
			<div class="font-mono text-base font-bold text-[#E8745A] tabular-nums">
				{stats.worstPity !== null ? `${stats.worstPity}★` : '—'}
			</div>
		</div>
	</div>

	<!-- 50/50 Record -->
	<div class="pt-2 border-t border-[#24314A]">
		<div class="text-[9px] text-[#8E97AA] uppercase tracking-wider mb-1.5">50/50 Record</div>
		<div class="flex gap-2">
			<div class="flex-1 text-center p-2 rounded-md bg-[#C9A45A]/10 border border-[#C9A45A]/30">
				<div class="text-[9px] text-[#E6C77A] uppercase">Win</div>
				<div class="font-mono text-base font-bold text-[#E6C77A] tabular-nums">{stats.wins5050}</div>
			</div>
			<div class="flex-1 text-center p-2 rounded-md bg-[#8B3A3A]/15 border border-[#8B3A3A]/40">
				<div class="text-[9px] text-[#E8745A] uppercase">Lose</div>
				<div class="font-mono text-base font-bold text-[#E8745A] tabular-nums">{stats.losses5050}</div>
			</div>
		</div>
	</div>
</div>
