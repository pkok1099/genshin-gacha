// ─── Genshin Impact Gacha Engine ──────────────────────────────────────────────
// Faithful reimplementation of Genshin Impact's character-event banner gacha:
//   • 5★ base 0.6%, soft pity from pull 74, hard pity at pull 90
//   • 4★ base 5.1%, hard pity every 10 pulls (5★ also resets 4★ pity)
//   • 50/50 on featured 5★, with guaranteed featured on next 5★ after a loss
//   • 50/50 on featured 4★ (when pool is non-empty)
// Pure functions — no side effects, no I/O. RNG via crypto.getRandomValues.

export type Rarity = 3 | 4 | 5;
export type ItemType = 'character' | 'weapon';

export interface PullResult {
    id: string;
    name: string;
    rarity: Rarity;
    type: ItemType;
    element?: string;
    isRateUp: boolean;
    isGuaranteed: boolean;
    iconUrl: string;
    bannerIconUrl?: string;
    pityAtPull: number;          // pity5 *before* this pull was resolved (1-indexed)
}

export interface GachaState {
    pity5: number;
    pity4: number;
    guaranteed5: boolean;
    guaranteed4: boolean;
    totalPulls: number;
    history: PullResult[];
}

export interface BannerPoolEntry {
    id: string;
    name: string;
    element: string;
    bannerIconUrl?: string;
}

export interface BannerPools {
    featured5: BannerPoolEntry | null;
    featured4: BannerPoolEntry[];
    standard4: BannerPoolEntry[];
}

// ─── Rate Constants ──────────────────────────────────────────────────────────

const BASE_5STAR_RATE = 0.006;
const SOFT_PITY_START = 74;
const HARD_PITY = 90;
const BASE_4STAR_RATE = 0.051;
const HARD_PITY_4STAR = 10;
const RATE_UP_5STAR_CHANCE = 0.5;
const RATE_UP_4STAR_CHANCE = 0.5;

// ─── Static Pools ────────────────────────────────────────────────────────────

export interface Standard5StarEntry {
    id: string;
    name: string;
    element: string;
}

/** 5★ Standard characters (lose-50/50 pool). Per spec. */
const STANDARD_5STAR: Standard5StarEntry[] = [
    { id: 'diluc', name: 'Diluc', element: 'Pyro' },
    { id: 'jean', name: 'Jean', element: 'Anemo' },
    { id: 'keqing', name: 'Keqing', element: 'Electro' },
    { id: 'mona', name: 'Mona', element: 'Hydro' },
    { id: 'qiqi', name: 'Qiqi', element: 'Cryo' },
    { id: 'tighnari', name: 'Tighnari', element: 'Dendro' },
    { id: 'dehya', name: 'Dehya', element: 'Pyro' }
];

/** 3★ weapons pool. Per spec, slugs verified against genshin.jmp.blue.
 *  Note: 'sharpshooters-oath' and 'seasoned-hunters-bow' removed because
 *  jmp.blue returns 404 for them.
 */
const WEAPONS_3STAR: { id: string; name: string }[] = [
    { id: 'cool-steel', name: 'Cool Steel' },
    { id: 'skyrider-sword', name: 'Skyrider Sword' },
    { id: 'harbinger-of-dawn', name: "Harbinger of Dawn" },
    { id: 'slingshot', name: 'Slingshot' },
    { id: 'magic-guide', name: 'Magic Guide' },
    { id: 'thrilling-tales-of-dragon-slayers', name: 'Thrilling Tales' },
    { id: 'emerald-orb', name: 'Emerald Orb' },
    { id: 'raven-bow', name: 'Raven Bow' },
    { id: 'white-tassel', name: 'White Tassel' },
    { id: 'black-tassel', name: 'Black Tassel' },
    { id: 'debate-club', name: 'Debate Club' },
    { id: 'bloodtainted-greatsword', name: 'Bloodtainted Greatsword' },
    { id: 'ferrous-shadow', name: 'Ferrous Shadow' }
];

// ─── Image URL Helpers ───────────────────────────────────────────────────────

const API_BASE = 'https://genshin.jmp.blue';

function charIconUrl(slug: string): string {
    return `${API_BASE}/characters/${slug}/icon-big`;
}

function weaponIconUrl(slug: string): string {
    return `${API_BASE}/weapons/${slug}/icon`;
}

// ─── Cryptographic RNG ───────────────────────────────────────────────────────

function rng(): number {
    if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
        // Fallback for environments without crypto (shouldn't happen in browser)
        return Math.random();
    }
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] / (0xffffffff + 1);
}

function pickRandom<T>(arr: readonly T[]): T {
    return arr[Math.floor(rng() * arr.length)]!;
}

// ─── 5★ Rate Curve (Soft Pity) ───────────────────────────────────────────────

export function get5StarRate(currentPityBeforePull: number): number {
    // currentPityBeforePull is the number of pulls since last 5★ (0 = fresh).
    // The roll is performed *before* incrementing for this pull.
    if (currentPityBeforePull < SOFT_PITY_START - 1) return BASE_5STAR_RATE;
    if (currentPityBeforePull >= HARD_PITY - 1) return 1.0;
    // Soft pity ramp: 6% increase per pull starting at pull 74
    return BASE_5STAR_RATE + (currentPityBeforePull - (SOFT_PITY_START - 2)) * 0.06;
}

// ─── Banner Pool Management ──────────────────────────────────────────────────

let featured5Star: BannerPoolEntry | null = null;
let featured4Star: BannerPoolEntry[] = [];
let standard4Star: BannerPoolEntry[] = [];

export function setBannerPools(
    f5: BannerPoolEntry | null,
    f4: BannerPoolEntry[],
    s4: BannerPoolEntry[]
): void {
    featured5Star = f5;
    featured4Star = f4;
    standard4Star = s4;
}

// ─── Single Pull ─────────────────────────────────────────────────────────────

export function executePull(state: GachaState): { result: PullResult; newState: GachaState } {
    const s: GachaState = {
        ...state,
        history: [...state.history]
    };
    s.pity5 += 1;
    s.pity4 += 1;
    s.totalPulls += 1;

    const pityBeforeThisPull = s.pity5 - 1; // 0-indexed: number of pulls since last 5★
    const rate5 = get5StarRate(pityBeforeThisPull);
    const roll = rng();
    let result: PullResult;

    if (s.pity5 >= HARD_PITY || roll < rate5) {
        // ── 5★ Obtained ──
        let isRateUp: boolean;
        let isGuaranteed: boolean = s.guaranteed5;
        let char: BannerPoolEntry | Standard5StarEntry;

        if (s.guaranteed5 || rng() < RATE_UP_5STAR_CHANCE) {
            // Featured (either won 50/50, or guaranteed from previous loss)
            char = featured5Star ?? STANDARD_5STAR[0]!;
            isRateUp = true;
            s.guaranteed5 = false;
        } else {
            // Lost 50/50 — next 5★ is guaranteed featured
            char = pickRandom(STANDARD_5STAR);
            isRateUp = false;
            s.guaranteed5 = true;
        }

        const featuredIcon = 'bannerIconUrl' in char ? char.bannerIconUrl : undefined;
        const charId = char.id;
        result = {
            id: charId,
            name: char.name,
            rarity: 5,
            type: 'character',
            element: char.element,
            isRateUp,
            isGuaranteed,
            iconUrl: charIconUrl(charId),
            bannerIconUrl: featuredIcon,
            pityAtPull: s.pity5
        };
        s.pity5 = 0;
        s.pity4 = 0; // 5★ also resets 4★ pity
    } else if (s.pity4 >= HARD_PITY_4STAR || roll < rate5 + BASE_4STAR_RATE) {
        // ── 4★ Obtained ──
        let isRateUp = false;
        let char: BannerPoolEntry;

        if (s.guaranteed4 || (featured4Star.length > 0 && rng() < RATE_UP_4STAR_CHANCE)) {
            if (featured4Star.length > 0) {
                char = pickRandom(featured4Star);
                isRateUp = true;
                s.guaranteed4 = false;
            } else {
                char = pickRandom(standard4Star);
                s.guaranteed4 = false;
            }
        } else {
            // Lost 4★ 50/50
            if (standard4Star.length > 0) {
                char = pickRandom(standard4Star);
            } else {
                char = pickRandom(featured4Star);
                isRateUp = true;
            }
            s.guaranteed4 = true;
        }

        result = {
            id: char.id,
            name: char.name,
            rarity: 4,
            type: 'character',
            element: char.element,
            isRateUp,
            isGuaranteed: s.guaranteed4,
            iconUrl: charIconUrl(char.id),
            bannerIconUrl: char.bannerIconUrl,
            pityAtPull: s.pity4
        };
        s.pity4 = 0;
    } else {
        // ── 3★ Weapon ──
        const wpn = pickRandom(WEAPONS_3STAR);
        result = {
            id: wpn.id,
            name: wpn.name,
            rarity: 3,
            type: 'weapon',
            isRateUp: false,
            isGuaranteed: false,
            iconUrl: weaponIconUrl(wpn.id),
            pityAtPull: s.pity5
        };
    }

    s.history.push(result);
    return { result, newState: s };
}

// ─── Multi Pull ──────────────────────────────────────────────────────────────

export function executeMultiPull(state: GachaState, count: number): { results: PullResult[]; newState: GachaState } {
    const results: PullResult[] = [];
    let s = state;
    for (let i = 0; i < count; i++) {
        const { result, newState } = executePull(s);
        results.push(result);
        s = newState;
    }
    return { results, newState: s };
}

// ─── Initial State ───────────────────────────────────────────────────────────

export function createInitialState(): GachaState {
    return {
        pity5: 0,
        pity4: 0,
        guaranteed5: false,
        guaranteed4: false,
        totalPulls: 0,
        history: []
    };
}

// ─── Stats Helpers (exported for testing / luck module) ──────────────────────

export const GACHA_CONSTANTS = {
    BASE_5STAR_RATE,
    SOFT_PITY_START,
    HARD_PITY,
    BASE_4STAR_RATE,
    HARD_PITY_4STAR,
    RATE_UP_5STAR_CHANCE,
    RATE_UP_4STAR_CHANCE
} as const;
