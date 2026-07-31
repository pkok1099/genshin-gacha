// ─── Artifact Substat Roller Engine ──────────────────────────────────────────
// Simulates Genshin Impact artifact enhancement from +0 to +20 (5★) or +0 to +16 (4★).
// At +0 an artifact has either 3 or 4 initial substats. Every +4 levels it gains
// either a new substat (if currently <4) or upgrades one existing substat by one
// of four possible step values.

export type ArtifactSlot = 'flower' | 'plume' | 'sands' | 'goblet' | 'circlet';
export type StatKey =
    | 'hp' | 'atk' | 'def'
    | 'hpPct' | 'atkPct' | 'defPct'
    | 'elementalMastery' | 'energyRecharge'
    | 'critRate' | 'critDmg'
    | 'physicalDmg' | 'pyroDmg' | 'hydroDmg' | 'electroDmg' | 'cryoDmg' | 'dendroDmg' | 'anemoDmg' | 'geoDmg'
    | 'healingBonus';

export interface StatValue {
    key: StatKey;
    value: number;       // raw value (e.g. 5.8 for critDmg, 16 for flat atk)
    isPercent: boolean;  // display hint
}

export interface ArtifactRoll {
    level: number;          // 0, 4, 8, 12, 16, 20 (5★)
    description: string;    // human-readable description of what happened
    newSubstat?: StatValue; // present if a new substat was added
    upgradedKey?: StatKey;  // present if an existing substat was upgraded
    upgradedBy?: number;    // the increment
}

export interface ArtifactSimulation {
    slot: ArtifactSlot;
    mainStat: StatValue;
    rarity: 5 | 4;
    initialSubstats: StatValue[];   // 3 or 4 entries at +0
    finalSubstats: StatValue[];     // 4 entries at +20
    rolls: ArtifactRoll[];          // chronological upgrade log
    totalUpgrades: number;          // count of upgrades applied
}

// ─── Static Data ─────────────────────────────────────────────────────────────

const RNG_STEPS: Record<StatKey, number[]> = {
    hp:                [209.0, 239.0, 268.0, 298.0],
    atk:               [13.6, 15.6, 17.5, 19.4],
    def:               [16.3, 18.7, 21.0, 23.3],
    hpPct:             [4.1, 4.4, 4.7, 5.0],
    atkPct:            [4.1, 4.4, 4.7, 5.0],
    defPct:            [5.1, 5.5, 5.9, 6.3],
    elementalMastery:  [16.3, 18.7, 21.0, 23.3],
    energyRecharge:    [4.5, 4.9, 5.3, 5.8],
    critRate:          [2.7, 2.9, 3.1, 3.3],
    critDmg:           [5.4, 5.8, 6.2, 6.6],
    physicalDmg:       [5.1, 5.5, 5.9, 6.3],
    pyroDmg:           [5.1, 5.5, 5.9, 6.3],
    hydroDmg:          [5.1, 5.5, 5.9, 6.3],
    electroDmg:        [5.1, 5.5, 5.9, 6.3],
    cryoDmg:           [5.1, 5.5, 5.9, 6.3],
    dendroDmg:         [5.1, 5.5, 5.9, 6.3],
    anemoDmg:          [5.1, 5.5, 5.9, 6.3],
    geoDmg:            [5.1, 5.5, 5.9, 6.3],
    healingBonus:      [5.1, 5.5, 5.9, 6.3]
};

const STAT_META: Record<StatKey, { label: string; isPercent: boolean }> = {
    hp:                { label: 'HP Flat',        isPercent: false },
    atk:               { label: 'ATK Flat',       isPercent: false },
    def:               { label: 'DEF Flat',       isPercent: false },
    hpPct:             { label: 'HP %',           isPercent: true },
    atkPct:            { label: 'ATK %',          isPercent: true },
    defPct:            { label: 'DEF %',          isPercent: true },
    elementalMastery:  { label: 'Elemental Mastery', isPercent: false },
    energyRecharge:    { label: 'Energy Recharge', isPercent: true },
    critRate:          { label: 'CRIT Rate',      isPercent: true },
    critDmg:           { label: 'CRIT DMG',       isPercent: true },
    physicalDmg:       { label: 'Physical DMG',   isPercent: true },
    pyroDmg:           { label: 'Pyro DMG',       isPercent: true },
    hydroDmg:          { label: 'Hydro DMG',      isPercent: true },
    electroDmg:        { label: 'Electro DMG',    isPercent: true },
    cryoDmg:           { label: 'Cryo DMG',       isPercent: true },
    dendroDmg:         { label: 'Dendro DMG',     isPercent: true },
    anemoDmg:          { label: 'Anemo DMG',      isPercent: true },
    geoDmg:            { label: 'Geo DMG',        isPercent: true },
    healingBonus:      { label: 'Healing Bonus',  isPercent: true }
};

/** All possible substats (excludes main-only stats like elemental DMG bonuses for goblet, healing bonus for circlet). */
const ALL_SUBSTAT_KEYS: StatKey[] = [
    'hp', 'atk', 'def',
    'hpPct', 'atkPct', 'defPct',
    'elementalMastery', 'energyRecharge',
    'critRate', 'critDmg'
];

// Main stat pools per slot
const MAIN_STAT_BY_SLOT: Record<ArtifactSlot, { key: StatKey; isPercent: boolean }[]> = {
    flower: [{ key: 'hp', isPercent: false }],
    plume:  [{ key: 'atk', isPercent: false }],
    sands:  [
        { key: 'atkPct', isPercent: true },
        { key: 'defPct', isPercent: true },
        { key: 'hpPct', isPercent: true },
        { key: 'elementalMastery', isPercent: false },
        { key: 'energyRecharge', isPercent: true }
    ],
    goblet: [
        { key: 'atkPct', isPercent: true },
        { key: 'defPct', isPercent: true },
        { key: 'hpPct', isPercent: true },
        { key: 'elementalMastery', isPercent: false },
        { key: 'physicalDmg', isPercent: true },
        { key: 'pyroDmg', isPercent: true },
        { key: 'hydroDmg', isPercent: true },
        { key: 'electroDmg', isPercent: true },
        { key: 'cryoDmg', isPercent: true },
        { key: 'dendroDmg', isPercent: true },
        { key: 'anemoDmg', isPercent: true },
        { key: 'geoDmg', isPercent: true }
    ],
    circlet: [
        { key: 'atkPct', isPercent: true },
        { key: 'defPct', isPercent: true },
        { key: 'hpPct', isPercent: true },
        { key: 'elementalMastery', isPercent: false },
        { key: 'critRate', isPercent: true },
        { key: 'critDmg', isPercent: true },
        { key: 'healingBonus', isPercent: true }
    ]
};

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

function pickRandomSteps(): number[] {
    const all = RNG_STEPS.critRate; // any 4-element array works
    const indices = [0, 1, 2, 3];
    // Fisher-Yates shuffle to randomize which step is picked each roll
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]]!;
    }
    return indices.map((i) => all[i]!);
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function rollArtifact(
    slot: ArtifactSlot,
    rarity: 5 | 4,
    mainStatOverride?: StatKey,
    forcedInitialCount?: 3 | 4
): ArtifactSimulation {
    const mainKey = mainStatOverride ?? pickRandom(MAIN_STAT_BY_SLOT[slot])!.key;
    const mainIsPercent = STAT_META[mainKey].isPercent;
    const mainValue = getMainStatBaseValue(mainKey, rarity);

    const mainStat: StatValue = { key: mainKey, value: mainValue, isPercent: mainIsPercent };

    // Available substats = ALL_SUBSTAT_KEYS minus main stat
    const available = ALL_SUBSTAT_KEYS.filter((k) => k !== mainKey);

    // Initial count: 5★ → 3 or 4 (75% chance of 3, 25% chance of 4); 4★ → 3 only (always 3)
    const initialCount = forcedInitialCount ?? (rarity === 5 ? (rng() < 0.75 ? 3 : 4) : 3);

    // Pick initial substats
    const shuffled = [...available].sort(() => rng() - 0.5);
    const initialSubstats: StatValue[] = shuffled.slice(0, initialCount).map((k) => {
        const steps = RNG_STEPS[k];
        const step = pickRandom(steps);
        return { key: k, value: step, isPercent: STAT_META[k].isPercent };
    });

    const rolls: ArtifactRoll[] = [];
    let currentSubs = [...initialSubstats];

    // Upgrade schedule: every +4 levels (5★: +4,+8,+12,+16,+20 → 5 upgrades; 4★: +4,+8,+12,+16 → 4 upgrades)
    const maxLevel = rarity === 5 ? 20 : 16;
    const levels: number[] = [];
    for (let lv = 4; lv <= maxLevel; lv += 4) levels.push(lv);

    for (const level of levels) {
        if (currentSubs.length < 4) {
            // Add new substat
            const taken = new Set(currentSubs.map((s) => s.key));
            const candidates = ALL_SUBSTAT_KEYS.filter((k) => !taken.has(k) && k !== mainKey);
            const newKey = pickRandom(candidates);
            const step = pickRandom(RNG_STEPS[newKey]);
            const newSub: StatValue = { key: newKey, value: step, isPercent: STAT_META[newKey].isPercent };
            currentSubs = [...currentSubs, newSub];
            rolls.push({
                level,
                description: `+${level}: Gained new substat ${STAT_META[newKey].label} (${formatValue(newSub)})`,
                newSubstat: newSub
            });
        } else {
            // Upgrade existing substat
            const target = pickRandom(currentSubs);
            const steps = RNG_STEPS[target.key];
            const increment = pickRandom(steps);
            target.value = roundTo(target.value + increment, 1);
            rolls.push({
                level,
                description: `+${level}: Upgraded ${STAT_META[target.key].label} by ${formatIncrement(increment, target.isPercent)} → ${formatValue(target)}`,
                upgradedKey: target.key,
                upgradedBy: increment
            });
        }
    }

    return {
        slot,
        mainStat,
        rarity,
        initialSubstats,
        finalSubstats: currentSubs,
        rolls,
        totalUpgrades: rolls.length
    };
}

// ─── Display Helpers ─────────────────────────────────────────────────────────

export function getStatLabel(key: StatKey): string {
    return STAT_META[key].label;
}

export function isStatPercent(key: StatKey): boolean {
    return STAT_META[key].isPercent;
}

export function formatValue(s: StatValue): string {
    return s.isPercent ? `${s.value.toFixed(1)}%` : Math.round(s.value).toString();
}

export function formatIncrement(value: number, isPercent: boolean): string {
    return isPercent ? `+${value.toFixed(1)}%` : `+${Math.round(value)}`;
}

function getMainStatBaseValue(key: StatKey, rarity: 5 | 4): number {
    // Base main stat value at +0 for 5★ / 4★ artifacts
    if (rarity === 5) {
        switch (key) {
            case 'hp': return 4780;
            case 'atk': return 311;
            case 'hpPct': case 'atkPct': case 'defPct': return 46.6;
            case 'elementalMastery': return 187;
            case 'energyRecharge': return 51.8;
            case 'critRate': return 31.1;
            case 'critDmg': return 62.2;
            case 'physicalDmg': case 'pyroDmg': case 'hydroDmg':
            case 'electroDmg': case 'cryoDmg': case 'dendroDmg':
            case 'anemoDmg': case 'geoDmg': return 46.6;
            case 'healingBonus': return 35.9;
            default: return 0;
        }
    } else {
        switch (key) {
            case 'hp': return 3571;
            case 'atk': return 232;
            case 'hpPct': case 'atkPct': case 'defPct': return 34.8;
            case 'elementalMastery': return 139;
            case 'energyRecharge': return 38.7;
            case 'critRate': return 23.2;
            case 'critDmg': return 46.4;
            case 'physicalDmg': case 'pyroDmg': case 'hydroDmg':
            case 'electroDmg': case 'cryoDmg': case 'dendroDmg':
            case 'anemoDmg': case 'geoDmg': return 34.8;
            case 'healingBonus': return 26.8;
            default: return 0;
        }
    }
}

function roundTo(v: number, digits: number): number {
    const f = Math.pow(10, digits);
    return Math.round(v * f) / f;
}
