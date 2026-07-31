// ─── Cooking Engine (Permanent) ──────────────────────────────────────────────
// Simulates cooking in Genshin Impact, including:
//   • Quality tiers: Suspicious / Normal / Delicious (per recipe star tier)
//   • Special dish conversion (when character specialty matches recipe)
//   • 12% bonus dupe talent (Jean, Hu Tao, Diona, Ayaka, Ayato, Yun Jin, Dori,
//     Faruzan, Gaming, Charlotte)
//
// Source: Genshin Wiki Special Dish page + community research

// ─── RNG ─────────────────────────────────────────────────────────────────────

function rng(): number {
    if (typeof crypto === 'undefined' || !crypto.getRandomValues) return Math.random();
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] / (0xffffffff + 1);
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type CookQuality = 'suspicious' | 'normal' | 'delicious' | 'special';
export type RecipeStars = 1 | 2 | 3 | 4;

export interface CookResult {
    quality: CookQuality;
    quantity: number;          // 1 or 2 (if dupe talent triggered)
    isSpecial: boolean;        // true if special dish produced
    dupeTriggered: boolean;    // true if 12% bonus triggered
    recipeName: string;
    recipeStars: RecipeStars;
    characterName: string;
    hasSpeciality: boolean;    // character has specialty for this recipe
    hasDupeTalent: boolean;    // character has 12% double-output talent
}

// ─── Quality Rate Tables (per recipe star) ───────────────────────────────────

interface QualityRates {
    suspicious: number;
    normal: number;
    delicious: number;
}

const QUALITY_RATES: Record<RecipeStars, QualityRates> = {
    1: { suspicious: 0.10, normal: 0.15, delicious: 0.20 },  // sums to 0.45 (rest = "fail")
    2: { suspicious: 0.10, normal: 0.10, delicious: 0.15 },
    3: { suspicious: 0.05, normal: 0.10, delicious: 0.15 },
    4: { suspicious: 0.03, normal: 0.07, delicious: 0.12 }
};

// Note: these rates don't sum to 1 — the rest of the probability goes to "delicious"
// in actual game (delicious is the default). We normalize here.
function rollQuality(stars: RecipeStars): CookQuality {
    const rates = QUALITY_RATES[stars];
    const r = rng();
    // Cumulative: suspicious, then normal, then delicious (default)
    if (r < rates.suspicious) return 'suspicious';
    if (r < rates.suspicious + rates.normal) return 'normal';
    return 'delicious';
}

// ─── Special Dish Conversion ─────────────────────────────────────────────────

// When character's specialty matches the recipe, delicious cook has ~20-25% chance
// to become the special version. Unofficial rate, community-tested.
const SPECIAL_CONVERSION_RATE = 0.22;

// ─── Dupe Talent Characters (12% chance to double output) ────────────────────

const DUPE_TALENT_CHARACTERS = [
    'jean', 'hu-tao', 'diona', 'kamisato-ayaka', 'kamisato-ayato',
    'yun-jin', 'dori', 'faruzan', 'gaming', 'charlotte'
];

// ─── Sample Recipes with Character Specialties ───────────────────────────────

export interface Recipe {
    id: string;
    name: string;
    stars: RecipeStars;
    specialtyChar?: { id: string; name: string; specialName: string };
}

const SAMPLE_RECIPES: Recipe[] = [
    {
        id: 'sweet-madame', name: 'Sweet Madame', stars: 2,
        specialtyChar: { id: 'xiangling', name: 'Xiangling', specialName: 'Sweet Dream' }
    },
    {
        id: 'jueyun-guoba', name: 'Jueyun Guoba', stars: 2,
        specialtyChar: { id: 'xiangling', name: 'Xiangling', specialName: 'Qiankun Mora Meat' }
    },
    {
        id: 'sticky-honey-roast', name: 'Sticky Honey Roast', stars: 3,
        specialtyChar: { id: 'diluc', name: 'Diluc', specialName: 'Once Upon a Time in Mondstadt' }
    },
    {
        id: 'adeptus-temptation', name: 'Adeptus Temptation', stars: 4,
        specialtyChar: { id: 'ganyu', name: 'Ganyu', specialName: 'Qiankun Mora Meat' }
    },
    {
        id: 'chicken-mushroom-skewer', name: 'Chicken-Mushroom Skewer', stars: 1,
        specialtyChar: { id: 'xingqiu', name: 'Xingqiu', specialName: 'A Step Away' }
    },
    {
        id: 'tea-break-pancake', name: 'Tea Break Pancake', stars: 2,
        specialtyChar: { id: 'venti', name: 'Venti', specialName: 'A Buoyant Breeze' }
    },
    {
        id: 'crispy-bear-paw', name: 'Crispy Bear Paw', stars: 4,
        specialtyChar: { id: 'raiden-shogun', name: 'Raiden Shogun', specialName: 'Quiet Elegance' }
    },
    {
        id: 'moon-pie', name: 'Moon Pie', stars: 4,
        specialtyChar: { id: 'venti', name: 'Venti', specialName: 'Wings of Heavenly Flight' }
    }
];

// ─── Public API ──────────────────────────────────────────────────────────────

export function cook(recipe: Recipe, characterId?: string): CookResult {
    const hasSpecialty = recipe.specialtyChar !== undefined && recipe.specialtyChar.id === characterId;
    const hasDupeTalent = characterId !== undefined && DUPE_TALENT_CHARACTERS.includes(characterId);

    // Roll quality
    let quality = rollQuality(recipe.stars);

    // If delicious and character has specialty, chance to convert to special
    let isSpecial = false;
    if (quality === 'delicious' && hasSpecialty && rng() < SPECIAL_CONVERSION_RATE) {
        quality = 'special';
        isSpecial = true;
    }

    // Roll dupe talent (12% chance to double output)
    const dupeTriggered = hasDupeTalent && rng() < 0.12;
    const quantity = dupeTriggered ? 2 : 1;

    return {
        quality,
        quantity,
        isSpecial,
        dupeTriggered,
        recipeName: isSpecial && recipe.specialtyChar ? recipe.specialtyChar.specialName : recipe.name,
        recipeStars: recipe.stars,
        characterName: characterId ?? 'No Character',
        hasSpeciality: hasSpecialty,
        hasDupeTalent
    };
}

export function cookMultiple(
    recipe: Recipe,
    count: number,
    characterId?: string
): {
    results: CookResult[];
    totals: Record<CookQuality, number>;
    totalDishes: number;
    specialCount: number;
    dupeTriggeredCount: number;
} {
    const results: CookResult[] = [];
    const totals: Record<CookQuality, number> = {
        suspicious: 0, normal: 0, delicious: 0, special: 0
    };
    let totalDishes = 0, specialCount = 0, dupeCount = 0;

    for (let i = 0; i < count; i++) {
        const r = cook(recipe, characterId);
        results.push(r);
        totals[r.quality] += 1;
        totalDishes += r.quantity;
        if (r.isSpecial) specialCount += 1;
        if (r.dupeTriggered) dupeCount += 1;
    }

    return {
        results,
        totals,
        totalDishes,
        specialCount,
        dupeTriggeredCount: dupeCount
    };
}

// ─── Public Helpers ──────────────────────────────────────────────────────────

export function getSampleRecipes(): Recipe[] {
    return SAMPLE_RECIPES;
}

export function getDupeTalentCharacters(): string[] {
    return [...DUPE_TALENT_CHARACTERS];
}

export const COOKING_CONSTANTS = {
    SPECIAL_CONVERSION_RATE,
    DUPE_TALENT_CHANCE: 0.12,
    QUALITY_RATES
} as const;
