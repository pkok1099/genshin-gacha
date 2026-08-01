// ─── Toast Store (Svelte 5 Runes) ────────────────────────────────────────────
// Unified toast notification system. Any component or page can call `toast()`
// to push a notification; the <Toaster /> component (mounted once in
// +layout.svelte) renders them in a fixed top-right stack.
//
// Auto-dismiss: each toast has a configurable duration (default 3s). Success
// toasts auto-dismiss; error toasts stay longer (default 5s) and can be
// dismissed manually by clicking.
//
// Usage:
//   import { toast } from '$lib/stores/toast.svelte';
//   toast.success('Saved!', 'Pity settings applied.');
//   toast.error('Failed', 'Primogem not enough.');
//   toast.info('Tip', 'Press 1 for single pull.');

export type ToastKind = 'success' | 'error' | 'info' | 'warning';

export interface ToastEntry {
        id: number;
        kind: ToastKind;
        title: string;
        message?: string;
        duration: number;       // ms, 0 = sticky (no auto-dismiss)
        createdAt: number;
}

let toasts: ToastEntry[] = $state([]);
// Seed nextId with Date.now() so it doesn't collide across HMR boundaries
// (module re-execution resets the counter, but pending setTimeout closures
// from the previous module instance still reference the old `dismiss`).
// Using a high base also makes IDs visually distinguishable from small
// sequential integers in devtools.
let nextId = Date.now();
// Track pending timer handles so we can clear them on dismiss/clear —
// prevents leaked timeouts if a toast is dismissed manually before its
// auto-dismiss fires.
const pendingTimers = new Map<number, ReturnType<typeof setTimeout>>();

function push(kind: ToastKind, title: string, message?: string, duration?: number): number {
        // Default durations: success 3s, info 3.5s, warning 4s, error 5s.
        const defaults: Record<ToastKind, number> = {
                success: 3000,
                info: 3500,
                warning: 4000,
                error: 5000
        };
        const dur = duration ?? defaults[kind];
        const id = nextId++;
        const entry: ToastEntry = {
                id,
                kind,
                title,
                message,
                duration: dur,
                createdAt: Date.now()
        };
        toasts = [...toasts, entry];

        if (dur > 0) {
                const timer = setTimeout(() => {
                        pendingTimers.delete(id);
                        dismiss(id);
                }, dur);
                pendingTimers.set(id, timer);
        }
        return id;
}

function dismiss(id: number): void {
        // Clear any pending auto-dismiss timer so it doesn't fire on an
        // already-removed toast (no-op but avoids a wasted filter pass).
        const timer = pendingTimers.get(id);
        if (timer) {
                clearTimeout(timer);
                pendingTimers.delete(id);
        }
        toasts = toasts.filter((t) => t.id !== id);
}

function clear(): void {
        // Clear all pending timers before wiping the array.
        for (const timer of pendingTimers.values()) {
                clearTimeout(timer);
        }
        pendingTimers.clear();
        toasts = [];
}

// Public API — the `toast()` function plus kind-specific helpers.
export const toast = Object.assign(
        (kind: ToastKind, title: string, message?: string, duration?: number) => push(kind, title, message, duration),
        {
                success: (title: string, message?: string, duration?: number) => push('success', title, message, duration),
                error:   (title: string, message?: string, duration?: number) => push('error',   title, message, duration),
                info:    (title: string, message?: string, duration?: number) => push('info',    title, message, duration),
                warning: (title: string, message?: string, duration?: number) => push('warning', title, message, duration),
                dismiss,
                clear
        }
);

// Export dismiss separately for the Toaster component's dismiss button.
export { dismiss };

// Reactive accessor for the Toaster component.
export function getToasts(): ToastEntry[] {
        return toasts;
}
