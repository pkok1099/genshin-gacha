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
let nextId = 1;

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
                setTimeout(() => dismiss(id), dur);
        }
        return id;
}

function dismiss(id: number): void {
        toasts = toasts.filter((t) => t.id !== id);
}

function clear(): void {
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
