// ─── Talent Drop Engine (Weekly Boss Drops) ──────────────────────────────────
// Simulates weekly boss drops for talent upgrade materials.
//
// In Genshin Impact, weekly bosses drop "talent books" in three tiers:
//   • 5★ (e.g. "Tail of Boreas") — used at talent Lv. 9, 10
//   • 4★ (e.g. "Spirit Locket of Boreas") — used at Lv. 6, 7, 8
//   • 3★ (e.g. "Ring of Boreas") — used at Lv. 2, 3, 4, 5
//
// Pre-5.0 patch drop table per weekly boss claim (3 drops per claim):
//   • 5★ drop chance: ~16.67% per roll → expected 0.5 per claim
//   • 4★ drop chance: ~33.33% per roll → expected 1.0 per claim
//   • 3★ drop chance: ~50% per roll → expected 1.5 per claim
//
// Post-5.0 (current): first 3 weekly boss claims per week are guaranteed
// to drop at least one 5★ material. This engine implements the CURRENT
// behavior (with guaranteed 5★ on first 3 claims of the week).

export type TalentRarity = 3 | 4 | 5;

export interface TalentDropResult {
    claimNumber: number;        // 1-indexed
    drops: TalentDropItem[];    // exactly 3 drops per claim
    hasGuaranteed5Star: boolean; // true if this claim had a guaranteed 5★
}

export interface TalentDropItem {
    rarity: TalentRarity;
    quantity: number;           // always 1 per slot
    isGuaranteed: boolean;      // true if this drop was the weekly-guaranteed 5★
}

export interface TalentSimulation {
    bossName: string;
    claimsPerWeek: number;       // typically 3
    weeks: number;
    totalClaims: number;
    results: TalentDropResult[];
    totals: { r5: number; r4: number; r3: number };
    expected: { r5: number; r4: number; r3: number };
    surplusDeficit: { r5: number; r4: number; r3: number }; // vs requirement to max one talent (10/10/10)
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DROPS_PER_CLAIM = 3;

// Drop rates per slot (post-5.0 first-3-guaranteed behavior):
// Slot 1 (first 3 claims): 100% 5★ guaranteed
// After 3 claims / other slots: legacy rates
const LEGACY_RATES: { r5: number; r4: number; r3: number } = { r5: 0.1667, r4: 0.3333, r3: 0.5000 };

// To max a single character's talent from Lv. 1 → 10:
const TALENT_REQ_MAX = { r5: 6, r4: 9, r3: 18 };  // per talent (3 talents per char)

const BOSS_NAMES = [
    'Lupus Boreas, Dominator of Wolves',
    'Confront Stormterror',
    'Enter the Golden House',
    'Beneath the Dragon-Queller',
    'Narukami Island: Tenshukaku',
    'End of the Oneiric Eudigmia',
    'The Realm of Farakhkert',
    'Beginner Protector'
];

// ─── RNG ─────────────────────────────────────────────────────────────────────

function rng(): number {
    if (typeof crypto === 'undefined' || !crypto.getRandomValues) return Math.random();
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] / (0xffffffff + 1);
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function simulateTalentDrops(
    weeks: number,
    claimsPerWeek: number = 3,
    bossName?: string
): TalentSimulation {
    const totalClaims = weeks * claimsPerWeek;
    const results: TalentDropResult[] = [];

    let r5 = 0, r4 = 0, r3 = 0;

    for (let claimIdx = 0; claimIdx < totalClaims; claimIdx++) {
        const claimNumber = claimIdx + 1;
        const claimInWeek = (claimIdx % claimsPerWeek) + 1;
        const hasGuarantee = claimInWeek <= 3; // first 3 claims of each week get guarantee

        const drops: TalentDropItem[] = [];
        let guaranteedUsed = false;

        for (let slot = 0; slot < DROPS_PER_CLAIM; slot++) {
            let rarity: TalentRarity;
            let isGuaranteed = false;

            if (hasGuarantee && !guaranteedUsed) {
                // First eligible slot is guaranteed 5★
                rarity = 5;
                isGuaranteed = true;
                guaranteedUsed = true;
            } else {
                // Legacy rate roll
                const roll = rng();
                if (roll < LEGACY_RATES.r5) rarity = 5;
                else if (roll < LEGACY_RATES.r5 + LEGACY_RATES.r4) rarity = 4;
                else rarity = 3;
            }

            drops.push({ rarity, quantity: 1, isGuaranteed });
            if (rarity === 5) r5 += 1;
            else if (rarity === 4) r4 += 1;
            else r3 += 1;
        }

        results.push({ claimNumber, drops, hasGuaranteed5Star: hasGuarantee });
    }

    const expected = {
        r5: totalClaims * DROPS_PER_CLAIM * (3 / claimsPerWeek) * 1.0 + totalClaims * DROPS_PER_CLAIM * (1 - 3 / claimsPerWeek) * LEGACY_RATES.r5,
        r4: totalClaims * DROPS_PER_CLAIM * (1 - 3 / claimsPerWeek) * LEGACY_RATES.r4,
        r3: totalClaims * DROPS_PER_CLAIM * (1 - 3 / claimsPerWeek) * LEGACY_RATES.r3
    };

    // Surplus/deficit vs ONE talent max (10/10/10 → 6×5★ + 9×4★ + 18×3★ per talent × 3 talents)
    // For simplicity, compare against maxing ONE talent (single 6/9/18 requirement).
    const surplusDeficit = {
        r5: r5 - TALENT_REQ_MAX.r5,
        r4: r4 - TALENT_REQ_MAX.r4,
        r3: r3 - TALENT_REQ_MAX.r3
    };

    return {
        bossName: bossName ?? BOSS_NAMES[0]!,
        claimsPerWeek,
        weeks,
        totalClaims,
        results,
        totals: { r5, r4, r3 },
        expected,
        surplusDeficit
    };
}

// ─── Display Helpers ─────────────────────────────────────────────────────────

export function getTalentRequirementForMax(): { r5: number; r4: number; r3: number } {
    return { ...TALENT_REQ_MAX };
}

export function getAvailableBosses(): string[] {
    return [...BOSS_NAMES];
}

export const TALENT_DROP_CONSTANTS = {
    DROPS_PER_CLAIM,
    LEGACY_RATES,
    TALENT_REQ_MAX
} as const;
