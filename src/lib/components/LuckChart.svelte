<script lang="ts">
        import { onMount, onDestroy } from 'svelte';
        import {
                Chart,
                BarController,
                BarElement,
                CategoryScale,
                LinearScale,
                Tooltip,
                Legend,
                PieController,
                ArcElement,
                type ChartConfiguration
        } from 'chart.js';
        import type { WishResult } from '$lib/stores/gameState.svelte';
        import type { LuckStats } from '$lib/utils/luckScore';

        Chart.register(
                BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend,
                PieController, ArcElement
        );

        let {
                history,
                stats
        }: {
                history: WishResult[];
                stats: LuckStats;
        } = $props();

        let pityCanvas: HTMLCanvasElement | undefined = $state();
        let rarityCanvas: HTMLCanvasElement | undefined = $state();

        let pityChart: Chart | null = null;
        let rarityChart: Chart | null = null;

        const PITY_BUCKETS = [
                { label: '1-10',  min: 1,  max: 10 },
                { label: '11-20', min: 11, max: 20 },
                { label: '21-30', min: 21, max: 30 },
                { label: '31-40', min: 31, max: 40 },
                { label: '41-50', min: 41, max: 50 },
                { label: '51-60', min: 51, max: 60 },
                { label: '61-70', min: 61, max: 70 },
                { label: '71-75', min: 71, max: 75 },
                { label: '76-80', min: 76, max: 80 },
                { label: '81-90', min: 81, max: 90 }
        ];

        function buildPityData() {
                const fiveStars = history.filter((h) => h.rarity === 5);
                const buckets = PITY_BUCKETS.map((b) => ({
                        ...b,
                        count: fiveStars.filter((s) => s.pityCount >= b.min && s.pityCount <= b.max).length
                }));
                return buckets;
        }

        function buildRarityData() {
                return [
                        { label: '5★', count: stats.count5, color: '#E6C77A' },
                        { label: '4★', count: stats.count4, color: '#B495F0' },
                        { label: '3★', count: stats.count3, color: '#5E90D6' }
                ];
        }

        function renderCharts() {
                if (!pityCanvas || !rarityCanvas) return;

                // Tear down previous instances
                pityChart?.destroy();
                rarityChart?.destroy();

                const pityData = buildPityData();
                const rarityData = buildRarityData();

                const pityConfig: ChartConfiguration<'bar'> = {
                        type: 'bar',
                        data: {
                                labels: pityData.map((b) => b.label),
                                datasets: [{
                                        label: '5★ Count',
                                        data: pityData.map((b) => b.count),
                                        backgroundColor: 'rgba(230, 199, 122, 0.65)',
                                        borderColor: 'rgba(230, 199, 122, 0.9)',
                                        borderWidth: 1,
                                        borderRadius: 4,
                                        hoverBackgroundColor: 'rgba(230, 199, 122, 0.9)'
                                }]
                        },
                        options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                        legend: { display: false },
                                        tooltip: {
                                                backgroundColor: '#0B1020',
                                                borderColor: '#C9A45A',
                                                borderWidth: 1,
                                                titleColor: '#F2E6D0',
                                                bodyColor: '#B8C1D3'
                                        }
                                },
                                scales: {
                                        x: {
                                                ticks: { color: '#8E97AA', font: { size: 10, family: 'JetBrains Mono' } },
                                                grid: { color: 'rgba(36, 49, 74, 0.4)' }
                                        },
                                        y: {
                                                beginAtZero: true,
                                                ticks: { color: '#8E97AA', font: { size: 10, family: 'JetBrains Mono' }, precision: 0 },
                                                grid: { color: 'rgba(36, 49, 74, 0.4)' }
                                        }
                                }
                        }
                };

                const rarityConfig: ChartConfiguration<'pie'> = {
                        type: 'pie',
                        data: {
                                labels: rarityData.map((d) => d.label),
                                datasets: [{
                                        data: rarityData.map((d) => d.count),
                                        backgroundColor: rarityData.map((d) => d.color),
                                        borderColor: '#0B1020',
                                        borderWidth: 2
                                }]
                        },
                        options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                        legend: {
                                                position: 'bottom',
                                                labels: { color: '#B8C1D3', font: { size: 11, family: 'Inter' }, padding: 10 }
                                        },
                                        tooltip: {
                                                backgroundColor: '#0B1020',
                                                borderColor: '#C9A45A',
                                                borderWidth: 1,
                                                titleColor: '#F2E6D0',
                                                bodyColor: '#B8C1D3'
                                        }
                                }
                        }
                };

                pityChart = new Chart(pityCanvas, pityConfig);
                rarityChart = new Chart(rarityCanvas, rarityConfig);
        }

        onMount(() => {
                // Defer to next tick so canvas refs are attached
                const id = requestAnimationFrame(renderCharts);
                return () => cancelAnimationFrame(id);
        });

        // Update chart data IN-PLACE on data change (avoid destroy+recreate)
        $effect(() => {
                // Touch deps
                void history.length;
                void stats.count5;
                void stats.count4;
                void stats.count3;

                if (!pityChart || !rarityChart) return;

                // Update data without recreating Chart instances
                const pityData = buildPityData();
                const rarityData = buildRarityData();

                pityChart.data.labels = pityData.map((b) => b.label);
                pityChart.data.datasets[0]!.data = pityData.map((b) => b.count);
                rarityChart.data.labels = rarityData.map((d) => d.label);
                rarityChart.data.datasets[0]!.data = rarityData.map((d) => d.count);

                pityChart.update();
                rarityChart.update();
        });

        onDestroy(() => {
                pityChart?.destroy();
                rarityChart?.destroy();
        });
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Pity Distribution -->
        <div class="bg-[#1A2337]/80 backdrop-blur-sm rounded-xl border border-[#C9A45A]/20 shadow-xl p-4">
                <h3 class="font-heading text-sm font-semibold text-[#F2E6D0] mb-3 uppercase tracking-wider">
                        5★ Pity Distribution
                </h3>
                <div class="h-64 relative">
                        {#if stats.count5 === 0}
                                <div class="absolute inset-0 flex items-center justify-center text-[#8E97AA] text-sm italic">
                                        No 5★ pulled yet.
                                </div>
                        {/if}
                        <canvas bind:this={pityCanvas}></canvas>
                </div>
                <p class="text-[10px] text-[#8E97AA] mt-2">
                        Distribusi pity saat hit 5★. Bandingkan dengan kurva "ideal" yang berpuncak di sekitar soft pity (74-80).
                </p>
        </div>

        <!-- Rarity Composition -->
        <div class="bg-[#1A2337]/80 backdrop-blur-sm rounded-xl border border-[#C9A45A]/20 shadow-xl p-4">
                <h3 class="font-heading text-sm font-semibold text-[#F2E6D0] mb-3 uppercase tracking-wider">
                        Rarity Composition
                </h3>
                <div class="h-64 relative flex items-center justify-center">
                        {#if stats.totalWishes === 0}
                                <div class="absolute inset-0 flex items-center justify-center text-[#8E97AA] text-sm italic">
                                        Belum ada wish.
                                </div>
                        {/if}
                        <canvas bind:this={rarityCanvas}></canvas>
                </div>
                <p class="text-[10px] text-[#8E97AA] mt-2">
                        Komposisi rarity seluruh wish. Pada jangka panjang, 3★ seharusnya mendominasi (~94%).
                </p>
        </div>
</div>
