// ─── Game State Store (Svelte 5 Runes + localStorage Persistence) ────────────
// Single source of truth for the wish simulator. All mutations are persisted
// to localStorage under the `genshin_sim_` prefix. Browser-only — SSR-safe.

import {
    createInitialState,
    executePull,
    executeMultiPull,
    setBannerPools,
    type GachaState,
    type PullResult,
    type BannerPools
} from '$lib/utils/gachaEngine';

// ─── Public Types (matches spec) ─────────────────────────────────────────────

export type Rarity = 3 | 4 | 5;
export type ItemType = 'character' | 'weapon';
export type BannerKind = 'character' | 'weapon';

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

export interface SimState {
    primogem: number;
    pity5: number;
    pity4: number;
    guaranteed5: boolean;
    guaranteed4: boolean;
    wishHistory: WishResult[];
    totalWishes: number;
    selectedBannerId: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'genshin_sim_state_v1';
const DEFAULT_PRIMOGEM = 16000;
const COST_SINGLE = 160;
const COST_TEN = 1600;

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
            selectedBannerId: parsed.selectedBannerId ?? ''
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
        selectedBannerId: ''
    };
}

// ─── Reactive State (Svelte 5 Runes) ─────────────────────────────────────────

let simState: SimState = $state(loadState());

// Persist on every change
$effect.root(() => {
    $effect(() => {
        // Deep-watch wishHistory + primitives by serializing
        const snapshot = JSON.stringify(simState);
        persistState(JSON.parse(snapshot) as SimState);
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

function resetAll(): void {
    simState.primogem = DEFAULT_PRIMOGEM;
    simState.pity5 = 0;
    simState.pity4 = 0;
    simState.guaranteed5 = false;
    simState.guaranteed4 = false;
    simState.wishHistory = [];
    simState.totalWishes = 0;
    simState.selectedBannerId = '';
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

function doSinglePull(): { ok: true; result: PullResult; wish: WishResult } | { ok: false; reason: 'no_banner' | 'insufficient_primo' } {
    const banner = getActiveBanner();
    if (!banner) return { ok: false, reason: 'no_banner' };
    if (!canAfford(COST_SINGLE)) return { ok: false, reason: 'insufficient_primo' };

    setBannerPools(banner.featured5, banner.featured4, banner.standard4);
    const gachaState: GachaState = {
        pity5: simState.pity5,
        pity4: simState.pity4,
        guaranteed5: simState.guaranteed5,
        guaranteed4: simState.guaranteed4,
        totalPulls: simState.totalWishes,
        history: []
    };
    const { result, newState } = executePull(gachaState);

    simState.primogem -= COST_SINGLE;
    simState.pity5 = newState.pity5;
    simState.pity4 = newState.pity4;
    simState.guaranteed5 = newState.guaranteed5;
    simState.guaranteed4 = newState.guaranteed4;

    const wishes = pushResultsToHistory([result], banner.id);
    return { ok: true, result, wish: wishes[0] };
}

function doTenPull(): { ok: true; results: PullResult[]; wishes: WishResult[] } | { ok: false; reason: 'no_banner' | 'insufficient_primo' } {
    const banner = getActiveBanner();
    if (!banner) return { ok: false, reason: 'no_banner' };
    if (!canAfford(COST_TEN)) return { ok: false, reason: 'insufficient_primo' };

    setBannerPools(banner.featured5, banner.featured4, banner.standard4);
    const gachaState: GachaState = {
        pity5: simState.pity5,
        pity4: simState.pity4,
        guaranteed5: simState.guaranteed5,
        guaranteed4: simState.guaranteed4,
        totalPulls: simState.totalWishes,
        history: []
    };
    const { results, newState } = executeMultiPull(gachaState, 10);

    simState.primogem -= COST_TEN;
    simState.pity5 = newState.pity5;
    simState.pity4 = newState.pity4;
    simState.guaranteed5 = newState.guaranteed5;
    simState.guaranteed4 = newState.guaranteed4;

    const wishes = pushResultsToHistory(results, banner.id);
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

        // ── Constants ──
        COST_SINGLE,
        COST_TEN,
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
        resetAll,
        resetHistoryOnly,

        // ── Pull ──
        doSinglePull,
        doTenPull
    };
}

export type GameStateApi = ReturnType<typeof getGameState>;
