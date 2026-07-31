// ─── Artifact Strongbox Engine (Permanent) ───────────────────────────────────
// Simulates Mystic Offering / Artifact Strongbox at AR45+.
// Trade 3 × 5★ artifacts → 1 random 5★ from chosen set.
//
// Substat distribution (better than domain!):
//   • 66% start with 3 substats
//   • 34% start with 4 substats (vs 20% in domain)
//
// Source: Genshin Wiki Loot System/Artifact Drop Distribution

import {
    rollArtifact,
    type ArtifactSlot,
    type ArtifactSimulation
} from './artifactRng';

export interface StrongboxResult {
    artifactsSpent: number;          // always 3 per strongbox
    strongboxesOpened: number;
    artifacts: ArtifactSimulation[]; // resulting artifacts
    fourSubstatCount: number;        // how many started with 4 substats
    fourSubstatRate: number;         // 0-1
}

export const STRONGBOX_COST = 3; // 3 input artifacts per 1 output

const FOUR_SUBSTAT_CHANCE = 0.34; // vs 0.20 in domain

// ─── RNG ─────────────────────────────────────────────────────────────────────

function rng(): number {
    if (typeof crypto === 'undefined' || !crypto.getRandomValues) return Math.random();
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] / (0xffffffff + 1);
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Open N strongboxes (each costs 3 input 5★ artifacts).
 * Returns N ArtifactSimulation objects.
 */
export function openStrongboxes(
    count: number,
    slot?: ArtifactSlot
): StrongboxResult {
    const artifacts: ArtifactSimulation[] = [];
    let fourSubCount = 0;

    for (let i = 0; i < count; i++) {
        // Determine initial substat count using strongbox's better odds
        const force4Subs = rng() < FOUR_SUBSTAT_CHANCE;

        const sim = rollArtifact(
            slot ?? randomSlot(),
            5, // strongbox always 5★
            undefined, // random main stat
            force4Subs ? 4 : 3
        );
        artifacts.push(sim);
        if (sim.initialSubstats.length === 4) fourSubCount += 1;
    }

    return {
        artifactsSpent: count * STRONGBOX_COST,
        strongboxesOpened: count,
        artifacts,
        fourSubstatCount: fourSubCount,
        fourSubstatRate: count > 0 ? fourSubCount / count : 0
    };
}

function randomSlot(): ArtifactSlot {
    const slots: ArtifactSlot[] = ['flower', 'plume', 'sands', 'goblet', 'circlet'];
    return slots[Math.floor(rng() * slots.length)]!;
}

export const STRONGBOX_CONSTANTS = {
    COST: STRONGBOX_COST,
    FOUR_SUBSTAT_CHANCE,
    DOMAIN_FOUR_SUBSTAT_CHANCE: 0.20 // for comparison display
} as const;
