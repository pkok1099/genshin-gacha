// ─── clickOutside Action ─────────────────────────────────────────────────────
// Svelte action: call callback when user clicks/taps outside the element.
//
// Usage:
//   <div use:clickOutside={() => isOpen = false}>...</div>
//
// Uses mousedown (not click) to fire BEFORE the click event completes,
// avoiding the need for setTimeout. Also handles Escape key.

export function clickOutside(node: HTMLElement, callback: () => void): { destroy: () => void } {
    function handlePointerDown(event: MouseEvent | TouchEvent): void {
        const target = event.target as Node;
        if (node && !node.contains(target)) {
            callback();
        }
    }

    function handleKeydown(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            callback();
        }
    }

    // mousedown fires before click completes — no setTimeout needed
    document.addEventListener('mousedown', handlePointerDown, true);
    document.addEventListener('touchstart', handlePointerDown, true);
    document.addEventListener('keydown', handleKeydown, true);

    return {
        destroy() {
            document.removeEventListener('mousedown', handlePointerDown, true);
            document.removeEventListener('touchstart', handlePointerDown, true);
            document.removeEventListener('keydown', handleKeydown, true);
        }
    };
}
