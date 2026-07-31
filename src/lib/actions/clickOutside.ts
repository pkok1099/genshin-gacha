// ─── clickOutside Action ─────────────────────────────────────────────────────
// Svelte action: call callback when user clicks/taps outside the element.
//
// Usage:
//   <div use:clickOutside={() => isOpen = false}>...</div>
//
// Also closes on ESC key press and touchend outside (mobile-friendly).

export function clickOutside(node: HTMLElement, callback: () => void): { destroy: () => void } {
    let active = true;

    function handleClick(event: MouseEvent): void {
        if (!active) return;
        if (node && !node.contains(event.target as Node) && !event.defaultPrevented) {
            callback();
        }
    }

    function handleTouch(event: TouchEvent): void {
        if (!active) return;
        if (node && !node.contains(event.target as Node) && !event.defaultPrevented) {
            callback();
        }
    }

    function handleKeydown(event: KeyboardEvent): void {
        if (!active) return;
        if (event.key === 'Escape') {
            callback();
        }
    }

    // Use capture phase to catch events before they reach inner elements
    // Delay slightly so the click that opened the menu doesn't immediately close it
    setTimeout(() => {
        document.addEventListener('click', handleClick, true);
        document.addEventListener('touchend', handleTouch, true);
        document.addEventListener('keydown', handleKeydown, true);
    }, 0);

    return {
        destroy() {
            active = false;
            document.removeEventListener('click', handleClick, true);
            document.removeEventListener('touchend', handleTouch, true);
            document.removeEventListener('keydown', handleKeydown, true);
        }
    };
}
