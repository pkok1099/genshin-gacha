// ─── Domain Drop Engine (Permanent) ──────────────────────────────────────────
// Simulates 3 permanent domain types in Genshin Impact:
//
//   1. Talent Book Domain (Domain of Mastery) — 20 resin, daily rotation
//   2. Weapon Ascension Domain (Domain of Forgery) — 20 resin, daily rotation
//   3. Artifact Domain (Domain of Blessing) — 20 resin, 1 guaranteed 5★ at AR45+
//
// Drop distributions sourced from Genshin Wiki Loot System/Material Drop Distribution
// and Loot System/Artifact Drop Distribution (community-verified data).

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

function rollChance(chance: number): boolean {
    return rng() < chance;
}

// ════════════════════════════════════════════════════════════════════════════
// TALENT BOOK DOMAIN (Domain of Mastery)
// ════════════════════════════════════════════════════════════════════════════

export type TalentBookRarity = 2 | 3 | 4;

export interface TalentBookDrop {
    rarity: TalentBookRarity;
    quantity: number;
}

export interface TalentBookRunResult {
    drops: TalentBookDrop[];
    totalBooks: number;
    byRarity: { r2: number; r3: number; r4: number };
    resinSpent: number;
}

// AR45+ Level IV talent domain: ~2.2 green + ~2.0 blue + ~0.22 purple per run
// Per-pack: 90% 3★ (blue) / 10% 4★ (purple), ~2.2 packs/run
// Plus guaranteed ~2.2 green (2★) books

const TALENT_BOOK_PACK_RATES = { r3: 0.90, r4: 0.10 };
const TALENT_BOOK_PACK_COUNT_MIN = 2;
const TALENT_BOOK_PACK_COUNT_MAX = 3; // weighted toward 2
const TALENT_BOOK_GREEN_MEAN = 2.2;

export function simulateTalentBookRun(): TalentBookRunResult {
    const drops: TalentBookDrop[] = [];

    // Green (2★) books — guaranteed ~2.2 mean
    const greenCount = Math.floor(TALENT_BOOK_GREEN_MEAN) + (rollChance(0.2) ? 1 : 0);
    drops.push({ rarity: 2, quantity: greenCount });

    // Pack count: 2 or 3 (mean 2.2)
    const packCount = rollChance(0.8) ? TALENT_BOOK_PACK_COUNT_MIN : TALENT_BOOK_PACK_COUNT_MAX;

    let r3 = 0, r4 = 0;
    for (let i = 0; i < packCount; i++) {
        if (rollChance(TALENT_BOOK_PACK_RATES.r4)) {
            r4 += 1;
        } else {
            r3 += 1;
        }
    }
    if (r3 > 0) drops.push({ rarity: 3, quantity: r3 });
    if (r4 > 0) drops.push({ rarity: 4, quantity: r4 });

    return {
        drops,
        totalBooks: greenCount + r3 + r4,
        byRarity: { r2: greenCount, r3, r4 },
        resinSpent: 20
    };
}

export function simulateTalentBookRuns(runs: number): {
    runs: TalentBookRunResult[];
    totals: { r2: number; r3: number; r4: number };
    totalResin: number;
} {
    const results: TalentBookRunResult[] = [];
    let r2 = 0, r3 = 0, r4 = 0;
    for (let i = 0; i < runs; i++) {
        const r = simulateTalentBookRun();
        results.push(r);
        r2 += r.byRarity.r2;
        r3 += r.byRarity.r3;
        r4 += r.byRarity.r4;
    }
    return { runs: results, totals: { r2, r3, r4 }, totalResin: runs * 20 };
}

// ════════════════════════════════════════════════════════════════════════════
// WEAPON ASCENSION DOMAIN (Domain of Forgery)
// ════════════════════════════════════════════════════════════════════════════

export type WeaponAscensionRarity = 2 | 3 | 4 | 5;

export interface WeaponAscensionDrop {
    rarity: WeaponAscensionRarity;
    quantity: number;
}

export interface WeaponAscensionRunResult {
    drops: WeaponAscensionDrop[];
    totalMats: number;
    byRarity: { r2: number; r3: number; r4: number; r5: number };
    resinSpent: number;
}

// AR45+ Level IV weapon domain: ~2.2 green + ~2.4 blue + ~0.62 purple + ~0.062 gold per run
// Per-pack: 78% 3★ / 20% 4★ / 2% 5★, ~3.1 packs/run
// Plus guaranteed ~2.2 green (2★) mats

const WEAPON_PACK_RATES = { r3: 0.78, r4: 0.20, r5: 0.02 };
const WEAPON_PACK_COUNT_MEAN = 3.1;
const WEAPON_GREEN_MEAN = 2.2;

export function simulateWeaponAscensionRun(): WeaponAscensionRunResult {
    const drops: WeaponAscensionDrop[] = [];

    // Green (2★) — guaranteed
    const greenCount = Math.floor(WEAPON_GREEN_MEAN) + (rollChance(0.2) ? 1 : 0);
    drops.push({ rarity: 2, quantity: greenCount });

    // Pack count: 3 or 4 (mean 3.1)
    const packCount = rollChance(0.9) ? 3 : 4;

    let r3 = 0, r4 = 0, r5 = 0;
    for (let i = 0; i < packCount; i++) {
        const roll = rng();
        if (roll < WEAPON_PACK_RATES.r5) r5 += 1;
        else if (roll < WEAPON_PACK_RATES.r5 + WEAPON_PACK_RATES.r4) r4 += 1;
        else r3 += 1;
    }
    if (r3 > 0) drops.push({ rarity: 3, quantity: r3 });
    if (r4 > 0) drops.push({ rarity: 4, quantity: r4 });
    if (r5 > 0) drops.push({ rarity: 5, quantity: r5 });

    return {
        drops,
        totalMats: greenCount + r3 + r4 + r5,
        byRarity: { r2: greenCount, r3, r4, r5 },
        resinSpent: 20
    };
}

export function simulateWeaponAscensionRuns(runs: number): {
    runs: WeaponAscensionRunResult[];
    totals: { r2: number; r3: number; r4: number; r5: number };
    totalResin: number;
} {
    const results: WeaponAscensionRunResult[] = [];
    let r2 = 0, r3 = 0, r4 = 0, r5 = 0;
    for (let i = 0; i < runs; i++) {
        const r = simulateWeaponAscensionRun();
        results.push(r);
        r2 += r.byRarity.r2;
        r3 += r.byRarity.r3;
        r4 += r.byRarity.r4;
        r5 += r.byRarity.r5;
    }
    return { runs: results, totals: { r2, r3, r4, r5 }, totalResin: runs * 20 };
}

// ════════════════════════════════════════════════════════════════════════════
// ARTIFACT DOMAIN (Domain of Blessing)
// ════════════════════════════════════════════════════════════════════════════

export type ArtifactSlot = 'flower' | 'plume' | 'sands' | 'goblet' | 'circlet';
export type ArtifactRarity = 1 | 2 | 3 | 4 | 5;

export interface ArtifactDrop {
    rarity: ArtifactRarity;
    slot: ArtifactSlot;
    initialSubstatCount: 3 | 4;
}

export interface ArtifactDomainRunResult {
    drops: ArtifactDrop[];
    totalArtifacts: number;
    byRarity: { r1: number; r2: number; r3: number; r4: number; r5: number };
    fiveStarCount: number;
    fourStarCount: number;
    fourSubstatCount: number;
    resinSpent: number;
}

// AR45+ Level IV artifact domain distribution (mean per 20 resin):
//   5★: ~1.07 (guaranteed at least 1)
//   4★: ~1.07
//   3★: ~2.485
//   2★: ~3.55
//   Total: ~7.1

const ARTIFACT_SLOTS: ArtifactSlot[] = ['flower', 'plume', 'sands', 'goblet', 'circlet'];

function rollArtifactRarity(): ArtifactRarity {
    // Distribution probabilities (normalized from mean values, total ~7.1):
    // 5★: 1.07/7.1 = 15.07%
    // 4★: 1.07/7.1 = 15.07%
    // 3★: 2.485/7.1 = 35.00%
    // 2★: 3.55/7.1 = 50.00%  (but this overlaps with 5★+4★+3★ so we re-normalize)
    // Simpler: each of 7 slots rolls independently
    const r = rng();
    if (r < 0.1507) return 5;
    if (r < 0.3014) return 4;
    if (r < 0.6514) return 3;
    return 2;
}

function rollInitialSubstatCount(): 3 | 4 {
    // Domain: 80% start with 3 substats, 20% start with 4
    return rollChance(0.20) ? 4 : 3;
}

function rollArtifactCount(): number {
    // Mean 7.1, range 6-8
    const r = rng();
    if (r < 0.45) return 7;
    if (r < 0.775) return 6;
    return 8;
}

export function simulateArtifactDomainRun(): ArtifactDomainRunResult {
    const drops: ArtifactDrop[] = [];
    let r1 = 0, r2 = 0, r3 = 0, r4 = 0, r5 = 0;
    let fourSub = 0;

    // Guarantee at least 1 five-star at AR45+
    const total = rollArtifactCount();
    let fiveGuaranteed = false;

    for (let i = 0; i < total; i++) {
        let rarity = rollArtifactRarity();
        // Force at least one 5★
        if (i === total - 1 && !fiveGuaranteed && r5 === 0) {
            rarity = 5;
        }
        if (rarity === 5) fiveGuaranteed = true;

        const slot = pickRandom(ARTIFACT_SLOTS);
        const subs = rollInitialSubstatCount();
        if (subs === 4) fourSub += 1;

        drops.push({ rarity, slot, initialSubstatCount: subs });

        if (rarity === 1) r1 += 1;
        else if (rarity === 2) r2 += 1;
        else if (rarity === 3) r3 += 1;
        else if (rarity === 4) r4 += 1;
        else r5 += 1;
    }

    return {
        drops,
        totalArtifacts: total,
        byRarity: { r1, r2, r3, r4, r5 },
        fiveStarCount: r5,
        fourStarCount: r4,
        fourSubstatCount: fourSub,
        resinSpent: 20
    };
}

export function simulateArtifactDomainRuns(runs: number): {
    runs: ArtifactDomainRunResult[];
    totals: { r1: number; r2: number; r3: number; r4: number; r5: number };
    totalArtifacts: number;
    totalFiveStar: number;
    totalFourSub: number;
    totalResin: number;
} {
    const results: ArtifactDomainRunResult[] = [];
    let r1 = 0, r2 = 0, r3 = 0, r4 = 0, r5 = 0;
    let totalArts = 0, total5 = 0, total4sub = 0;
    for (let i = 0; i < runs; i++) {
        const r = simulateArtifactDomainRun();
        results.push(r);
        r1 += r.byRarity.r1;
        r2 += r.byRarity.r2;
        r3 += r.byRarity.r3;
        r4 += r.byRarity.r4;
        r5 += r.byRarity.r5;
        totalArts += r.totalArtifacts;
        total5 += r.fiveStarCount;
        total4sub += r.fourSubstatCount;
    }
    return {
        runs: results,
        totals: { r1, r2, r3, r4, r5 },
        totalArtifacts: totalArts,
        totalFiveStar: total5,
        totalFourSub: total4sub,
        totalResin: runs * 20
    };
}

// ─── Constants Export ────────────────────────────────────────────────────────

export const DOMAIN_CONSTANTS = {
    TALENT_BOOK_PACK_RATES,
    WEAPON_PACK_RATES,
    RESIN_PER_RUN: 20,
    ARTIFACT_DOMAIN_GUARANTEE_5STAR: true
} as const;
