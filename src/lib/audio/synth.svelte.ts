// ─── Synth Sound Effects (Web Audio API, zero audio files) ───────────────────
// All sounds are synthesized at runtime with oscillator + gain envelopes.
// AudioContext is lazily created on the first user gesture (browser autoplay
// policy compliance). Master enable/disable is persisted to localStorage.

import { browser } from '$app/environment';

const STORAGE_KEY = 'genshin_sim_sound_enabled';

// ─── State ───────────────────────────────────────────────────────────────────

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;

let enabled: boolean = $state(loadEnabled());

function loadEnabled(): boolean {
        if (!browser) return false;
        try {
                const stored = localStorage.getItem(STORAGE_KEY);
                return stored === null ? true : stored === '1';
        } catch { return true; }
}

function persistEnabled(): void {
        if (!browser) return;
        try { localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0'); } catch { /* ignore */ }
}

// ─── Lazy AudioContext init (must be triggered by user gesture) ──────────────

function ensureContext(): AudioContext | null {
        if (!browser) return null;
        if (!enabled) return null;
        if (!ctx) {
                try {
                        const Ctor: typeof AudioContext =
                                window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                        ctx = new Ctor();
                        masterGain = ctx.createGain();
                        masterGain.gain.value = 0.18; // gentle master volume
                        masterGain.connect(ctx.destination);
                } catch {
                        ctx = null;
                        return null;
                }
        }
        // Resume if suspended (browsers suspend until user gesture)
        if (ctx.state === 'suspended') {
                ctx.resume().catch(() => { /* ignore */ });
        }
        return ctx;
}

// ─── Primitive: play a single note with envelope ────────────────────────────

interface NoteSpec {
        freq: number;             // Hz
        start: number;            // seconds from now
        duration: number;         // seconds
        type?: OscillatorType;    // 'sine' | 'triangle' | 'square' | 'sawtooth'
        gain?: number;            // 0..1 peak (post-master)
        detune?: number;          // cents
}

function playNotes(notes: NoteSpec[]): void {
        const c = ensureContext();
        if (!c || !masterGain) return;
        const now = c.currentTime;

        for (const n of notes) {
                const osc = c.createOscillator();
                const g = c.createGain();
                osc.type = n.type ?? 'sine';
                osc.frequency.value = n.freq;
                if (n.detune) osc.detune.value = n.detune;

                const peak = n.gain ?? 0.5;
                const startAt = now + n.start;
                const endAt = startAt + n.duration;

                // ADSR-ish: quick attack, soft decay, quick release
                g.gain.setValueAtTime(0.0001, startAt);
                g.gain.exponentialRampToValueAtTime(peak, startAt + 0.01);
                g.gain.exponentialRampToValueAtTime(peak * 0.4, startAt + n.duration * 0.5);
                g.gain.exponentialRampToValueAtTime(0.0001, endAt);

                osc.connect(g);
                g.connect(masterGain);
                osc.start(startAt);
                osc.stop(endAt + 0.02);
        }
}

// ─── Public Sound API ────────────────────────────────────────────────────────

/** Soft chime when wish button is clicked. */
export function playWishClick(): void {
        playNotes([
                { freq: 880,  start: 0,    duration: 0.10, type: 'triangle', gain: 0.3 },
                { freq: 1320, start: 0.05, duration: 0.12, type: 'sine',     gain: 0.2 }
        ]);
}

/** Subtle flip sound when a card is turned over. */
export function playCardFlip(): void {
        playNotes([
                { freq: 600,  start: 0,    duration: 0.06, type: 'triangle', gain: 0.18 },
                { freq: 900,  start: 0.04, duration: 0.08, type: 'sine',     gain: 0.15 }
        ]);
}

/** Reveal sound scaled by rarity — 3★ low, 4★ mid, 5★ golden fanfare. */
export function playReveal(rarity: 3 | 4 | 5): void {
        if (rarity === 3) {
                // Simple low chime
                playNotes([
                        { freq: 392,  start: 0,    duration: 0.18, type: 'triangle', gain: 0.22 },
                        { freq: 523,  start: 0.06, duration: 0.20, type: 'sine',     gain: 0.18 }
                ]);
        } else if (rarity === 4) {
                // Purple two-note sparkle
                playNotes([
                        { freq: 523,  start: 0,    duration: 0.15, type: 'triangle', gain: 0.28 },
                        { freq: 784,  start: 0.08, duration: 0.18, type: 'sine',     gain: 0.25 },
                        { freq: 988,  start: 0.16, duration: 0.22, type: 'sine',     gain: 0.20 }
                ]);
        } else {
                // 5★ golden ascending fanfare
                playNotes([
                        { freq: 523,  start: 0,    duration: 0.18, type: 'triangle', gain: 0.35 },
                        { freq: 659,  start: 0.10, duration: 0.20, type: 'triangle', gain: 0.32 },
                        { freq: 784,  start: 0.20, duration: 0.22, type: 'sine',     gain: 0.30 },
                        { freq: 1047, start: 0.32, duration: 0.30, type: 'sine',     gain: 0.28 },
                        { freq: 1319, start: 0.42, duration: 0.40, type: 'sine',     gain: 0.22 }
                ]);
        }
}

/** Soft UI tick for button presses (very subtle). */
export function playTick(): void {
        playNotes([
                { freq: 1200, start: 0, duration: 0.03, type: 'square', gain: 0.08 }
        ]);
}

/** Error buzz. */
export function playError(): void {
        playNotes([
                { freq: 220, start: 0,    duration: 0.12, type: 'sawtooth', gain: 0.18 },
                { freq: 180, start: 0.10, duration: 0.18, type: 'sawtooth', gain: 0.16 }
        ]);
}

/** Success chime for redemption / claim. */
export function playSuccess(): void {
        playNotes([
                { freq: 659,  start: 0,    duration: 0.12, type: 'triangle', gain: 0.28 },
                { freq: 880,  start: 0.08, duration: 0.14, type: 'sine',     gain: 0.25 },
                { freq: 1047, start: 0.16, duration: 0.20, type: 'sine',     gain: 0.22 }
        ]);
}

// ─── Public Store API ────────────────────────────────────────────────────────

export function isSoundEnabled(): boolean { return enabled; }

export function setSoundEnabled(value: boolean): void {
        enabled = value;
        persistEnabled();
        // Initialize context on enable so the first user gesture is already wired up.
        if (value) ensureContext();
}

export function toggleSound(): boolean {
        setSoundEnabled(!enabled);
        return enabled;
}

/** Forces AudioContext init/resume — call from a click handler to satisfy
 *  browser autoplay policy before any other sound call. */
export function primeAudio(): void {
        ensureContext();
}
