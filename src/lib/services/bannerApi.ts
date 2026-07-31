// ─── Banner API Service ───────────────────────────────────────────────────────
// Fetches the active Genshin Impact banner calendar from the Ennead API.
// Includes a static fallback banner in case the API is unreachable.

const BANNER_API = 'https://api.ennead.cc/mihoyo/genshin/calendar';

export interface BannerCharacter {
    id: number;
    name: string;
    icon: string;
    element: string;
    rarity: number;
}

export interface BannerWeapon {
    id: number;
    name: string;
    icon: string;
    rarity: number;
}

export interface BannerData {
    id: number;
    name: string;
    version: string;
    characters: BannerCharacter[];
    weapons: BannerWeapon[];
    start_time: number;     // unix seconds
    end_time: number;       // unix seconds
    kind?: string;          // 'character' | 'weapon'
}

export interface CalendarResponse {
    events?: unknown[];
    banners: BannerData[];
    challenges?: unknown[];
}

// ─── Fetch with timeout ──────────────────────────────────────────────────────

export async function fetchBannerData(): Promise<BannerData[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
        const res = await fetch(BANNER_API, { signal: controller.signal });
        if (!res.ok) throw new Error(`Banner API error: ${res.status}`);
        const data: CalendarResponse = await res.json();
        const banners = data.banners ?? [];

        // Prefer character banners (those with at least one 5★ character).
        const charBanners = banners.filter(
            (b) => Array.isArray(b.characters) && b.characters.some((c) => c.rarity === 5)
        );
        if (charBanners.length > 0) return charBanners;
        return banners;
    } finally {
        clearTimeout(timeout);
    }
}

// ─── Fallback Banner (offline-safe) ──────────────────────────────────────────

export function getFallbackBanner(): BannerData {
    const now = Math.floor(Date.now() / 1000);
    return {
        id: 0,
        name: 'Simulator Banner (Offline)',
        version: '5.2',
        kind: 'character',
        start_time: now,
        end_time: now + 14 * 86400,
        characters: [
            {
                id: 1,
                name: 'Raiden Shogun',
                icon: 'https://genshin.jmp.blue/characters/raiden/icon-big',
                element: 'Electro',
                rarity: 5
            },
            {
                id: 2,
                name: 'Bennett',
                icon: 'https://genshin.jmp.blue/characters/bennett/icon-big',
                element: 'Pyro',
                rarity: 4
            },
            {
                id: 3,
                name: 'Xiangling',
                icon: 'https://genshin.jmp.blue/characters/xiangling/icon-big',
                element: 'Pyro',
                rarity: 4
            },
            {
                id: 4,
                name: 'Xingqiu',
                icon: 'https://genshin.jmp.blue/characters/xingqiu/icon-big',
                element: 'Hydro',
                rarity: 4
            }
        ],
        weapons: []
    };
}
