// ─── Parametric Transformer Engine (Permanent) ───────────────────────────────
// Simulates the Parametric Transformer gadget (7-day cooldown).
// Feed 150 quality-points of materials → transmute into rewards.
//
// Reward table (per pack, from Genshin Wiki Loot System/Material Drop Distribution):
//   • Mora: fixed 20,000 per pack
//   • One of 5 material categories rolled:
//     - Character EXP (Wit/Experience/Advice): 2★ mean 3.76, 3★ mean 2.00
//     - Weapon EXP (Mystic/Fine/Enhancement Ore): 2★ mean 9.00, 3★ mean 4.00
//     - Ascension Gems: 2★ mean 2.00, 3★ mean 0.30
//     - Weapon Ascension Materials: 2★ mean 6.00, 3★ mean 0.40
//     - Talent Level-Up Materials: 2★ mean 4.00, 3★ mean 0.30

// ─── RNG ─────────────────────────────────────────────────────────────────────

function rng(): number {
    if (typeof crypto === 'undefined' || !crypto.getRandomValues) return Math.random();
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] / (0xffffffff + 1);
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type ParametricCategory =
    | 'characterExp'
    | 'weaponExp'
    | 'ascensionGems'
    | 'weaponAscension'
    | 'talentMaterials';

export interface ParametricDrop {
    category: ParametricCategory;
    mora: number;        // always 20000
    tier2Count: number;
    tier3Count: number;
}

export interface ParametricSimulation {
    drops: ParametricDrop[];
    totalMora: number;
    totalTier2: number;
    totalTier3: number;
    byCategory: Record<ParametricCategory, { t2: number; t3: number; count: number }>;
    cooldownDays: number;
}

// ─── Reward Tables ───────────────────────────────────────────────────────────

interface CategoryTable {
    tier2Mean: number;
    tier3Mean: number;
    label: string;
}

const CATEGORY_TABLES: Record<ParametricCategory, CategoryTable> = {
    characterExp:      { tier2Mean: 3.76, tier3Mean: 2.00, label: 'Character EXP Books' },
    weaponExp:         { tier2Mean: 9.00, tier3Mean: 4.00, label: 'Weapon EXP Ore' },
    ascensionGems:     { tier2Mean: 2.00, tier3Mean: 0.30, label: 'Ascension Gems' },
    weaponAscension:   { tier2Mean: 6.00, tier3Mean: 0.40, label: 'Weapon Ascension Mats' },
    talentMaterials:   { tier2Mean: 4.00, tier3Mean: 0.30, label: 'Talent Books' }
};

const ALL_CATEGORIES = Object.keys(CATEGORY_TABLES) as ParametricCategory[];

// Each pack rolls ONE category uniformly (community trick: input material type
// influences category, but for simulation we use uniform random).
// Officially the rate is undisclosed — using uniform distribution.

// ─── Helper: Poisson-like roll ───────────────────────────────────────────────

function rollCount(mean: number): number {
    // Simple approximation: integer part + 1 with probability of fractional part
    const floor = Math.floor(mean);
    const frac = mean - floor;
    return floor + (rng() < frac ? 1 : 0);
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function simulateParametricTransform(packs: number = 1): ParametricSimulation {
    const drops: ParametricDrop[] = [];
    const byCategory = {
        characterExp:    { t2: 0, t3: 0, count: 0 },
        weaponExp:       { t2: 0, t3: 0, count: 0 },
        ascensionGems:   { t2: 0, t3: 0, count: 0 },
        weaponAscension: { t2: 0, t3: 0, count: 0 },
        talentMaterials: { t2: 0, t3: 0, count: 0 }
    };

    let totalMora = 0;
    let totalT2 = 0, totalT3 = 0;

    for (let i = 0; i < packs; i++) {
        const category = ALL_CATEGORIES[Math.floor(rng() * ALL_CATEGORIES.length)]!;
        const table = CATEGORY_TABLES[category];

        const t2 = rollCount(table.tier2Mean);
        const t3 = rollCount(table.tier3Mean);
        const mora = 20000;

        drops.push({ category, mora, tier2Count: t2, tier3Count: t3 });
        totalMora += mora;
        totalT2 += t2;
        totalT3 += t3;
        byCategory[category].t2 += t2;
        byCategory[category].t3 += t3;
        byCategory[category].count += 1;
    }

    return {
        drops,
        totalMora,
        totalTier2: totalT2,
        totalTier3: totalT3,
        byCategory,
        cooldownDays: 7
    };
}

// ─── Public Helpers ──────────────────────────────────────────────────────────

export function getCategoryLabel(cat: ParametricCategory): string {
    return CATEGORY_TABLES[cat].label;
}

export function getAllCategories(): ParametricCategory[] {
    return [...ALL_CATEGORIES];
}

export const PARAMETRIC_CONSTANTS = {
    COOLDOWN_DAYS: 7,
    PACK_MORA: 20000,
    INPUT_QUALITY_POINTS: 150
} as const;
