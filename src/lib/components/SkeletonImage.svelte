<script lang="ts">
        // Skeleton-first image — renders a shimmering placeholder in the SSG
        // HTML and fades the real image in over it once loaded client-side.
        // If every source in the chain fails, the skeleton stays as a permanent
        // placeholder so cards never look broken or empty.
        //
        // Props:
        //   src        — primary image URL (may be empty until data arrives)
        //   fallbacks  — ordered fallback URLs tried on error (optional)
        //   class      — sizing/positioning for the container (e.g. "w-20 h-20")
        //   imgClass   — classes for the image itself (e.g. "object-cover")
        //   glyph      — centered symbol shown over the skeleton (default ✦)
        //   glyphClass — color classes for the glyph (e.g. "text-[#C9A45A]")
        //   label      — small uppercase caption under the glyph

        let {
                src = '',
                alt = '',
                fallbacks = [] as string[],
                class: className = '',
                imgClass = 'object-cover',
                loading = 'lazy',
                glyph = '✦',
                glyphClass = 'text-[#C9A45A]',
                label = ''
        }: {
                src?: string;
                alt?: string;
                fallbacks?: string[];
                class?: string;
                imgClass?: string;
                loading?: 'eager' | 'lazy';
                glyph?: string;
                glyphClass?: string;
                label?: string;
        } = $props();

        let loaded = $state(false);
        let attempt = $state(0);
        let imgEl: HTMLImageElement | null = $state(null);

        let sources = $derived([src, ...fallbacks].filter(Boolean));
        let currentSrc = $derived(sources[attempt] ?? '');

        // Reset the visual state whenever the primary source changes
        // (call sites remount via {#key} when the subject changes, so this
        // also covers prop updates without remount).
        $effect(() => {
                void src;
                loaded = false;
                attempt = 0;
        });

        // Cached images can fire `load` before the handler is attached —
        // detect that case on mount/hydration.
        $effect(() => {
                if (imgEl && currentSrc && imgEl.complete) {
                        if (imgEl.naturalWidth > 0) loaded = true;
                        else if (attempt < sources.length - 1) attempt += 1;
                }
        });

        function onError(): void {
                if (attempt < sources.length - 1) {
                        attempt += 1;
                }
                // Exhausted — keep the skeleton as a permanent placeholder.
        }
</script>

<div class="overflow-hidden {className}">
        <div
                class="absolute inset-0 skeleton transition-opacity duration-500 {loaded ? 'opacity-0' : 'opacity-100'}"
                aria-hidden="true"
        ></div>

        {#if glyph || label}
                <div
                        class="absolute inset-0 flex flex-col items-center justify-center select-none pointer-events-none {glyphClass} transition-opacity duration-500 {loaded ? 'opacity-0' : 'opacity-100'}"
                        aria-hidden="true"
                >
                        {#if glyph}
                                <span class="text-3xl opacity-50 drop-shadow-[0_0_14px_currentColor]">{glyph}</span>
                        {/if}
                        {#if label}
                                <span class="text-[10px] uppercase tracking-widest opacity-40 mt-1.5 text-center px-2 leading-tight">{label}</span>
                        {/if}
                </div>
        {/if}

        {#if currentSrc}
                <img
                        bind:this={imgEl}
                        src={currentSrc}
                        {alt}
                        {loading}
                        decoding="async"
                        class="absolute inset-0 w-full h-full transition-opacity duration-500 {imgClass} {loaded ? 'opacity-100' : 'opacity-0'}"
                        onload={() => (loaded = true)}
                        onerror={onError}
                />
        {/if}
</div>
