// ─── Luck Score Calculator ───────────────────────────────────────────────────
// Computes a 0-100 luck score from wish history, factoring in 5★ rate,
// average pity, 50/50 win rate, and pull volume.

import type { WishResult } from '$lib/stores/gameState.svelte';

export interface LuckStats {
    totalWishes: number;
    count5: number;
    count4: number;
    count3: number;
    actual5StarRate: number;       // % of pulls that were 5★
    averagePityPer5Star: number;   // average pulls between 5★
    bestPity: number | null;       // lowest pity5 at which a 5★ was hit
    worstPity: number | null;      // highest pity5 at which a 5★ was hit
    wins5050: number;
    losses5050: number;
    winRate5050: number;           // 0-1
    luckScore: number;             // 0-100
    luckLabel: LuckLabel;
}

export type LuckLabel =
    | 'Sangat Sial'
    | 'Sial'
    | 'Normal'
    | 'Beruntung'
    | 'Sangat Beruntung'
    | 'BLESSED';

// ─── Public API ──────────────────────────────────────────────────────────────

export function calculateLuckStats(history: WishResult[]): LuckStats {
    const totalWishes = history.length;

    const fiveStars = history.filter((h) => h.rarity === 5);
    const fourStars = history.filter((h) => h.rarity === 4);
    const threeStars = history.filter((h) => h.rarity === 3);

    const count5 = fiveStars.length;
    const count4 = fourStars.length;
    const count3 = threeStars.length;

    const actual5StarRate = totalWishes > 0 ? (count5 / totalWishes) * 100 : 0;

    // Average pity between consecutive 5★s.
    // We approximate "pulls per 5★" using the pityAtPull field stored per wish.
    let averagePityPer5Star = 0;
    let bestPity: number | null = null;
    let worstPity: number | null = null;

    if (count5 > 0) {
        const pities = fiveStars.map((s) => s.pityCount);
        const sum = pities.reduce((a, b) => a + b, 0);
        averagePityPer5Star = sum / count5;
        bestPity = Math.min(...pities);
        worstPity = Math.max(...pities);
    }

    const wins5050 = fiveStars.filter((s) => s.is5050Win === true).length;
    const losses5050 = fiveStars.filter((s) => s.is5050Win === false).length;
    const total5050 = wins5050 + losses5050;
    const winRate5050 = total5050 > 0 ? wins5050 / total5050 : 0;

    const luckScore = computeLuckScore({
        totalWishes,
        count5,
        actual5StarRate,
        averagePityPer5Star,
        wins5050,
        losses5050,
        total5050
    });

    return {
        totalWishes,
        count5,
        count4,
        count3,
        actual5StarRate,
        averagePityPer5Star,
        bestPity,
        worstPity,
        wins5050,
        losses5050,
        winRate5050,
        luckScore,
        luckLabel: labelForScore(luckScore)
    };
}

// ─── Scoring Heuristic ───────────────────────────────────────────────────────
// We blend three sub-scores, each normalized to 0-100:
//   1. Rate score   — how far above the 1.6% "expected" 5★ rate you are.
//   2. Pity score   — lower average pity = luckier (soft-pity hits vs hard pity).
//   3. 50/50 score  — win-rate vs the 50% baseline.
// Final = 0.5*rate + 0.3*pity + 0.2*fifty50, then nudged by sample size.

interface ScoreInputs {
    totalWishes: number;
    count5: number;
    actual5StarRate: number;     // percent (0-100)
    averagePityPer5Star: number;
    wins5050: number;
    losses5050: number;
    total5050: number;
}

function computeLuckScore(input: ScoreInputs): number {
    if (input.totalWishes < 10) return 50; // not enough data — neutral

    // (1) Rate score: expected ~1.6% (5★ over a long session with soft pity).
    //     1.6% = 50, 0% = 0, 4%+ = 100.
    const expectedRate = 1.6;
    const rateScore = clamp((input.actual5StarRate / (expectedRate * 2)) * 100, 0, 100);

    // (2) Pity score: 90 = 0 (hard pity), 5 = 100 (miracle).
    //     Use 75 as the midpoint (soft pity zone).
    let pityScore = 50;
    if (input.count5 > 0) {
        const ap = input.averagePityPer5Star;
        // Map 90 → 0, 75 → 50, 5 → 100
        if (ap >= 75) {
            pityScore = clamp(50 - ((ap - 75) / 15) * 50, 0, 50);
        } else {
            pityScore = clamp(50 + ((75 - ap) / 70) * 50, 50, 100);
        }
    }

    // (3) 50/50 score: 50% win rate = 50, 100% = 100, 0% = 0
    let fiftyScore = 50;
    if (input.total5050 > 0) {
        const winRate = input.wins5050 / input.total5050;
        fiftyScore = clamp(winRate * 100, 0, 100);
    }

    const blended = 0.5 * rateScore + 0.3 * pityScore + 0.2 * fiftyScore;

    // Small-sample penalty: damp extreme scores when N is small
    const sampleFactor = Math.min(1, input.totalWishes / 200);
    const shrunk = 50 + (blended - 50) * (0.5 + 0.5 * sampleFactor);

    return Math.round(clamp(shrunk, 0, 100));
}

function labelForScore(score: number): LuckLabel {
    if (score >= 90) return 'BLESSED';
    if (score >= 75) return 'Sangat Beruntung';
    if (score >= 60) return 'Beruntung';
    if (score >= 40) return 'Normal';
    if (score >= 25) return 'Sial';
    return 'Sangat Sial';
}

function clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
}
