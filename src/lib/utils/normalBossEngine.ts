// ─── Normal Boss Drop Engine (Permanent) ─────────────────────────────────────
// Simulates normal boss drops (Pyro Regisvine, Anemo Hypostasis, etc.) at WL8.
//
// Per 40-resin claim at WL8:
//   • 1 guaranteed 5★ artifact
//   • ~1.47 4★ artifacts
//   • ~2.1 3★ artifacts
//   • ~2.1 2★ artifacts
//   • Ascension gems: 3★ sliver ~2.16, 4★ fragment ~1.60, 5★ chunk ~0.144, 6★ gemstone ~0.014
//   • Boss-specific ascension material (e.g. Everflame Seed): 2-3 per claim
//
// Sources: Genshin Wiki Loot System/Material Drop Distribution + Artifact Drop Distribution

// ─── RNG ─────────────────────────────────────────────────────────────────────

function rng(): number {
    if (typeof crypto === 'undefined' || !crypto.getRandomValues) return Math.random();
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] / (0xffffffff + 1);
}

function rollChance(chance: number): boolean {
    return rng() < chance;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type ArtifactSlot = 'flower' | 'plume' | 'sands' | 'goblet' | 'circlet';
export type ArtifactRarity = 2 | 3 | 4 | 5;
export type GemRarity = 3 | 4 | 5 | 6;

export interface ArtifactDrop {
    rarity: ArtifactRarity;
    slot: ArtifactSlot;
}

export interface GemDrop {
    rarity: GemRarity;
    quantity: number;
}

export interface BossMaterialDrop {
    name: string;
    quantity: number;
}

export interface NormalBossRunResult {
    artifacts: ArtifactDrop[];
    gems: GemDrop[];
    bossMaterial: BossMaterialDrop;
    totalArtifacts: number;
    fiveStarArtifacts: number;
    fourStarArtifacts: number;
    totalGems: number;
    resinSpent: number;
    bossName: string;
}

// ─── Static Data ─────────────────────────────────────────────────────────────

const ARTIFACT_SLOTS: ArtifactSlot[] = ['flower', 'plume', 'sands', 'goblet', 'circlet'];

const NORMAL_BOSSES: { id: string; name: string; material: string; element: string }[] = [
    { id: 'pyro-regisvine',     name: 'Pyro Regisvine',         material: 'Everflame Seed',       element: 'Pyro' },
    { id: 'electro-hypostasis', name: 'Electro Hypostasis',     material: 'Lightning Prism',      element: 'Electro' },
    { id: 'cryo-regisvine',     name: 'Cryo Regisvine',         material: 'Hoarfrost Core',       element: 'Cryo' },
    { id: 'anemo-hypostasis',   name: 'Anemo Hypostasis',       material: 'Hurricane Seed',       element: 'Anemo' },
    { id: 'geo-hypostasis',     name: 'Geo Hypostasis',         material: 'Basalt Pillar',        element: 'Geo' },
    { id: 'hydro-hypostasis',   name: 'Hydro Hypostasis',       material: 'Cleansing Heart',      element: 'Hydro' },
    { id: 'maguu-kenki',        name: 'Maguu Kenki',            material: 'Marionette Core',      element: 'Anemo' },
    { id: 'perpetual-mechanical-array', name: 'Perpetual Mechanical Array', material: 'Perpetual Heart', element: 'Electro' },
    { id: 'bathysmal-vishap',   name: 'Bathysmal Vishap Herd',  material: 'Dragonheir\'s False Fin', element: 'Hydro' },
    { id: 'jadeplume-terrorshroom', name: 'Jadeplume Terrorshroom', material: 'Thunderclap Fruitcore', element: 'Electro' },
    { id: 'algorithm',          name: 'Algorithm of Semi-Intransient Matrix of Overseer Network', material: 'Light Guiding Tetrahedron', element: 'Electro' },
    { id: 'ariaen',             name: 'Setekh Wenut',           material: 'Pseudo-Stamens',       element: 'Anemo' },
    { id: 'emperor-of-fire-and-iron', name: 'Emperor of Fire and Iron', material: 'Emperor\'s Resolution', element: 'Pyro' },
    { id: 'frostborn-axolotl',  name: 'Frostborn Axolotl-Watcher', material: 'Star-Watcher\'s Crest', element: 'Cryo' },
    { id: 'koholasaurus-king',  name: 'Burnt-Flame-Lord-Koholasaurus-Whelp', material: 'Secret-King\'s Royal Mark', element: 'Hydro' }
];

// ─── Drop Simulations ────────────────────────────────────────────────────────

function rollArtifactCount(): { r5: number; r4: number; r3: number; r2: number } {
    // Means: 5★=1.0, 4★=1.47, 3★=2.1, 2★=2.1
    // Each rolls independently with given mean probability per slot
    // Total ~4.57 artifacts
    let r5 = 0, r4 = 0, r3 = 0, r2 = 0;

    // 5★: guaranteed exactly 1 (mean 1.0, fixed at WL8)
    r5 = 1;

    // 4★: mean 1.47 → roll twice with ~73.5% each
    for (let i = 0; i < 2; i++) {
        if (rollChance(0.735)) r4 += 1;
    }

    // 3★: mean 2.1 → roll 3 times with 70% each
    for (let i = 0; i < 3; i++) {
        if (rollChance(0.70)) r3 += 1;
    }

    // 2★: mean 2.1 → roll 3 times with 70% each
    for (let i = 0; i < 3; i++) {
        if (rollChance(0.70)) r2 += 1;
    }

    return { r5, r4, r3, r2 };
}

function rollGemDrops(): GemDrop[] {
    // Means at WL8: 3★ sliver ~2.16, 4★ fragment ~1.60, 5★ chunk ~0.144, 6★ gemstone ~0.014
    // Roll independent slots
    const drops: GemDrop[] = [];

    // 3★ sliver: 3 rolls × 72% = ~2.16
    let sliver = 0;
    for (let i = 0; i < 3; i++) {
        if (rollChance(0.72)) sliver += 1;
    }
    if (sliver > 0) drops.push({ rarity: 3, quantity: sliver });

    // 4★ fragment: 2 rolls × 80% = ~1.60
    let fragment = 0;
    for (let i = 0; i < 2; i++) {
        if (rollChance(0.80)) fragment += 1;
    }
    if (fragment > 0) drops.push({ rarity: 4, quantity: fragment });

    // 5★ chunk: ~14.4% chance
    if (rollChance(0.144)) {
        drops.push({ rarity: 5, quantity: 1 });
    }

    // 6★ gemstone: ~1.4% chance (very rare)
    if (rollChance(0.014)) {
        drops.push({ rarity: 6, quantity: 1 });
    }

    return drops;
}

function rollBossMaterial(): BossMaterialDrop {
    // 2-3 per claim, mean ~2.4
    const quantity = rollChance(0.4) ? 3 : (rollChance(0.5) ? 2 : 3);
    return { name: 'Boss Material', quantity };
}

export function simulateNormalBossRun(bossId?: string): NormalBossRunResult {
    const boss = bossId
        ? NORMAL_BOSSES.find((b) => b.id === bossId) ?? NORMAL_BOSSES[0]!
        : NORMAL_BOSSES[Math.floor(rng() * NORMAL_BOSSES.length)]!;

    const artifactRolls = rollArtifactCount();
    const artifacts: ArtifactDrop[] = [];

    for (let i = 0; i < artifactRolls.r5; i++) {
        artifacts.push({ rarity: 5, slot: ARTIFACT_SLOTS[Math.floor(rng() * 5)]! });
    }
    for (let i = 0; i < artifactRolls.r4; i++) {
        artifacts.push({ rarity: 4, slot: ARTIFACT_SLOTS[Math.floor(rng() * 5)]! });
    }
    for (let i = 0; i < artifactRolls.r3; i++) {
        artifacts.push({ rarity: 3, slot: ARTIFACT_SLOTS[Math.floor(rng() * 5)]! });
    }
    for (let i = 0; i < artifactRolls.r2; i++) {
        artifacts.push({ rarity: 2, slot: ARTIFACT_SLOTS[Math.floor(rng() * 5)]! });
    }

    const gems = rollGemDrops();
    const totalGems = gems.reduce((sum, g) => sum + g.quantity, 0);

    const bossMaterial: BossMaterialDrop = {
        name: boss.material,
        quantity: rollBossMaterial().quantity
    };

    return {
        artifacts,
        gems,
        bossMaterial,
        totalArtifacts: artifacts.length,
        fiveStarArtifacts: artifactRolls.r5,
        fourStarArtifacts: artifactRolls.r4,
        totalGems,
        resinSpent: 40,
        bossName: boss.name
    };
}

export function simulateNormalBossRuns(runs: number, bossId?: string): {
    runs: NormalBossRunResult[];
    totals: {
        artifacts: number;
        fiveStar: number;
        fourStar: number;
        gems: { r3: number; r4: number; r5: number; r6: number };
        bossMats: number;
    };
    totalResin: number;
} {
    const results: NormalBossRunResult[] = [];
    let arts = 0, r5 = 0, r4 = 0, bossMats = 0;
    let g3 = 0, g4 = 0, g5 = 0, g6 = 0;

    for (let i = 0; i < runs; i++) {
        const r = simulateNormalBossRun(bossId);
        results.push(r);
        arts += r.totalArtifacts;
        r5 += r.fiveStarArtifacts;
        r4 += r.fourStarArtifacts;
        bossMats += r.bossMaterial.quantity;
        for (const g of r.gems) {
            if (g.rarity === 3) g3 += g.quantity;
            else if (g.rarity === 4) g4 += g.quantity;
            else if (g.rarity === 5) g5 += g.quantity;
            else if (g.rarity === 6) g6 += g.quantity;
        }
    }

    return {
        runs: results,
        totals: {
            artifacts: arts,
            fiveStar: r5,
            fourStar: r4,
            gems: { r3: g3, r4: g4, r5: g5, r6: g6 },
            bossMats
        },
        totalResin: runs * 40
    };
}

// ─── Public Helpers ──────────────────────────────────────────────────────────

export function getAvailableBosses() {
    return NORMAL_BOSSES;
}

export const NORMAL_BOSS_CONSTANTS = {
    RESIN_PER_CLAIM: 40,
    GUARANTEED_5STAR_ARTIFACT: true
} as const;
