// ─── Standard Wish Engine (Wanderlust Invocation) ────────────────────────────
// Permanent banner. No rate-up, no 50/50.
// 5★ pool: 8 standard characters + 10 standard weapons (50/50 split).
// 4★ pool: standard 4★ characters + standard 4★ weapons (50/50 split).
// 3★ pool: same 3★ weapons as character banner.
// Pity: same as character banner (5★ hard 90, soft 74; 4★ hard 10).

import type { Rarity, ItemType, PullResult, GachaState } from './gachaEngine';

// Re-export shared types for convenience
export type { Rarity, ItemType, PullResult, GachaState };

// ─── Rate Constants (same as character banner) ───────────────────────────────

const BASE_5STAR_RATE = 0.006;
const SOFT_PITY_START = 74;
const HARD_PITY = 90;
const BASE_4STAR_RATE = 0.051;
const HARD_PITY_4STAR = 10;

// 5★ character / weapon split (official: 0.3% char + 0.3% weapon = 0.6% total)
const CHAR_WEAPON_SPLIT = 0.5; // 50% char, 50% weapon

// ─── 5★ Standard Characters ──────────────────────────────────────────────────

const STANDARD_5STAR_CHARS: { id: string; name: string; element: string }[] = [
    { id: 'jean',    name: 'Jean',    element: 'Anemo' },
    { id: 'diluc',   name: 'Diluc',   element: 'Pyro' },
    { id: 'mona',    name: 'Mona',    element: 'Hydro' },
    { id: 'keqing',  name: 'Keqing',  element: 'Electro' },
    { id: 'qiqi',    name: 'Qiqi',    element: 'Cryo' },
    { id: 'tighnari', name: 'Tighnari', element: 'Dendro' },
    { id: 'dehya',   name: 'Dehya',   element: 'Pyro' },
    { id: 'mizuki',  name: 'Yumemizuki Mizuki', element: 'Anemo' }
];

// ─── 5★ Standard Weapons ─────────────────────────────────────────────────────

const STANDARD_5STAR_WEAPONS: { id: string; name: string }[] = [
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
];

// ─── 4★ Standard Characters ──────────────────────────────────────────────────

const STANDARD_4STAR_CHARS: { id: string; name: string; element: string }[] = [
    { id: 'bennett',   name: 'Bennett',   element: 'Pyro' },
    { id: 'xiangling',  name: 'Xiangling', element: 'Pyro' },
    { id: 'xingqiu',    name: 'Xingqiu',   element: 'Hydro' },
    { id: 'fischl',     name: 'Fischl',    element: 'Electro' },
    { id: 'sucrose',    name: 'Sucrose',   element: 'Anemo' },
    { id: 'beidou',     name: 'Beidou',    element: 'Electro' },
    { id: 'ningguang',  name: 'Ningguang', element: 'Geo' },
    { id: 'xinyan',     name: 'Xinyan',    element: 'Pyro' },
    { id: 'rosaria',    name: 'Rosaria',   element: 'Cryo' },
    { id: 'razor',      name: 'Razor',     element: 'Electro' },
    { id: 'noelle',     name: 'Noelle',    element: 'Geo' },
    { id: 'barbara',    name: 'Barbara',   element: 'Hydro' },
    { id: 'kaeya',      name: 'Kaeya',     element: 'Cryo' },
    { id: 'lisa',       name: 'Lisa',      element: 'Electro' },
    { id: 'amber',      name: 'Amber',     element: 'Pyro' },
    { id: 'collei',     name: 'Collei',    element: 'Dendro' },
    { id: 'dori',       name: 'Dori',      element: 'Electro' },
    { id: 'candace',    name: 'Candace',   element: 'Hydro' },
    { id: 'kuki-shinobu', name: 'Kuki Shinobu', element: 'Electro' },
    { id: 'gorou',      name: 'Gorou',     element: 'Geo' },
    { id: 'sayu',       name: 'Sayu',      element: 'Anemo' },
    { id: 'thoma',      name: 'Thoma',     element: 'Pyro' },
    { id: 'chongyun',   name: 'Chongyun',  element: 'Cryo' },
    { id: 'diona',      name: 'Diona',     element: 'Cryo' },
    { id: 'yanfei',     name: 'Yanfei',    element: 'Pyro' },
    { id: 'yun-jin',    name: 'Yun Jin',   element: 'Geo' },
    { id: 'shikanoin-heizou', name: 'Shikanoin Heizou', element: 'Anemo' },
    { id: 'layla',      name: 'Layla',     element: 'Cryo' },
    { id: 'faruzan',    name: 'Faruzan',   element: 'Anemo' },
    { id: 'sara',       name: 'Kujou Sara', element: 'Electro' }
];

// ─── 4★ Standard Weapons (subset) ────────────────────────────────────────────

const STANDARD_4STAR_WEAPONS: { id: string; name: string }[] = [
    { id: 'sacrificial-sword',      name: 'Sacrificial Sword' },
    { id: 'sacrificial-greatsword', name: 'Sacrificial Greatsword' },
    { id: 'sacrificial-bow',        name: 'Sacrificial Bow' },
    { id: 'sacrificial-fragments',  name: 'Sacrificial Fragments' },
    { id: 'lion-s-roar',            name: "Lion's Roar" },
    { id: 'rainslasher',            name: 'Rainslasher' },
    { id: 'dragon-s-bane',          name: "Dragon's Bane" },
    { id: 'eye-of-perception',      name: 'Eye of Perception' },
    { id: 'favonius-sword',         name: 'Favonius Sword' },
    { id: 'favonius-greatsword',    name: 'Favonius Greatsword' },
    { id: 'favonius-lance',         name: 'Favonius Lance' },
    { id: 'favonius-warbow',        name: 'Favonius Warbow' },
    { id: 'favonius-codex',         name: 'Favonius Codex' },
    { id: 'stringless',             name: 'The Stringless' },
    { id: 'rust',                   name: 'Rust' },
    { id: 'wine-and-song',          name: 'Wine and Song' },
    { id: 'bell',                   name: 'The Bell' },
    { id: 'cinnabar-spindle',       name: 'Cinnabar Spindle' },
    { id: 'alley-hunter',           name: 'Alley Hunter' },
    { id: 'mappa-mare',             name: 'Mappa Mare' }
];

// ─── 3★ Weapons (same as character banner) ───────────────────────────────────

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

// ─── 5★ Rate Curve (same as character banner) ────────────────────────────────

export function get5StarRate(currentPityBeforePull: number): number {
    if (currentPityBeforePull < SOFT_PITY_START - 1) return BASE_5STAR_RATE;
    if (currentPityBeforePull >= HARD_PITY - 1) return 1.0;
    return BASE_5STAR_RATE + (currentPityBeforePull - (SOFT_PITY_START - 2)) * 0.06;
}

// ─── Single Pull ─────────────────────────────────────────────────────────────

export function executeStandardPull(state: GachaState): { result: PullResult; newState: GachaState } {
    const s: GachaState = { ...state, history: [...state.history] };
    s.pity5 += 1;
    s.pity4 += 1;
    s.totalPulls += 1;

    const pityBeforeThisPull = s.pity5 - 1;
    const rate5 = get5StarRate(pityBeforeThisPull);
    const roll = rng();
    let result: PullResult;

    if (s.pity5 >= HARD_PITY || roll < rate5) {
        // ── 5★ Obtained (50/50 char vs weapon, no rate-up) ──
        if (rng() < CHAR_WEAPON_SPLIT) {
            // 5★ Character
            const char = pickRandom(STANDARD_5STAR_CHARS);
            result = {
                id: char.id,
                name: char.name,
                rarity: 5,
                type: 'character',
                element: char.element,
                isRateUp: false,
                isGuaranteed: false,
                iconUrl: charIconUrl(char.id),
                pityAtPull: s.pity5
            };
        } else {
            // 5★ Weapon
            const wpn = pickRandom(STANDARD_5STAR_WEAPONS);
            result = {
                id: wpn.id,
                name: wpn.name,
                rarity: 5,
                type: 'weapon',
                isRateUp: false,
                isGuaranteed: false,
                iconUrl: weaponIconUrl(wpn.id),
                pityAtPull: s.pity5
            };
        }
        s.pity5 = 0;
        s.pity4 = 0;
    } else if (s.pity4 >= HARD_PITY_4STAR || roll < rate5 + BASE_4STAR_RATE) {
        // ── 4★ Obtained (50/50 char vs weapon, no rate-up) ──
        if (rng() < CHAR_WEAPON_SPLIT) {
            // 4★ Character
            const char = pickRandom(STANDARD_4STAR_CHARS);
            result = {
                id: char.id,
                name: char.name,
                rarity: 4,
                type: 'character',
                element: char.element,
                isRateUp: false,
                isGuaranteed: false,
                iconUrl: charIconUrl(char.id),
                pityAtPull: s.pity4
            };
        } else {
            // 4★ Weapon
            const wpn = pickRandom(STANDARD_4STAR_WEAPONS);
            result = {
                id: wpn.id,
                name: wpn.name,
                rarity: 4,
                type: 'weapon',
                isRateUp: false,
                isGuaranteed: false,
                iconUrl: weaponIconUrl(wpn.id),
                pityAtPull: s.pity4
            };
        }
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

export function executeStandardMultiPull(state: GachaState, count: number): { results: PullResult[]; newState: GachaState } {
    const results: PullResult[] = [];
    let s = state;
    for (let i = 0; i < count; i++) {
        const { result, newState } = executeStandardPull(s);
        results.push(result);
        s = newState;
    }
    return { results, newState: s };
}

// ─── Create Initial State ────────────────────────────────────────────────────

export function createInitialStandardState(): GachaState {
    return {
        pity5: 0,
        pity4: 0,
        guaranteed5: false,
        guaranteed4: false,
        totalPulls: 0,
        history: []
    };
}

// ─── Pool Data (for UI display) ──────────────────────────────────────────────

export const STANDARD_WISH_POOLS = {
    fiveStarChars: STANDARD_5STAR_CHARS,
    fiveStarWeapons: STANDARD_5STAR_WEAPONS,
    fourStarChars: STANDARD_4STAR_CHARS,
    fourStarWeapons: STANDARD_4STAR_WEAPONS,
    threeStarWeapons: WEAPONS_3STAR
} as const;
