// ─── Pity Calculator & What-If Simulator Math ────────────────────────────────
// Pure functions for computing Genshin Impact character-event banner odds:
//   • Cumulative probability of pulling 5★ in the next N pulls
//   • Expected pulls per 5★ / per Featured
//   • Best/worst case scenarios
//   • Monte Carlo simulation for "what-if" comparisons
//
// All math uses the official rates: 5★ base 0.6%, soft pity from pull 74,
// hard pity at pull 90, 50/50 on featured, guarantee on loss.

// ─── Rate Constants (mirrors gachaEngine.ts) ────────────────────────────────

const BASE_5STAR_RATE = 0.006;
const SOFT_PITY_START = 74;
const HARD_PITY = 90;
const RATE_UP_5STAR_CHANCE = 0.5;
const COST_SINGLE = 160;

// ─── 5★ Rate Curve (Soft Pity) ──────────────────────────────────────────────
// `pityBeforePull` is the number of pulls since last 5★ (0-indexed, so the
// very first pull after a 5★ is pity 0).

export function get5StarRate(pityBeforePull: number): number {
        if (pityBeforePull < SOFT_PITY_START - 1) return BASE_5STAR_RATE;
        if (pityBeforePull >= HARD_PITY - 1) return 1.0;
        // Soft pity ramp: ~6% per pull starting at pull 74
        return BASE_5STAR_RATE + (pityBeforePull - (SOFT_PITY_START - 2)) * 0.06;
}

// ─── Probability that the NEXT 5★ is Featured ───────────────────────────────
// Given the current guarantee state, returns the chance that the next 5★ you
// pull will be the featured character.
//
//   • If guaranteed (lost previous 50/50): 100%
//   • Otherwise: 50% (win) + 50% × 50% (lose → next is guaranteed → featured)
//              = 75%  (over two 5★ cycles, but we want "the next 5★ is featured")

export function pNext5IsFeatured(guaranteed: boolean): number {
        return guaranteed ? 1.0 : RATE_UP_5STAR_CHANCE;
}

// ─── Cumulative Probability of 5★ in N Pulls ────────────────────────────────
// Returns the probability of pulling at least one 5★ in the next N pulls,
// starting from `currentPity5`. Uses the official soft-pity ramp.
//
// Algorithm: walk pulls 1..N, compute P(5★ on pull i | no 5★ yet) using the
// per-pull rate at pity (currentPity5 + i - 1), then multiply complements.

export interface CumulativeResult {
        pullCount: number;          // 1..N
        p5StarByThisPull: number;   // cumulative P(at least one 5★ by pull i)
        pPerPull: number;           // P(5★ on this exact pull | no 5★ before)
}

export function cumulative5StarProbability(
        currentPity5: number,
        maxPulls: number
): CumulativeResult[] {
        const results: CumulativeResult[] = [];
        let cumulativeNo5 = 1; // P(no 5★ yet)

        for (let i = 1; i <= maxPulls; i++) {
                const pityBeforeThis = currentPity5 + (i - 1);
                // If we've already crossed hard pity in a prior iteration, the rate
                // here would be at 100% — but cumulativeNo5 would already be 0.
                const rate = pityBeforeThis >= HARD_PITY ? 1.0 : get5StarRate(pityBeforeThis);
                const pThis = rate; // P(5★ on this pull | no 5★ yet)
                cumulativeNo5 *= (1 - pThis);
                results.push({
                        pullCount: i,
                        p5StarByThisPull: 1 - cumulativeNo5,
                        pPerPull: pThis
                });
        }
        return results;
}

// ─── Expected Pulls Per 5★ (from current pity) ──────────────────────────────
// Walks the rate curve from current pity until 5★ is hit, summing E[X] as
// Σ P(X = k) × k. Cap at HARD_PITY since by then P=1.

export function expectedPullsPer5Star(currentPity5: number): number {
        let expected = 0;
        let cumulativeNo5 = 1;

        for (let k = 1; k <= HARD_PITY; k++) {
                const pityBeforeThis = currentPity5 + (k - 1);
                const rate = pityBeforeThis >= HARD_PITY ? 1.0 : get5StarRate(pityBeforeThis);
                const pThis = rate;
                const pExactK = cumulativeNo5 * pThis;
                expected += pExactK * k;
                cumulativeNo5 *= (1 - pThis);
                if (cumulativeNo5 < 1e-9) break;
        }
        return expected;
}

// ─── Expected Pulls Per Featured 5★ ─────────────────────────────────────────
// Two-state Markov: "fresh 50/50" or "guaranteed". From fresh:
//   • E[F] = E[X] + 0.5 × 0 + 0.5 × (E[X] + E[F'])
//     where E[F'] is the expected additional pulls given guarantee (which is
//     always resolved by the next 5★).
// Simplification: expected pulls per featured = E[X] × (1 + (1 - pWin) × 1)
//                                              = E[X] × (2 - pWin)
//   • If guaranteed: E[X] (the next 5★ is featured)
//   • If fresh 50/50: E[X] × (2 - 0.5) = 1.5 × E[X]

export function expectedPullsPerFeatured(currentPity5: number, guaranteed: boolean): number {
        const ex = expectedPullsPer5Star(currentPity5);
        if (guaranteed) return ex;
        // From fresh 50/50: average is 1.5× E[X] (win = 1×, lose+guarantee = 2×)
        return ex * 1.5;
}

// ─── Best / Worst Case ──────────────────────────────────────────────────────

export interface BestWorstCase {
        bestCase: number;   // pulls to featured (best)
        worstCase: number;  // pulls to featured (worst)
}

export function bestWorstCase(currentPity5: number, guaranteed: boolean): BestWorstCase {
        // Best case: 5★ on the very next pull AND it's featured
        //   - If guaranteed: next pull is featured → 1
        //   - If fresh: 5× on next pull AND win 50/50 → 1
        // (Either way, best case is "1 pull")
        const bestCase = 1;

        // Worst case: hard pity (90 - currentPity5) to get 5★, lose 50/50,
        // then hard pity again (90) to get guaranteed featured.
        const pityToHard = Math.max(1, HARD_PITY - currentPity5);
        const worstCase = guaranteed ? pityToHard : pityToHard + HARD_PITY;

        return { bestCase, worstCase };
}

// ─── Cumulative Probability of Featured in N Pulls ──────────────────────────
// More nuanced than P(5★) — accounts for the 50/50 + guarantee chain.
// Uses a 2-state Markov: state FRESH (50/50 active) and state GUARANTEED.
//
// P(featured in N pulls) = P(at least one featured in next N pulls)
//
// We compute by tracking joint probabilities:
//   pFresh[k] = P(at pull k, no featured yet, fresh state)
//   pGuar[k]  = P(at pull k, no featured yet, guaranteed state)
// Transitions:
//   From fresh at pull k with rate r:
//     - 5★ featured (r × 0.5): stop, count as success
//     - 5★ non-featured (r × 0.5): move to guaranteed at k+1
//     - No 5★ (1 - r): stay fresh at k+1
//   From guaranteed at pull k with rate r:
//     - 5★ featured (r × 1): stop, count as success
//     - No 5★ (1 - r): stay guaranteed at k+1

export interface FeaturedCumulativePoint {
        pullCount: number;
        pFeaturedByThisPull: number;
}

export function cumulativeFeaturedProbability(
        currentPity5: number,
        guaranteed: boolean,
        maxPulls: number
): FeaturedCumulativePoint[] {
        const results: FeaturedCumulativePoint[] = [];
        // Joint probabilities at start of pull k (no featured yet)
        let pFresh = guaranteed ? 0 : 1;
        let pGuar = guaranteed ? 1 : 0;
        let pSuccess = 0;

        for (let k = 1; k <= maxPulls; k++) {
                const pityBeforeThis = currentPity5 + (k - 1);
                const rate = pityBeforeThis >= HARD_PITY ? 1.0 : get5StarRate(pityBeforeThis);

                // Successes on this pull
                const sFresh = pFresh * rate * RATE_UP_5STAR_CHANCE;          // fresh → 5★ featured
                const sGuar = pGuar * rate * 1.0;                              // guaranteed → 5★ featured
                pSuccess += sFresh + sGuar;

                // Transitions to next iteration
                const lostFresh = pFresh * rate * (1 - RATE_UP_5STAR_CHANCE);  // fresh → 5★ non-featured → guaranteed next
                const stayFresh = pFresh * (1 - rate);                          // fresh, no 5★
                const stayGuar = pGuar * (1 - rate);                            // guaranteed, no 5★

                pFresh = stayFresh;
                pGuar = stayGuar + lostFresh;

                results.push({ pullCount: k, pFeaturedByThisPull: Math.min(1, pSuccess) });

                if (pFresh + pGuar < 1e-9) break;
        }
        return results;
}

// ─── Monte Carlo "What-If" Simulator ────────────────────────────────────────
// Runs N trials. Each trial: starting from (pity, guaranteed), pull repeatedly
// until you hit a featured 5★, recording:
//   • total pulls to first featured
//   • total 5★ obtained along the way
//   • primogem spent
// Returns aggregated stats + distribution of "pulls to first featured".

export interface WhatIfConfig {
        startingPity5: number;
        guaranteed: boolean;
        trials: number;
}

export interface WhatIfResult {
        trials: number;
        avgPullsToFeatured: number;
        medianPullsToFeatured: number;
        totalPulls: number;
        total5Stars: number;
        totalFeatured: number;          // always === trials
        featuredRate: number;           // totalFeatured / total5Stars
        avgPrimogemSpent: number;
        distribution: { bucket: string; count: number; pityMin: number; pityMax: number }[];
        perTrialPulls: number[];        // raw pulls-to-featured per trial
}

// Crypto-strength RNG like the rest of the codebase
function rng(): number {
        if (typeof crypto === 'undefined' || !crypto.getRandomValues) return Math.random();
        const arr = new Uint32Array(1);
        crypto.getRandomValues(arr);
        return arr[0] / (0xffffffff + 1);
}

export function runWhatIfSimulation(config: WhatIfConfig): WhatIfResult {
        // Clamp inputs defensively — the function is exported and could be
        // called with untrusted values (e.g. from localStorage-edited state).
        // startingPity5 must be in [0, HARD_PITY-1]; trials capped at 50000
        // to prevent main-thread freeze.
        const startingPity5 = Math.max(0, Math.min(HARD_PITY - 1, Math.floor(config.startingPity5)));
        const trials = Math.max(1, Math.min(50_000, Math.floor(config.trials)));
        const startGuaranteed = config.guaranteed;

        const perTrialPulls: number[] = [];
        let totalPulls = 0;
        let total5Stars = 0;
        let totalFeatured = 0;

        for (let trial = 0; trial < trials; trial++) {
                let pity = startingPity5;
                let guaranteed = startGuaranteed;
                let pulls = 0;
                let gotFeatured = false;

                // Pull until featured 5★ obtained (cap at 200 to avoid infinite loops)
                for (let safety = 0; safety < 200; safety++) {
                        pity += 1;
                        pulls += 1;
                        const rate = pity >= HARD_PITY ? 1.0 : get5StarRate(pity - 1);

                        if (rng() < rate) {
                                // Got a 5★
                                total5Stars += 1;
                                if (guaranteed || rng() < RATE_UP_5STAR_CHANCE) {
                                        // Featured!
                                        gotFeatured = true;
                                        break;
                                } else {
                                        // Lost 50/50 → next is guaranteed
                                        guaranteed = true;
                                }
                                pity = 0;
                        }
                }

                if (gotFeatured) totalFeatured++;
                perTrialPulls.push(pulls);
                totalPulls += pulls;
        }

        // Stats
        const sorted = [...perTrialPulls].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
        const avgPulls = totalPulls / trials;

        // Distribution buckets
        const BUCKETS = [
                { bucket: '1-10',  pityMin: 1,  pityMax: 10 },
                { bucket: '11-30', pityMin: 11, pityMax: 30 },
                { bucket: '31-50', pityMin: 31, pityMax: 50 },
                { bucket: '51-70', pityMin: 51, pityMax: 70 },
                { bucket: '71-90', pityMin: 71, pityMax: 90 },
                { bucket: '91-120', pityMin: 91, pityMax: 120 },
                { bucket: '121-180', pityMin: 121, pityMax: 180 }
        ];
        const distribution = BUCKETS.map((b) => ({
                ...b,
                count: perTrialPulls.filter((p) => p >= b.pityMin && p <= b.pityMax).length
        }));

        return {
                trials,
                avgPullsToFeatured: avgPulls,
                medianPullsToFeatured: median,
                totalPulls,
                total5Stars,
                totalFeatured,
                featuredRate: total5Stars > 0 ? totalFeatured / total5Stars : 0,
                avgPrimogemSpent: avgPulls * COST_SINGLE,
                distribution,
                perTrialPulls
        };
}

// ─── Async batched version ───────────────────────────────────────────────────
// Runs the same simulation as runWhatIfSimulation but yields to the event
// loop every BATCH_SIZE trials (via requestAnimationFrame) so the UI doesn't
// freeze on large trial counts. The calculator page uses this for its "Run"
// button — the synchronous version is still available for tests / small counts.
//
// Usage:  const result = await runWhatIfSimulationAsync(config, onProgress?);
// The optional onProgress callback receives (completed, total) so the UI can
// show a progress bar.

export async function runWhatIfSimulationAsync(
        config: WhatIfConfig,
        onProgress?: (completed: number, total: number) => void
): Promise<WhatIfResult> {
        const startingPity5 = Math.max(0, Math.min(HARD_PITY - 1, Math.floor(config.startingPity5)));
        const trials = Math.max(1, Math.min(50_000, Math.floor(config.trials)));
        const startGuaranteed = config.guaranteed;
        const BATCH_SIZE = 200;  // trials per frame — keeps each chunk <16ms

        const perTrialPulls: number[] = [];
        let totalPulls = 0;
        let total5Stars = 0;
        let totalFeatured = 0;

        for (let batchStart = 0; batchStart < trials; batchStart += BATCH_SIZE) {
                const batchEnd = Math.min(batchStart + BATCH_SIZE, trials);

                for (let trial = batchStart; trial < batchEnd; trial++) {
                        let pity = startingPity5;
                        let guaranteed = startGuaranteed;
                        let pulls = 0;
                        let gotFeatured = false;

                        for (let safety = 0; safety < 200; safety++) {
                                pity += 1;
                                pulls += 1;
                                const rate = pity >= HARD_PITY ? 1.0 : get5StarRate(pity - 1);

                                if (rng() < rate) {
                                        total5Stars += 1;
                                        if (guaranteed || rng() < RATE_UP_5STAR_CHANCE) {
                                                gotFeatured = true;
                                                break;
                                        } else {
                                                guaranteed = true;
                                        }
                                        pity = 0;
                                }
                        }

                        if (gotFeatured) totalFeatured++;
                        perTrialPulls.push(pulls);
                        totalPulls += pulls;
                }

                if (onProgress) onProgress(batchEnd, trials);
                // Yield to the event loop so the UI can paint the progress bar
                // and stay responsive. requestAnimationFrame fires before the
                // next paint, giving us ~60fps progress updates.
                await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        }

        const sorted = [...perTrialPulls].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
        const avgPulls = totalPulls / trials;

        const BUCKETS = [
                { bucket: '1-10',  pityMin: 1,  pityMax: 10 },
                { bucket: '11-30', pityMin: 11, pityMax: 30 },
                { bucket: '31-50', pityMin: 31, pityMax: 50 },
                { bucket: '51-70', pityMin: 51, pityMax: 70 },
                { bucket: '71-90', pityMin: 71, pityMax: 90 },
                { bucket: '91-120', pityMin: 91, pityMax: 120 },
                { bucket: '121-180', pityMin: 121, pityMax: 180 }
        ];
        const distribution = BUCKETS.map((b) => ({
                ...b,
                count: perTrialPulls.filter((p) => p >= b.pityMin && p <= b.pityMax).length
        }));

        return {
                trials,
                avgPullsToFeatured: avgPulls,
                medianPullsToFeatured: median,
                totalPulls,
                total5Stars,
                totalFeatured,
                featuredRate: total5Stars > 0 ? totalFeatured / total5Stars : 0,
                avgPrimogemSpent: avgPulls * COST_SINGLE,
                distribution,
                perTrialPulls
        };
}

// ─── Helper: pick a region based on element ─────────────────────────────────
// Used by AreaLoader to theme the loading screen by featured character.

export type Region = 'mondstadt' | 'liyue' | 'inazuma' | 'sumeru' | 'fontaine' | 'natlan';

const ELEMENT_TO_REGION: Record<string, Region> = {
        Anemo: 'mondstadt',
        Geo: 'liyue',
        Electro: 'inazuma',
        Dendro: 'sumeru',
        Hydro: 'fontaine',
        Pyro: 'natlan'
};

export function regionForElement(element?: string): Region {
        if (element && ELEMENT_TO_REGION[element]) return ELEMENT_TO_REGION[element]!;
        return 'mondstadt';
}
