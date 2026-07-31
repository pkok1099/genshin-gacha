// ─── Weapon Banner Engine (Epitomized Path) ──────────────────────────────────
// Genshin Impact's Weapon Event Banner:
//   • 5★ base rate: 0.7% (higher than character banner's 0.6%)
//   • Soft pity: ~63 (gentler ramp)
//   • Hard pity: 80 (lower than character banner's 90)
//   • Two featured 5★ weapons, each 37.5% chance (75% combined for featured)
//   • Epitomized Path: user picks ONE featured 5★. Getting the OTHER featured 5★
//     grants a fate point. At 2 fate points, the next 5★ is guaranteed to be
//     the chosen weapon.
//   • 4★ base rate: 6.0%, hard pity every 10 pulls
//   • Featured 4★ pool: 75% chance (split among 5 featured weapons)

export type Rarity = 3 | 4 | 5;
export type ItemType = 'character' | 'weapon';

export interface WeaponEntry {
    id: string;
    name: string;
    rarity: 3 | 4 | 5;
    iconUrl?: string;     // optional — jmp.blue URL
    fallbackIcon?: string; // optional — banner API URL
}

export interface WeaponPullResult {
    id: string;
    name: string;
    rarity: Rarity;
    type: ItemType;
    isFeatured: boolean;
    isChosenPath: boolean;       // true if this matches the Epitomized Path target
    iconUrl: string;
    fallbackIcon?: string;
    pityAtPull: number;
    fatePointChange: 0 | 1;      // +1 if you pulled the "wrong" featured 5★
    isGuaranteedChosen: boolean;  // true if fate points triggered guarantee
}

export interface WeaponBannerState {
    pity5: number;
    pity4: number;
    fatePoints: 0 | 1 | 2;
    totalPulls: number;
    chosenPathId: string | null;  // ID of selected featured 5★
}

export interface WeaponBannerPools {
    featured5: [WeaponEntry, WeaponEntry];   // exactly two 5★ featured
    featured4: WeaponEntry[];                // up to 5 featured 4★
    standard4: WeaponEntry[];                // standard 4★ weapons
    standard3: WeaponEntry[];                // 3★ weapons
}

// ─── Constants ───────────────────────────────────────────────────────────────

const BASE_5STAR_RATE = 0.007;
const SOFT_PITY_START = 63;
const HARD_PITY = 80;
const BASE_4STAR_RATE = 0.06;
const HARD_PITY_4STAR = 10;
const FEATURED_5STAR_TOTAL_CHANCE = 0.75; // split 37.5/37.5 between two featured
const FEATURED_4STAR_CHANCE = 0.75;       // 75% to get a featured 4★

// ─── Default 3★ Pool (verified against jmp.blue) ─────────────────────────────

const DEFAULT_3STAR_WEAPONS: WeaponEntry[] = [
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
].map((w) => ({ ...w, rarity: 3 as const, iconUrl: `https://genshin.jmp.blue/weapons/${w.id}/icon` }));

// ─── State Management ────────────────────────────────────────────────────────

export function createInitialWeaponState(): WeaponBannerState {
    return {
        pity5: 0,
        pity4: 0,
        fatePoints: 0,
        totalPulls: 0,
        chosenPathId: null
    };
}

let bannerPools: WeaponBannerPools | null = null;

export function setWeaponBannerPools(pools: WeaponBannerPools): void {
    bannerPools = pools;
}

export function setDefaultWeaponPools(featured5: [WeaponEntry, WeaponEntry], featured4: WeaponEntry[]): void {
    bannerPools = {
        featured5,
        featured4,
        standard4: [],
        standard3: DEFAULT_3STAR_WEAPONS
    };
}

// ─── RNG ─────────────────────────────────────────────────────────────────────

function rng(): number {
    if (typeof crypto === 'undefined' || !crypto.getRandomValues) return Math.random();
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] / (0xffffffff + 1);
}

function pickRandom<T>(arr: readonly T[]): T {
    return arr[Math.floor(rng() * arr.length)]!;
}

// ─── 5★ Rate Curve ───────────────────────────────────────────────────────────

export function get5StarWeaponRate(currentPityBeforePull: number): number {
    if (currentPityBeforePull < SOFT_PITY_START - 1) return BASE_5STAR_RATE;
    if (currentPityBeforePull >= HARD_PITY - 1) return 1.0;
    // Gentler ramp than character banner
    return BASE_5STAR_RATE + (currentPityBeforePull - (SOFT_PITY_START - 2)) * 0.05;
}

// ─── Single Pull ─────────────────────────────────────────────────────────────

export function executeWeaponPull(state: WeaponBannerState): { result: WeaponPullResult; newState: WeaponBannerState } {
    if (!bannerPools) {
        throw new Error('Weapon banner pools not set. Call setDefaultWeaponPools() first.');
    }

    const s: WeaponBannerState = { ...state };
    s.pity5 += 1;
    s.pity4 += 1;
    s.totalPulls += 1;

    const pityBefore = s.pity5 - 1;
    const rate5 = get5StarWeaponRate(pityBefore);
    const roll = rng();
    let result: WeaponPullResult;

    if (s.pity5 >= HARD_PITY || roll < rate5) {
        // ── 5★ Obtained ──
        let chosenWeapon: WeaponEntry;
        let isFeatured = false;
        let isChosenPath = false;
        let fatePointChange: 0 | 1 = 0;
        let isGuaranteedChosen = false;

        if (s.fatePoints >= 2) {
            // Guaranteed the chosen weapon
            chosenWeapon = bannerPools.featured5.find((w) => w.id === s.chosenPathId) ?? bannerPools.featured5[0]!;
            isFeatured = true;
            isChosenPath = true;
            isGuaranteedChosen = true;
            s.fatePoints = 0;
        } else if (rng() < FEATURED_5STAR_TOTAL_CHANCE) {
            // Featured (one of two)
            // If chosen path is set: 50/50 between chosen and the other featured
            if (s.chosenPathId && rng() < 0.5) {
                chosenWeapon = bannerPools.featured5.find((w) => w.id === s.chosenPathId) ?? bannerPools.featured5[0]!;
                isChosenPath = true;
                s.fatePoints = 0;
            } else {
                // The OTHER featured weapon — fate point +1
                chosenWeapon = bannerPools.featured5.find((w) => w.id !== s.chosenPathId) ?? bannerPools.featured5[1]!;
                if (s.chosenPathId) {
                    fatePointChange = 1;
                    s.fatePoints = Math.min(2, s.fatePoints + 1) as 0 | 1 | 2;
                }
            }
            isFeatured = true;
        } else {
            // Standard 5★ weapon (lost the "featured" 75/25)
            // Pick from standard 5★ weapons pool. If empty, fall back to featured[0].
            chosenWeapon = pickRandomStandard5Star();
            s.fatePoints = 0;
        }

        result = {
            id: chosenWeapon.id,
            name: chosenWeapon.name,
            rarity: 5,
            type: 'weapon',
            isFeatured,
            isChosenPath,
            iconUrl: chosenWeapon.iconUrl ?? '',
            fallbackIcon: chosenWeapon.fallbackIcon,
            pityAtPull: s.pity5,
            fatePointChange,
            isGuaranteedChosen
        };
        s.pity5 = 0;
        s.pity4 = 0;
    } else if (s.pity4 >= HARD_PITY_4STAR || roll < rate5 + BASE_4STAR_RATE) {
        // ── 4★ Obtained ──
        let chosenWeapon: WeaponEntry;
        let isFeatured = false;

        if (bannerPools.featured4.length > 0 && rng() < FEATURED_4STAR_CHANCE) {
            chosenWeapon = pickRandom(bannerPools.featured4);
            isFeatured = true;
        } else if (bannerPools.standard4.length > 0) {
            chosenWeapon = pickRandom(bannerPools.standard4);
        } else {
            // Fallback: featured 4★ if no standard pool
            chosenWeapon = pickRandom(bannerPools.featured4.length > 0 ? bannerPools.featured4 : bannerPools.featured5);
        }

        result = {
            id: chosenWeapon.id,
            name: chosenWeapon.name,
            rarity: 4,
            type: 'weapon',
            isFeatured,
            isChosenPath: false,
            iconUrl: chosenWeapon.iconUrl ?? '',
            fallbackIcon: chosenWeapon.fallbackIcon,
            pityAtPull: s.pity4,
            fatePointChange: 0,
            isGuaranteedChosen: false
        };
        s.pity4 = 0;
    } else {
        // ── 3★ Weapon ──
        const chosenWeapon = pickRandom(bannerPools.standard3);
        result = {
            id: chosenWeapon.id,
            name: chosenWeapon.name,
            rarity: 3,
            type: 'weapon',
            isFeatured: false,
            isChosenPath: false,
            iconUrl: chosenWeapon.iconUrl ?? '',
            fallbackIcon: chosenWeapon.fallbackIcon,
            pityAtPull: s.pity5,
            fatePointChange: 0,
            isGuaranteedChosen: false
        };
    }

    return { result, newState: s };
}

// ─── Multi Pull ──────────────────────────────────────────────────────────────

export function executeWeaponMultiPull(state: WeaponBannerState, count: number): { results: WeaponPullResult[]; newState: WeaponBannerState } {
    const results: WeaponPullResult[] = [];
    let s = state;
    for (let i = 0; i < count; i++) {
        const { result, newState } = executeWeaponPull(s);
        results.push(result);
        s = newState;
    }
    return { results, newState: s };
}

// ─── Standard 5★ Weapons Pool (loss pool for Epitomized Path) ────────────────

const STANDARD_5STAR_WEAPONS: WeaponEntry[] = [
    { id: 'amos-bow',           name: "Amos' Bow" },
    { id: 'skyward-harp',       name: 'Skyward Harp' },
    { id: 'aquila-favonia',     name: 'Aquila Favonia' },
    { id: 'skyward-blade',      name: 'Skyward Blade' },
    { id: 'lost-prayer-to-the-sacred-winds', name: 'Lost Prayer to the Sacred Winds' },
    { id: 'skyward-atlas',      name: 'Skyward Atlas' },
    { id: 'wolf-s-gravestone',  name: "Wolf's Gravestone" },
    { id: 'skyward-pride',      name: 'Skyward Pride' },
    { id: 'primordial-jade-winged-spear', name: 'Primordial Jade Winged-Spear' },
    { id: 'skyward-spine',      name: 'Skyward Spine' }
].map((w) => ({ ...w, rarity: 5 as const, iconUrl: `https://genshin.jmp.blue/weapons/${w.id}/icon` }));

function pickRandomStandard5Star(): WeaponEntry {
    return pickRandom(STANDARD_5STAR_WEAPONS);
}

// ─── Constants Export ────────────────────────────────────────────────────────

export const WEAPON_BANNER_CONSTANTS = {
    BASE_5STAR_RATE,
    SOFT_PITY_START,
    HARD_PITY,
    BASE_4STAR_RATE,
    HARD_PITY_4STAR,
    FEATURED_5STAR_TOTAL_CHANCE,
    FEATURED_4STAR_CHANCE
} as const;
