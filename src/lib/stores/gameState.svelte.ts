// ─── Game State Store (Svelte 5 Runes + localStorage Persistence) ────────────
// Single source of truth for the wish simulator. All mutations are persisted
// to localStorage under the `genshin_sim_` prefix. Browser-only — SSR-safe.

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
}

export type WishMode = 'character' | 'standard' | 'novice';

export interface SimState {
    primogem: number;
    pity5: number;
    pity4: number;
    guaranteed5: boolean;
    guaranteed4: boolean;
    wishHistory: WishResult[];
    totalWishes: number;
    selectedBannerId: string;
    // Pity lock: if set, after pulling 5★/4★, pity resets to this value instead of 0
    pityLock5: number | null;
    pityLock4: number | null;
    // Wish mode selector
    wishMode: WishMode;
    // Novice wish tracking
    novicePullsUsed: number;       // 0-20
    noviceFirstTenUsed: boolean;   // whether first 10-pull (guaranteed Noelle) has been used
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'genshin_sim_state_v1';
const DEFAULT_PRIMOGEM = 16000;
const COST_SINGLE = 160;
const COST_TEN = 1600;
const NOVICE_COST_TEN = 1280;  // 20% discount (8 Acquaint Fate × 160)
const NOVICE_MAX_PULLS = 20;

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

function loadState(): SimState {
    if (!isBrowser()) return createInitialSimState();
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return createInitialSimState();
        const parsed = JSON.parse(raw) as Partial<SimState>;
        return {
            primogem: typeof parsed.primogem === 'number' ? parsed.primogem : DEFAULT_PRIMOGEM,
            pity5: parsed.pity5 ?? 0,
            pity4: parsed.pity4 ?? 0,
            guaranteed5: parsed.guaranteed5 ?? false,
            guaranteed4: parsed.guaranteed4 ?? false,
            wishHistory: Array.isArray(parsed.wishHistory) ? parsed.wishHistory : [],
            totalWishes: parsed.totalWishes ?? 0,
            selectedBannerId: parsed.selectedBannerId ?? '',
            pityLock5: parsed.pityLock5 ?? null,
            pityLock4: parsed.pityLock4 ?? null,
            wishMode: (parsed.wishMode === 'standard' || parsed.wishMode === 'novice') ? parsed.wishMode : 'character',
            novicePullsUsed: parsed.novicePullsUsed ?? 0,
            noviceFirstTenUsed: parsed.noviceFirstTenUsed ?? false
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
        pity5: 0,
        pity4: 0,
        guaranteed5: false,
        guaranteed4: false,
        wishHistory: [],
        totalWishes: 0,
        selectedBannerId: '',
        pityLock5: null,
        pityLock4: null,
        wishMode: 'character',
        novicePullsUsed: 0,
        noviceFirstTenUsed: false
    };
}

// ─── Reactive State (Svelte 5 Runes) ─────────────────────────────────────────

let simState: SimState = $state(loadState());

// Persist on every change — DEBOUNCED to avoid localStorage write on every keystroke
// (JSON.stringify on every $effect fire was the main perf bottleneck)
let persistTimer: ReturnType<typeof setTimeout> | null = null;

$effect.root(() => {
    $effect(() => {
        // Touch the reactive deps we want to track (granular, not deep-watch)
        void simState.primogem;
        void simState.pity5;
        void simState.pity4;
        void simState.guaranteed5;
        void simState.guaranteed4;
        void simState.totalWishes;
        void simState.selectedBannerId;
        void simState.pityLock5;
        void simState.pityLock4;
        void simState.wishMode;
        void simState.novicePullsUsed;
        void simState.noviceFirstTenUsed;
        void simState.wishHistory.length;

        // Debounce: collapse rapid successive mutations into one localStorage write
        if (persistTimer) clearTimeout(persistTimer);
        persistTimer = setTimeout(() => {
            persistState(simState);
            persistTimer = null;
        }, 150);
    });
});

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

function setPity(pity5: number, pity4: number): void {
    simState.pity5 = Math.max(0, Math.min(89, pity5));
    simState.pity4 = Math.max(0, Math.min(9, pity4));
}

function setGuaranteed5(value: boolean): void {
    simState.guaranteed5 = value;
}

function setPrimogem(amount: number): void {
    // Clamp to non-negative integer; allow 0.
    const safe = Math.max(0, Math.floor(Number.isFinite(amount) ? amount : 0));
    simState.primogem = safe;
}

function setPityLock5(value: number | null): void {
    // null = disabled (normal reset to 0); number = lock to that value
    if (value === null) {
        simState.pityLock5 = null;
    } else {
        simState.pityLock5 = Math.max(0, Math.min(89, Math.floor(value)));
    }
}

function setPityLock4(value: number | null): void {
    if (value === null) {
        simState.pityLock4 = null;
    } else {
        simState.pityLock4 = Math.max(0, Math.min(9, Math.floor(value)));
    }
}

function setWishMode(mode: WishMode): void {
    simState.wishMode = mode;
}

function resetAll(): void {
    simState.primogem = DEFAULT_PRIMOGEM;
    simState.pity5 = 0;
    simState.pity4 = 0;
    simState.guaranteed5 = false;
    simState.guaranteed4 = false;
    simState.wishHistory = [];
    simState.totalWishes = 0;
    simState.selectedBannerId = '';
    simState.pityLock5 = null;
    simState.pityLock4 = null;
    simState.wishMode = 'character';
    simState.novicePullsUsed = 0;
    simState.noviceFirstTenUsed = false;
}

function resetHistoryOnly(): void {
    simState.wishHistory = [];
    simState.totalWishes = 0;
}

function pushResultsToHistory(results: PullResult[], bannerId: string): WishResult[] {
    const newEntries: WishResult[] = results.map((r) => {
        const entry: WishResult = {
            id: `${r.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            pullNumber: simState.totalWishes + 1,
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
            timestamp: Date.now()
        };
        simState.totalWishes += 1;
        return entry;
    });
    simState.wishHistory = [...simState.wishHistory, ...newEntries];
    return newEntries;
}

// ─── Apply Pity Lock (called after each pull batch) ──────────────────────────
// If pity lock is enabled and a 5★/4★ was pulled, reset pity to locked value
// instead of 0. This lets users test "what if I'm at soft pity" repeatedly.

function applyPityLock(results: PullResult[], newState: GachaState): void {
    const pulled5 = results.some((r) => r.rarity === 5);
    const pulled4 = results.some((r) => r.rarity === 4);

    simState.pity5 = newState.pity5;
    simState.pity4 = newState.pity4;

    if (pulled5 && simState.pityLock5 !== null) {
        simState.pity5 = simState.pityLock5;
    }
    if (pulled4 && simState.pityLock4 !== null) {
        simState.pity4 = simState.pityLock4;
    }
}

// ─── Build GachaState snapshot from simState ─────────────────────────────────

function snapshotGachaState(): GachaState {
    return {
        pity5: simState.pity5,
        pity4: simState.pity4,
        guaranteed5: simState.guaranteed5,
        guaranteed4: simState.guaranteed4,
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
        simState.guaranteed5 = newState.guaranteed5;
        simState.guaranteed4 = newState.guaranteed4;

        const wishes = pushResultsToHistory([result], banner.id);
        return { ok: true, result, wish: wishes[0] };
    }

    if (simState.wishMode === 'standard') {
        if (!canAfford(COST_SINGLE)) return { ok: false, reason: 'insufficient_primo' };
        const gachaState = snapshotGachaState();
        const { result, newState } = executeStandardPull(gachaState);

        simState.primogem -= COST_SINGLE;
        applyPityLock([result], newState);
        // Standard wish has no guaranteed flags, but keep them synced
        simState.guaranteed5 = newState.guaranteed5;
        simState.guaranteed4 = newState.guaranteed4;

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
    simState.guaranteed5 = newState.guaranteed5;
    simState.guaranteed4 = newState.guaranteed4;
    simState.novicePullsUsed += 1;

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
        simState.guaranteed5 = newState.guaranteed5;
        simState.guaranteed4 = newState.guaranteed4;

        const wishes = pushResultsToHistory(results, banner.id);
        return { ok: true, results, wishes };
    }

    if (simState.wishMode === 'standard') {
        if (!canAfford(COST_TEN)) return { ok: false, reason: 'insufficient_primo' };
        const gachaState = snapshotGachaState();
        const { results, newState } = executeStandardMultiPull(gachaState, 10);

        simState.primogem -= COST_TEN;
        applyPityLock(results, newState);
        simState.guaranteed5 = newState.guaranteed5;
        simState.guaranteed4 = newState.guaranteed4;

        const wishes = pushResultsToHistory(results, 'standard');
        return { ok: true, results, wishes };
    }

    // Novice wish
    if (simState.novicePullsUsed >= NOVICE_MAX_PULLS) return { ok: false, reason: 'novice_maxed' };
    if (!canAfford(NOVICE_COST_TEN)) return { ok: false, reason: 'insufficient_primo' };

    const gachaState = snapshotGachaState();
    let results: PullResult[];
    let newState: GachaState;

    if (!simState.noviceFirstTenUsed) {
        // First 10-pull: slot 1 = guaranteed Noelle
        // Manually craft the Noelle result
        const noellePity5 = simState.pity5 + 1;
        const noellePity4 = simState.pity4 + 1;
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
    simState.guaranteed5 = newState.guaranteed5;
    simState.guaranteed4 = newState.guaranteed4;
    simState.novicePullsUsed += 10;

    const wishes = pushResultsToHistory(results, 'novice');
    return { ok: true, results, wishes };
}

// ─── Exported Store API ──────────────────────────────────────────────────────

export function getGameState() {
    return {
        // ── Reactive State ──
        get primogem() { return simState.primogem; },
        get pity5() { return simState.pity5; },
        get pity4() { return simState.pity4; },
        get guaranteed5() { return simState.guaranteed5; },
        get guaranteed4() { return simState.guaranteed4; },
        get wishHistory() { return simState.wishHistory; },
        get totalWishes() { return simState.totalWishes; },
        get selectedBannerId() { return simState.selectedBannerId; },
        get pityLock5() { return simState.pityLock5; },
        get pityLock4() { return simState.pityLock4; },
        get wishMode() { return simState.wishMode; },
        get novicePullsUsed() { return simState.novicePullsUsed; },
        get noviceFirstTenUsed() { return simState.noviceFirstTenUsed; },

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
        setPity,
        setGuaranteed5,
        setPrimogem,
        setPityLock5,
        setPityLock4,
        setWishMode,
        resetAll,
        resetHistoryOnly,

        // ── Pull ──
        doSinglePull,
        doTenPull
    };
}

export type GameStateApi = ReturnType<typeof getGameState>;
