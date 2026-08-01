<script lang="ts">
        // Skeleton placeholder card — shows a shimmering gold placeholder while
        // real data loads. Mirrors the layout of a BannerCard so the page
        // doesn't jump when the real cards arrive.
        //
        // Variants:
        //   - 'banner-card': matches BannerCard layout (image + text rows)
        //   - 'splash': large featured-character splash placeholder
        //   - 'generic': simple block with configurable lines

        let {
                variant = 'generic',
                lines = 3,
                class: className = ''
        }: {
                variant?: 'banner-card' | 'splash' | 'generic';
                lines?: number;
                class?: string;
        } = $props();
</script>

{#if variant === 'banner-card'}
        <div class="relative w-full rounded-xl border-2 border-[#24314A] bg-gradient-to-br from-[#1A2337] to-[#0B1020] overflow-hidden {className}">
                <div class="p-4 flex gap-4 items-center">
                        <!-- Image placeholder -->
                        <div class="w-20 h-20 shrink-0 rounded-lg skeleton border-2 border-[#C9A45A]/20"></div>
                        <div class="flex-1 space-y-2">
                                <div class="flex gap-2">
                                        <div class="skeleton skeleton-text w-12 h-4"></div>
                                        <div class="skeleton skeleton-text w-8 h-4"></div>
                                </div>
                                <div class="skeleton skeleton-text w-32" style="height: 1rem;"></div>
                                <div class="skeleton skeleton-text w-24"></div>
                                <div class="flex gap-1 mt-1.5">
                                        <div class="skeleton skeleton-text w-14 h-4 rounded"></div>
                                        <div class="skeleton skeleton-text w-14 h-4 rounded"></div>
                                </div>
                                <div class="skeleton skeleton-text w-28 mt-1.5"></div>
                        </div>
                </div>
        </div>
{:else if variant === 'splash'}
        <div class="relative w-full h-full flex items-end justify-center {className}">
                <div class="absolute inset-0 skeleton rounded-lg opacity-50"></div>
                <div class="relative space-y-2 w-full max-w-xs p-4">
                        <div class="skeleton skeleton-text w-20 h-3"></div>
                        <div class="skeleton skeleton-text w-48" style="height: 2rem;"></div>
                        <div class="skeleton skeleton-text w-32 h-3"></div>
                        <div class="flex gap-1.5 pt-1">
                                <div class="skeleton skeleton-text w-16 h-5 rounded"></div>
                                <div class="skeleton skeleton-text w-20 h-5 rounded"></div>
                                <div class="skeleton skeleton-text w-14 h-5 rounded"></div>
                        </div>
                </div>
        </div>
{:else}
        <div class="space-y-2 {className}">
                {#each Array(lines) as _, i}
                        <div class="skeleton skeleton-text w-full" style="width: {i === lines - 1 ? '60%' : '100%'}"></div>
                {/each}
        </div>
{/if}
