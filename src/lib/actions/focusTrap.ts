// ─── Focus Trap Action ───────────────────────────────────────────────────────
// Svelte action that traps keyboard focus inside an element (typically a
// modal/dialog). When the element mounts, focus moves to the first focusable
// child (or the element itself). Tab/Shift+Tab cycle within the element. When
// the element unmounts, focus restores to the element that had it before the
// trap activated.
//
// Usage:
//   <div use:focusTrap role="dialog" aria-modal="true"> ... </div>
//
// Accessibility: this satisfies the WAI-ARIA dialog pattern for keyboard
// users. Without it, Tab can escape to the page behind the modal, which is
// confusing for screen-reader and keyboard-only users.

const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
].join(', ');

export function focusTrap(node: HTMLElement) {
    let previouslyFocused: HTMLElement | null = null;

    function getFocusable(): HTMLElement[] {
        return Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
            .filter((el) => el.offsetParent !== null || el === document.activeElement);
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key !== 'Tab') return;
        const focusable = getFocusable();
        if (focusable.length === 0) {
            e.preventDefault();
            node.focus();
            return;
        }
        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;
        const active = document.activeElement as HTMLElement;

        if (e.shiftKey) {
            if (active === first || !node.contains(active)) {
                e.preventDefault();
                last.focus();
            }
        } else {
            if (active === last || !node.contains(active)) {
                e.preventDefault();
                first.focus();
            }
        }
    }

    // On mount: save current focus, move focus into the trap.
    previouslyFocused = document.activeElement as HTMLElement;
    // Defer to next tick so Svelte has rendered the modal's children.
    requestAnimationFrame(() => {
        const focusable = getFocusable();
        if (focusable.length > 0) {
            focusable[0]!.focus();
        } else {
            // No focusable children — make the node itself focusable so Tab
            // cycling still works and screen readers announce it.
            if (!node.hasAttribute('tabindex')) node.setAttribute('tabindex', '-1');
            node.focus();
        }
    });

    node.addEventListener('keydown', handleKeydown);

    return {
        destroy() {
            node.removeEventListener('keydown', handleKeydown);
            // Restore focus to the trigger.
            if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
                previouslyFocused.focus();
            }
        }
    };
}
