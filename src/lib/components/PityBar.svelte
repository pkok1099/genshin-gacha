<script lang="ts">
	let {
		pity5,
		pity4,
		guaranteed5,
		guaranteed4
	}: {
		pity5: number;
		pity4: number;
		guaranteed5: boolean;
		guaranteed4: boolean;
	} = $props();

	let pity5Percent = $derived(Math.min((pity5 / 90) * 100, 100));
	let pity4Percent = $derived(Math.min((pity4 / 10) * 100, 100));

	// 5★ bar color shifts to red as you approach soft pity
	let pity5BarColor = $derived(
		pity5 >= 73 ? 'bg-gradient-to-r from-[#E8745A] to-[#FF8B5A]'
		: pity5 >= 60 ? 'bg-gradient-to-r from-[#E0B25A] to-[#E6C77A]'
		: 'bg-gradient-to-r from-[#C9A45A] to-[#E6C77A]'
	);

	let inSoftPity = $derived(pity5 >= 73);
	let nearSoftPity = $derived(pity5 >= 60 && pity5 < 73);
</script>

<div class="bg-[#1A2337]/80 backdrop-blur-sm p-5 rounded-xl border border-[#C9A45A]/20 shadow-xl space-y-4">
	<h3 class="font-heading text-sm font-semibold text-[#F2E6D0] flex items-center gap-2 uppercase tracking-wider">
		<span class="text-[#E6C77A]">✦</span>
		Pity Counter
	</h3>

	<!-- 5★ Pity -->
	<div>
		<div class="flex justify-between items-center mb-1.5">
			<span class="text-xs font-bold text-[#E6C77A]">Pity 5★</span>
			<span class="text-xs font-mono font-bold tabular-nums {inSoftPity ? 'text-[#E8745A] animate-pulse' : 'text-[#F2E6D0]'}">
				{pity5} / 90
			</span>
		</div>
		<div class="h-2 bg-[#0B1020] rounded-full overflow-hidden border border-[#24314A]">
			<div class="h-full {pity5BarColor} rounded-full transition-all duration-500" style="width: {pity5Percent}%"></div>
		</div>
		{#if inSoftPity}
			<div class="text-[10px] text-[#E8745A] mt-1 font-bold uppercase tracking-wider">
				⚠ Soft Pity Aktif!
			</div>
		{:else if nearSoftPity}
			<div class="text-[10px] text-[#E0B25A] mt-1">Mendekati soft pity…</div>
		{/if}
	</div>

	<!-- 4★ Pity -->
	<div>
		<div class="flex justify-between items-center mb-1.5">
			<span class="text-xs font-bold text-[#B495F0]">Pity 4★</span>
			<span class="text-xs font-mono font-bold tabular-nums text-[#F2E6D0]">{pity4} / 10</span>
		</div>
		<div class="h-2 bg-[#0B1020] rounded-full overflow-hidden border border-[#24314A]">
			<div class="h-full bg-gradient-to-r from-[#8D72C9] to-[#B495F0] rounded-full transition-all duration-500" style="width: {pity4Percent}%"></div>
		</div>
	</div>

	<!-- Guaranteed Status -->
	<div class="grid grid-cols-2 gap-2 pt-2 border-t border-[#24314A]">
		<div class="text-center p-2 rounded-md bg-[#0B1020]/60 border border-[#24314A]">
			<div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">5★ Garansi</div>
			<div class="text-sm font-bold mt-0.5 {guaranteed5 ? 'text-[#E6C77A]' : 'text-[#5E6478]'}">
				{guaranteed5 ? 'YA' : 'Tidak'}
			</div>
		</div>
		<div class="text-center p-2 rounded-md bg-[#0B1020]/60 border border-[#24314A]">
			<div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">4★ Garansi</div>
			<div class="text-sm font-bold mt-0.5 {guaranteed4 ? 'text-[#B495F0]' : 'text-[#5E6478]'}">
				{guaranteed4 ? 'YA' : 'Tidak'}
			</div>
		</div>
	</div>

	<!-- Hint -->
	<div class="text-[10px] text-[#8E97AA] pt-2 border-t border-[#24314A] leading-relaxed">
		{#if guaranteed5}
			★ 5★ berikutnya <span class="text-[#E6C77A] font-semibold">dijamin featured</span> (karena kalah 50/50 sebelumnya).
		{:else}
			★ 5★ berikutnya akan menjalani <span class="text-[#B495F0]">50/50</span> antara featured & standard.
		{/if}
	</div>
</div>
