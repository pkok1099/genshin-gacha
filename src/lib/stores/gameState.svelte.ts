// ─── Game State Store (Svelte 5 Runes + localStorage Persistence) ────────────
// Single source of truth for the wish simulator. All mutations are persisted
// to localStorage under the `genshin_sim_` prefix. Browser-only — SSR-safe.
//
// Pity model (v2):
//   Each wish mode (character / standard / novice) has its OWN independent
//   pity5 / pity4 / guaranteed5 / guaranteed4 / pityLock5 / pityLock4.
//   This mirrors real Genshin Impact behavior, where the Character Event
//   Wish and Standard Wish track pity separately.
//
// Backward compat:
//   `game.pity5`, `game.pity4`, `game.guaranteed5`, `game.guaranteed4`,
//   `game.pityLock5`, `game.pityLock4` are preserved as GETTERS that read
//   from the ACTIVE mode's pity object. Existing consumers (PityBar,
//   calculator, wish page) work unchanged. New code should prefer the
//   explicit `game.getModePity(mode)` / `game.setModePity(mode, …)` API.
//
// Migration:
//   Old persisted state (with top-level pity5/pity4/…) is auto-migrated on
//   load: legacy values are written into `modes.character.*` and the
//   top-level fields are discarded. `modes.standard` and `modes.novice`
//   start at zero. This matches the previous behavior where the default
//   wishMode was 'character'.

import {
    executePull,
    executeMultiPull,
    setBannerPools,
    type GachaState,
    type PullResult,
    type BannerPools
} from '$lib/utils/gachaEngine';
import {
    executeStandardPull,
    executeStandardMultiPull
} from '$lib/utils/standardWishEngine';

// ─── Public Types (matches spec) ─────────────────────────────────────────────

export type Rarity = 3 | 4 | 5;
export type ItemType = 'character' | 'weapon';

export interface WishResult {
    id: string;
    pullNumber: number;
    name: string;
    type: ItemType;
    rarity: Rarity;
    element?: string;
    icon: string;
    fallbackIcon?: string;
    pityCount: number;       // pity5 at the moment of pull
    is5050Win?: boolean;     // only meaningful for 5★
    isRateUp: boolean;
    isGuaranteed: boolean;
    bannerId: string;
    timestamp: number;
    // Monotonically increasing batch ID — incremented once per doSinglePull
    // (batch of 1) or doTenPull (batch of 10). Used by the achievement
    // detector to unambiguously group pulls that came from the same wish
    // action, without relying on timestamp proximity (which produces false
    // positives for rapid singles and false negatives for back-to-back
    // 10-pulls within 5s of each other). Optional for backwards-compat with
    // imported histories that predate the field.
    batchId?: number;
}

export type WishMode = 'character' | 'standard' | 'novice';

// ─── Per-mode pity container ─────────────────────────────────────────────────
// Each wish mode owns its own counters — pulling on the Character Event banner
// does NOT advance Standard Wish pity, and vice versa. `pityLock5` / `pityLock4`
// are per-mode too so users can test soft-pity loops independently per banner.
export interface ModePity {
    pity5: number;
    pity4: number;
    guaranteed5: boolean;
    guaranteed4: boolean;
    pityLock5: number | null;
    pityLock4: number | null;
}

export interface SimState {
    primogem: number;
    // Per-mode pity (v2). Replaces the legacy top-level pity5/pity4/… fields.
    modes: Record<WishMode, ModePity>;
    wishHistory: WishResult[];
    totalWishes: number;
    selectedBannerId: string;
    // Wish mode selector
    wishMode: WishMode;
    // Novice wish tracking
    novicePullsUsed: number;       // 0-20
    noviceFirstTenUsed: boolean;   // whether first 10-pull (guaranteed Noelle) has been used
    // Wish animation preference — when true, pulls skip the flip-card modal
    // entirely and results are pushed straight to history. Persisted so the
    // user's choice survives reloads.
    skipAnimation: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'genshin_sim_state_v1';
const DEFAULT_PRIMOGEM = 16000;
const COST_SINGLE = 160;
const COST_TEN = 1600;
const NOVICE_COST_TEN = 1280;  // 20% discount (8 Acquaint Fate × 160)
const NOVICE_MAX_PULLS = 20;

function createEmptyModePity(): ModePity {
    return {
        pity5: 0,
        pity4: 0,
        guaranteed5: false,
        guaranteed4: false,
        pityLock5: null,
        pityLock4: null
    };
}

function createInitialModes(): Record<WishMode, ModePity> {
    return {
        character: createEmptyModePity(),
        standard: createEmptyModePity(),
        novice: createEmptyModePity()
    };
}

// ─── Banner Pool Registry (transient — not persisted) ────────────────────────

interface BannerRegistryEntry extends BannerPools {
    id: string;
    name: string;
    version: string;
    endTime: number;
}

const bannerRegistry: Map<string, BannerRegistryEntry> = new Map();

// ─── Persistence Layer ───────────────────────────────────────────────────────

function isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

// Migrate legacy v1 state (top-level pity5/pity4/guaranteed5/guaranteed4/
// pityLock5/pityLock4) into the new per-mode structure. The legacy values
// are written into `modes.character.*` because the previous default wishMode
// was 'character' and all pulls shared that single counter.
function migrateLegacy(parsed: any): Partial<SimState> {
    // Already v2 — no migration needed, but verify modes shape.
    if (parsed && parsed.modes && typeof parsed.modes === 'object' && !Array.isArray(parsed.modes)) {
        return parsed as Partial<SimState>;
    }

    // Legacy v1 state — copy the shared pity into all three modes? No: the
    // previous behavior was a SINGLE shared counter used by whichever mode
    // was active (default 'character'). To preserve the user's setup most
    // faithfully, we put the legacy values into `modes.character` and leave
    // standard/novice at zero — that way a user who was clearly playing
    // the Character Event banner doesn't accidentally inherit "max pity"
    // on Standard too. Standard/novice users will see 0 (fresh), which is
    // the safest default for a counter they never explicitly set.
    const modes = createInitialModes();
    if (parsed) {
        modes.character.pity5 = typeof parsed.pity5 === 'number' && Number.isFinite(parsed.pity5) ? parsed.pity5 : 0;
        modes.character.pity4 = typeof parsed.pity4 === 'number' && Number.isFinite(parsed.pity4) ? parsed.pity4 : 0;
        modes.character.guaranteed5 = parsed.guaranteed5 === true;
        modes.character.guaranteed4 = parsed.guaranteed4 === true;
        modes.character.pityLock5 = (typeof parsed.pityLock5 === 'number' && Number.isFinite(parsed.pityLock5)) ? parsed.pityLock5 : null;
        modes.character.pityLock4 = (typeof parsed.pityLock4 === 'number' && Number.isFinite(parsed.pityLock4)) ? parsed.pityLock4 : null;
    }
    return { ...parsed, modes };
}

// Coerce a raw mode pity object (from localStorage or import) into a valid
// ModePity. Non-number / non-finite values fall back to 0; out-of-range
// pity5/pity4 are clamped to their valid ranges. This defends against
// hand-edited localStorage or corrupted imports that would otherwise
// produce NaN in the gacha engine (e.g. pity5 = "high" → "high1" string
// concat → get5StarRate(NaN) → no 5★ ever drops, silently broken).
function coerceModePity(raw: unknown): ModePity {
    const base = createEmptyModePity();
    if (!raw || typeof raw !== 'object') return base;
    const r = raw as Partial<ModePity>;
    const num = (v: unknown, min: number, max: number): number => {
        if (typeof v !== 'number' || !Number.isFinite(v)) return 0;
        return Math.max(min, Math.min(max, Math.floor(v)));
    };
    const nullableNum = (v: unknown, min: number, max: number): number | null => {
        if (typeof v !== 'number' || !Number.isFinite(v)) return null;
        return Math.max(min, Math.min(max, Math.floor(v)));
    };
    return {
        pity5: num(r.pity5, 0, 89),
        pity4: num(r.pity4, 0, 9),
        guaranteed5: r.guaranteed5 === true,
        guaranteed4: r.guaranteed4 === true,
        pityLock5: nullableNum(r.pityLock5, 0, 89),
        pityLock4: nullableNum(r.pityLock4, 0, 9)
    };
}

function loadState(): SimState {
    if (!isBrowser()) return createInitialSimState();
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return createInitialSimState();
        const parsed = migrateLegacy(JSON.parse(raw));
        return {
            primogem: typeof parsed.primogem === 'number' && Number.isFinite(parsed.primogem) ? Math.max(0, Math.floor(parsed.primogem)) : DEFAULT_PRIMOGEM,
            modes: {
                character: coerceModePity(parsed.modes?.character),
                standard:  coerceModePity(parsed.modes?.standard),
                novice:    coerceModePity(parsed.modes?.novice)
            },
            wishHistory: Array.isArray(parsed.wishHistory) ? parsed.wishHistory : [],
            totalWishes: typeof parsed.totalWishes === 'number' && Number.isFinite(parsed.totalWishes) ? Math.max(0, Math.floor(parsed.totalWishes)) : 0,
            selectedBannerId: typeof parsed.selectedBannerId === 'string' ? parsed.selectedBannerId : '',
            wishMode: (parsed.wishMode === 'standard' || parsed.wishMode === 'novice') ? parsed.wishMode : 'character',
            novicePullsUsed: typeof parsed.novicePullsUsed === 'number' && Number.isFinite(parsed.novicePullsUsed) ? Math.max(0, Math.min(NOVICE_MAX_PULLS, Math.floor(parsed.novicePullsUsed))) : 0,
            noviceFirstTenUsed: parsed.noviceFirstTenUsed === true,
            skipAnimation: parsed.skipAnimation === true
        };
    } catch (err) {
        console.error('[gameState] Failed to load state, resetting:', err);
        return createInitialSimState();
    }
}

function persistState(state: SimState): void {
    if (!isBrowser()) return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
        console.error('[gameState] Failed to persist state:', err);
    }
}

function createInitialSimState(): SimState {
    return {
        primogem: DEFAULT_PRIMOGEM,
        modes: createInitialModes(),
        wishHistory: [],
        totalWishes: 0,
        selectedBannerId: '',
        wishMode: 'character',
        novicePullsUsed: 0,
        noviceFirstTenUsed: false,
        skipAnimation: false
    };
}

// ─── Reactive State (Svelte 5 Runes) ─────────────────────────────────────────

let simState: SimState = $state(loadState());

// Persist on every change — DEBOUNCED to avoid localStorage write on every keystroke
// (JSON.stringify on every $effect fire was the main perf bottleneck)
let persistTimer: ReturnType<typeof setTimeout> | null = null;

$effect.root(() => {
    $effect(() => {
        // Touch the reactive deps we want to track (granular, not deep-watch).
        // Per-mode fields are tracked individually so changing one mode's pity
        // doesn't re-serialize the entire modes object on every keystroke.
        void simState.primogem;
        void simState.modes.character.pity5;
        void simState.modes.character.pity4;
        void simState.modes.character.guaranteed5;
        void simState.modes.character.guaranteed4;
        void simState.modes.character.pityLock5;
        void simState.modes.character.pityLock4;
        void simState.modes.standard.pity5;
        void simState.modes.standard.pity4;
        void simState.modes.standard.guaranteed5;
        void simState.modes.standard.guaranteed4;
        void simState.modes.standard.pityLock5;
        void simState.modes.standard.pityLock4;
        void simState.modes.novice.pity5;
        void simState.modes.novice.pity4;
        void simState.modes.novice.guaranteed5;
        void simState.modes.novice.guaranteed4;
        void simState.modes.novice.pityLock5;
        void simState.modes.novice.pityLock4;
        void simState.totalWishes;
        void simState.selectedBannerId;
        void simState.wishMode;
        void simState.novicePullsUsed;
        void simState.noviceFirstTenUsed;
        void simState.skipAnimation;
        void simState.wishHistory.length;

        // Debounce: collapse rapid successive mutations into one localStorage write
        if (persistTimer) clearTimeout(persistTimer);
        persistTimer = setTimeout(() => {
            persistState(simState);
            persistTimer = null;
        }, 150);
    });
});

// ─── Helpers: per-mode access ────────────────────────────────────────────────

function activeMode(): ModePity {
    return simState.modes[simState.wishMode];
}

// ─── Mutations ───────────────────────────────────────────────────────────────

function registerBanner(entry: BannerRegistryEntry): void {
    bannerRegistry.set(entry.id, entry);
}

function getActiveBanner(): BannerRegistryEntry | null {
    if (!simState.selectedBannerId) return null;
    return bannerRegistry.get(simState.selectedBannerId) ?? null;
}

function selectBanner(id: string): void {
    simState.selectedBannerId = id;
}

function addPrimogem(amount: number): void {
    simState.primogem = Math.max(0, simState.primogem + amount);
}

function canAfford(cost: number): boolean {
    return simState.primogem >= cost;
}

// ── Legacy single-mode setters (operate on the ACTIVE mode) ──────────────────
// Kept for backward compatibility with code that doesn't care which mode is
// active (e.g. the calculator page, which only reads current values). New UI
// should prefer the explicit per-mode setters below.

function setPity(pity5: number, pity4: number): void {
    const m = activeMode();
    m.pity5 = Math.max(0, Math.min(89, pity5));
    m.pity4 = Math.max(0, Math.min(9, pity4));
}

function setGuaranteed5(value: boolean): void {
    activeMode().guaranteed5 = value;
}

function setPrimogem(amount: number): void {
    // Clamp to non-negative integer; allow 0.
    const safe = Math.max(0, Math.floor(Number.isFinite(amount) ? amount : 0));
    simState.primogem = safe;
}

function setPityLock5(value: number | null): void {
    // null = disabled (normal reset to 0); number = lock to that value
    if (value === null) {
        activeMode().pityLock5 = null;
    } else {
        activeMode().pityLock5 = Math.max(0, Math.min(89, Math.floor(value)));
    }
}

function setPityLock4(value: number | null): void {
    if (value === null) {
        activeMode().pityLock4 = null;
    } else {
        activeMode().pityLock4 = Math.max(0, Math.min(9, Math.floor(value)));
    }
}

// ── Explicit per-mode setters (preferred for new UI) ─────────────────────────
// `mode` is required so callers are explicit about which banner they're
// configuring. The pity-setup page uses these to set Character / Standard /
// Novice independently.

function getModePity(mode: WishMode): ModePity {
    return simState.modes[mode];
}

function setModePity(mode: WishMode, pity5: number, pity4: number): void {
    const m = simState.modes[mode];
    m.pity5 = Math.max(0, Math.min(89, pity5));
    m.pity4 = Math.max(0, Math.min(9, pity4));
}

function setModeGuaranteed5(mode: WishMode, value: boolean): void {
    simState.modes[mode].guaranteed5 = value;
}

function setModePityLock5(mode: WishMode, value: number | null): void {
    if (value === null) {
        simState.modes[mode].pityLock5 = null;
    } else {
        simState.modes[mode].pityLock5 = Math.max(0, Math.min(89, Math.floor(value)));
    }
}

function setModePityLock4(mode: WishMode, value: number | null): void {
    if (value === null) {
        simState.modes[mode].pityLock4 = null;
    } else {
        simState.modes[mode].pityLock4 = Math.max(0, Math.min(9, Math.floor(value)));
    }
}

// ── Mode + animation preferences ─────────────────────────────────────────────

function setWishMode(mode: WishMode): void {
    simState.wishMode = mode;
}

function setSkipAnimation(value: boolean): void {
    simState.skipAnimation = value;
}

function resetAll(): void {
    simState.primogem = DEFAULT_PRIMOGEM;
    simState.modes = createInitialModes();
    simState.wishHistory = [];
    simState.totalWishes = 0;
    simState.selectedBannerId = '';
    simState.wishMode = 'character';
    simState.novicePullsUsed = 0;
    simState.noviceFirstTenUsed = false;
    simState.skipAnimation = false;
}

function resetHistoryOnly(): void {
    simState.wishHistory = [];
    simState.totalWishes = 0;
}

// ─── Import / Export wish history ────────────────────────────────────────────
// Used by the /history page's export/import JSON feature so users can back
// up their pull history or share it across devices. The exported blob is a
// plain JSON array of WishResult objects plus a small metadata envelope.

export interface HistoryExportEnvelope {
    version: 1;
    exportedAt: number;            // epoch ms
    totalWishes: number;
    history: WishResult[];
}

function exportHistory(): HistoryExportEnvelope {
    return {
        version: 1,
        exportedAt: Date.now(),
        totalWishes: simState.totalWishes,
        history: [...simState.wishHistory]
    };
}

// Import replaces the current history entirely. We re-validate each entry's
// shape minimally (must have id + name + rarity + timestamp); malformed
// entries are skipped rather than aborting the whole import. Returns the
// number of entries successfully imported so the UI can show a toast.
function importHistory(envelope: unknown): number {
    if (!envelope || typeof envelope !== 'object') return 0;
    const env = envelope as Partial<HistoryExportEnvelope>;
    // Accept either a bare array (legacy) or the v1 envelope.
    const rawHistory: unknown = Array.isArray(envelope) ? envelope : env.history;
    if (!Array.isArray(rawHistory)) return 0;

    // Phase 1: validate + coerce each entry. Skip malformed entries rather
    // than aborting the whole import.
    const valid: WishResult[] = [];
    const seenIds = new Set<string>();
    for (const entry of rawHistory) {
        if (!entry || typeof entry !== 'object') continue;
        const e = entry as Partial<WishResult>;
        // Minimal shape check — pullNumber is recomputed below so we don't
        // require it to be present in the import.
        if (typeof e.id !== 'string' || typeof e.name !== 'string' ||
            typeof e.rarity !== 'number' || typeof e.timestamp !== 'number' ||
            !Number.isFinite(e.timestamp)) {
            continue;
        }
        // Deduplicate by ID — keep the first occurrence. Duplicate IDs would
        // break Svelte's keyed {#each} loops and cause render warnings.
        if (seenIds.has(e.id)) continue;
        seenIds.add(e.id);

        valid.push({
            id: e.id,
            pullNumber: 0,  // recomputed after sort
            name: e.name,
            type: e.type === 'weapon' ? 'weapon' : 'character',
            rarity: (e.rarity === 5 || e.rarity === 4 || e.rarity === 3) ? e.rarity : 3,
            element: typeof e.element === 'string' ? e.element : undefined,
            icon: typeof e.icon === 'string' ? e.icon : '',
            fallbackIcon: typeof e.fallbackIcon === 'string' ? e.fallbackIcon : undefined,
            pityCount: typeof e.pityCount === 'number' && Number.isFinite(e.pityCount) ? e.pityCount : 0,
            is5050Win: typeof e.is5050Win === 'boolean' ? e.is5050Win : undefined,
            isRateUp: typeof e.isRateUp === 'boolean' ? e.isRateUp : false,
            isGuaranteed: typeof e.isGuaranteed === 'boolean' ? e.isGuaranteed : false,
            bannerId: typeof e.bannerId === 'string' ? e.bannerId : 'character',
            timestamp: e.timestamp
        });
    }

    if (valid.length === 0) return 0;

    // Phase 2: sort chronologically (oldest first). Out-of-order timestamps
    // would corrupt StreakTracker and the achievement batch detector, both of
    // which assume ascending order. Ties keep insertion order (stable sort).
    valid.sort((a, b) => a.timestamp - b.timestamp);

    // Phase 3: recompute pullNumber sequentially so it's monotonic and
    // matches the new totalWishes. This also fixes any gaps from the source.
    valid.forEach((entry, i) => {
        entry.pullNumber = i + 1;
    });

    // Replace history entirely + recompute totalWishes from the new array.
    simState.wishHistory = valid;
    simState.totalWishes = valid.length;
    return valid.length;
}

// Module-level batch counter — incremented once per pushResultsToHistory call
// (i.e. once per doSinglePull / doTenPull). All entries from the same call
// share the same batchId, which the achievement detector uses to group
// pulls unambiguously (vs timestamp proximity which is unreliable).
let nextBatchId = 1;

function pushResultsToHistory(results: PullResult[], bannerId: string): WishResult[] {
    // Hoist Date.now() + batchId out of the map so all entries in this batch
    // share the same timestamp prefix (useful for debugging) and batch ID.
    // pullNumber is computed from the index so we don't mutate simState inside
    // the map (cleaner, and avoids the side-effect-in-map fragility flagged
    // in the audit — M1).
    const now = Date.now();
    const batchId = nextBatchId++;
    const startPullNumber = simState.totalWishes + 1;
    const newEntries: WishResult[] = results.map((r, i) => ({
        id: `${r.id}-${now}-${i}-${Math.random().toString(36).slice(2, 8)}`,
        pullNumber: startPullNumber + i,
        name: r.name,
        type: r.type,
        rarity: r.rarity,
        element: r.element,
        icon: r.iconUrl,
        fallbackIcon: r.bannerIconUrl,
        pityCount: r.pityAtPull,
        is5050Win: r.rarity === 5 ? r.isRateUp : undefined,
        isRateUp: r.isRateUp,
        isGuaranteed: r.isGuaranteed,
        bannerId,
        timestamp: now,
        batchId
    }));
    simState.totalWishes += newEntries.length;
    simState.wishHistory = [...simState.wishHistory, ...newEntries];
    return newEntries;
}

// ─── Apply Pity Lock (called after each pull batch) ──────────────────────────
// If pity lock is enabled (on the active mode) and a 5★/4★ was pulled, reset
// pity to the locked value instead of 0. This lets users test "what if I'm at
// soft pity" repeatedly — independently per banner.

function applyPityLock(results: PullResult[], newState: GachaState): void {
    const pulled5 = results.some((r) => r.rarity === 5);
    const pulled4 = results.some((r) => r.rarity === 4);
    const m = activeMode();

    m.pity5 = newState.pity5;
    m.pity4 = newState.pity4;

    if (pulled5 && m.pityLock5 !== null) {
        m.pity5 = m.pityLock5;
    }
    if (pulled4 && m.pityLock4 !== null) {
        m.pity4 = m.pityLock4;
    }
}

// ─── Build GachaState snapshot from simState (active mode) ───────────────────

function snapshotGachaState(): GachaState {
    const m = activeMode();
    return {
        pity5: m.pity5,
        pity4: m.pity4,
        guaranteed5: m.guaranteed5,
        guaranteed4: m.guaranteed4,
        totalPulls: simState.totalWishes,
        history: []
    };
}

// ─── Character Event Wish (existing, uses registered banner) ────────────────

type PullOutcome =
    | { ok: true; result: PullResult; wish: WishResult }
    | { ok: false; reason: 'no_banner' | 'insufficient_primo' | 'novice_maxed' };

type TenPullOutcome =
    | { ok: true; results: PullResult[]; wishes: WishResult[] }
    | { ok: false; reason: 'no_banner' | 'insufficient_primo' | 'novice_maxed' };

function doSinglePull(): PullOutcome {
    if (simState.wishMode === 'character') {
        const banner = getActiveBanner();
        if (!banner) return { ok: false, reason: 'no_banner' };
        if (!canAfford(COST_SINGLE)) return { ok: false, reason: 'insufficient_primo' };

        setBannerPools(banner.featured5, banner.featured4, banner.standard4);
        const gachaState = snapshotGachaState();
        const { result, newState } = executePull(gachaState);

        simState.primogem -= COST_SINGLE;
        applyPityLock([result], newState);
        // Sync guaranteed flags back to the active mode.
        const m = activeMode();
        m.guaranteed5 = newState.guaranteed5;
        m.guaranteed4 = newState.guaranteed4;

        const wishes = pushResultsToHistory([result], banner.id);
        return { ok: true, result, wish: wishes[0] };
    }

    if (simState.wishMode === 'standard') {
        if (!canAfford(COST_SINGLE)) return { ok: false, reason: 'insufficient_primo' };
        const gachaState = snapshotGachaState();
        const { result, newState } = executeStandardPull(gachaState);

        simState.primogem -= COST_SINGLE;
        applyPityLock([result], newState);
        const m = activeMode();
        m.guaranteed5 = newState.guaranteed5;
        m.guaranteed4 = newState.guaranteed4;

        const wishes = pushResultsToHistory([result], 'standard');
        return { ok: true, result, wish: wishes[0] };
    }

    // Novice wish
    if (simState.novicePullsUsed >= NOVICE_MAX_PULLS) return { ok: false, reason: 'novice_maxed' };
    if (!canAfford(COST_SINGLE)) return { ok: false, reason: 'insufficient_primo' };
    const gachaState = snapshotGachaState();
    const { result, newState } = executeStandardPull(gachaState);

    simState.primogem -= COST_SINGLE;
    applyPityLock([result], newState);
    const m = activeMode();
    m.guaranteed5 = newState.guaranteed5;
    m.guaranteed4 = newState.guaranteed4;
    simState.novicePullsUsed = Math.min(NOVICE_MAX_PULLS, simState.novicePullsUsed + 1);

    const wishes = pushResultsToHistory([result], 'novice');
    return { ok: true, result, wish: wishes[0] };
}

function doTenPull(): TenPullOutcome {
    if (simState.wishMode === 'character') {
        const banner = getActiveBanner();
        if (!banner) return { ok: false, reason: 'no_banner' };
        if (!canAfford(COST_TEN)) return { ok: false, reason: 'insufficient_primo' };

        setBannerPools(banner.featured5, banner.featured4, banner.standard4);
        const gachaState = snapshotGachaState();
        const { results, newState } = executeMultiPull(gachaState, 10);

        simState.primogem -= COST_TEN;
        applyPityLock(results, newState);
        const m = activeMode();
        m.guaranteed5 = newState.guaranteed5;
        m.guaranteed4 = newState.guaranteed4;

        const wishes = pushResultsToHistory(results, banner.id);
        return { ok: true, results, wishes };
    }

    if (simState.wishMode === 'standard') {
        if (!canAfford(COST_TEN)) return { ok: false, reason: 'insufficient_primo' };
        const gachaState = snapshotGachaState();
        const { results, newState } = executeStandardMultiPull(gachaState, 10);

        simState.primogem -= COST_TEN;
        applyPityLock(results, newState);
        const m = activeMode();
        m.guaranteed5 = newState.guaranteed5;
        m.guaranteed4 = newState.guaranteed4;

        const wishes = pushResultsToHistory(results, 'standard');
        return { ok: true, results, wishes };
    }

    // Novice wish — guard against exceeding the 20-pull cap. A 10-pull is only
    // allowed if there's room for all 10 (novicePullsUsed + 10 <= 20). This
    // matches the wish-page canTen guard; the duplicate check here defends
    // against any caller that bypasses the UI (e.g. keyboard shortcut races).
    if (simState.novicePullsUsed + 10 > NOVICE_MAX_PULLS) return { ok: false, reason: 'novice_maxed' };
    if (!canAfford(NOVICE_COST_TEN)) return { ok: false, reason: 'insufficient_primo' };

    const gachaState = snapshotGachaState();
    let results: PullResult[];
    let newState: GachaState;

    if (!simState.noviceFirstTenUsed) {
        // First 10-pull: slot 1 = guaranteed Noelle
        // Manually craft the Noelle result
        const noellePity5 = activeMode().pity5 + 1;
        const noellePity4 = activeMode().pity4 + 1;
        const noelle: PullResult = {
            id: 'noelle',
            name: 'Noelle',
            rarity: 4,
            type: 'character',
            element: 'Geo',
            isRateUp: true,
            isGuaranteed: true,
            iconUrl: 'https://genshin.jmp.blue/characters/noelle/icon-big',
            pityAtPull: noellePity4
        };

        // Process the Noelle pull manually in the gacha state
        const afterNoelle: GachaState = {
            ...gachaState,
            pity5: noellePity5,
            pity4: 0,  // reset 4★ pity since we pulled a 4★
            totalPulls: gachaState.totalPulls + 1,
            history: [noelle]
        };

        // Pull remaining 9 from standard wish
        const { results: rest, newState: afterRest } = executeStandardMultiPull(afterNoelle, 9);
        results = [noelle, ...rest];
        newState = afterRest;
        simState.noviceFirstTenUsed = true;
    } else {
        const { results: all, newState: afterAll } = executeStandardMultiPull(gachaState, 10);
        results = all;
        newState = afterAll;
    }

    simState.primogem -= NOVICE_COST_TEN;
    applyPityLock(results, newState);
    const m = activeMode();
    m.guaranteed5 = newState.guaranteed5;
    m.guaranteed4 = newState.guaranteed4;
    simState.novicePullsUsed = Math.min(NOVICE_MAX_PULLS, simState.novicePullsUsed + 10);

    const wishes = pushResultsToHistory(results, 'novice');
    return { ok: true, results, wishes };
}

// ─── Exported Store API ──────────────────────────────────────────────────────

export function getGameState() {
    const m = activeMode();
    return {
        // ── Reactive State (active mode — backward compat getters) ──
        // These read from `simState.modes[simState.wishMode]` so they always
        // reflect the currently selected banner. Components that need to read
        // a SPECIFIC mode's pity regardless of which is active should use
        // `getModePity(mode)` below.
        get primogem() { return simState.primogem; },
        get pity5() { return activeMode().pity5; },
        get pity4() { return activeMode().pity4; },
        get guaranteed5() { return activeMode().guaranteed5; },
        get guaranteed4() { return activeMode().guaranteed4; },
        get wishHistory() { return simState.wishHistory; },
        get totalWishes() { return simState.totalWishes; },
        get selectedBannerId() { return simState.selectedBannerId; },
        get pityLock5() { return activeMode().pityLock5; },
        get pityLock4() { return activeMode().pityLock4; },
        get wishMode() { return simState.wishMode; },
        get novicePullsUsed() { return simState.novicePullsUsed; },
        get noviceFirstTenUsed() { return simState.noviceFirstTenUsed; },
        get skipAnimation() { return simState.skipAnimation; },

        // ── Constants ──
        COST_SINGLE,
        COST_TEN,
        NOVICE_COST_TEN,
        NOVICE_MAX_PULLS,
        DEFAULT_PRIMOGEM,

        // ── Banner Registry ──
        registerBanner,
        selectBanner,
        getActiveBanner,

        // ── Mutations ──
        addPrimogem,
        canAfford,

        // Legacy single-mode setters (operate on the ACTIVE mode)
        setPity,
        setGuaranteed5,
        setPrimogem,
        setPityLock5,
        setPityLock4,

        // Explicit per-mode setters (preferred for new UI)
        getModePity,
        setModePity,
        setModeGuaranteed5,
        setModePityLock5,
        setModePityLock4,

        // Mode + animation preferences
        setWishMode,
        setSkipAnimation,

        resetAll,
        resetHistoryOnly,

        // ── Import / Export ──
        exportHistory,
        importHistory,

        // ── Pull ──
        doSinglePull,
        doTenPull
    };
}

export type GameStateApi = ReturnType<typeof getGameState>;
