// ─── Banner Store (Svelte 5 Runes) ───────────────────────────────────────────
// Lightweight reactive wrapper around the banner API + the banner registry
// inside gameState. Lets every route read the active banner list and ensures
// the gameState banner pool is registered before pulls happen.

import { fetchBannerData, getFallbackBanner, type BannerData } from '$lib/services/bannerApi';
import { slugifyName } from '$lib/services/characterApi';
import { getGameState, type WishResult } from '$lib/stores/gameState.svelte';
import type { BannerPoolEntry } from '$lib/utils/gachaEngine';

const game = getGameState();

// Standard 4★ slugs used by the gacha engine's "lose 50/50" 4★ pool.
// These are slugs on genshin.jmp.blue.
const STANDARD_4STAR_SLUGS = [
    'bennett', 'xiangling', 'xingqiu', 'fischl', 'sucrose',
    'beidou', 'ningguang', 'xinyan', 'rosaria', 'razor',
    'noelle', 'barbara', 'kaeya', 'lisa', 'amber',
    'collei', 'dori', 'candace', 'kuki-shinobu', 'gorou',
    'sayu', 'thoma', 'chongyun', 'diona', 'yanfei',
    'yun-jin', 'shikanoin-heizou', 'layla', 'faruzan', 'sara',
    'yaoyao', 'mika', 'kaveh', 'kirara', 'freminet',
    'lynette', 'charlotte', 'chevreuse', 'gaming', 'kachina',
    'sethos', 'ororon'
];

let banners: BannerData[] = $state([]);
let weaponBanner: BannerData | null = $state(null);
let isLoading: boolean = $state(false);
let apiError: string = $state('');

function registerBannerInGame(banner: BannerData): void {
    const f5Char = banner.characters.find((c) => c.rarity === 5);
    const f4Chars = banner.characters.filter((c) => c.rarity === 4);

    const featured5: BannerPoolEntry | null = f5Char
        ? {
            id: slugifyName(f5Char.name),
            name: f5Char.name,
            element: f5Char.element,
            bannerIconUrl: f5Char.icon
        }
        : null;

    const featured4: BannerPoolEntry[] = f4Chars.map((c) => ({
        id: slugifyName(c.name),
        name: c.name,
        element: c.element,
        bannerIconUrl: c.icon
    }));

    const standard4: BannerPoolEntry[] = STANDARD_4STAR_SLUGS.map((slug) => ({
        id: slug,
        name: slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        element: ''
    }));

    game.registerBanner({
        id: String(banner.id),
        name: banner.name,
        version: banner.version,
        endTime: banner.end_time,
        featured5,
        featured4,
        standard4
    });
}

async function fetchBanners(): Promise<void> {
    isLoading = true;
    apiError = '';
    try {
        const data = await fetchBannerData();
        if (data.length === 0) {
            // Use fallback
            const fb = getFallbackBanner();
            banners = [fb];
            registerBannerInGame(fb);
            game.selectBanner(String(fb.id));
        } else {
            banners = data;
            for (const b of data) registerBannerInGame(b);
            // Auto-select first if nothing selected yet
            if (!game.selectedBannerId && data.length > 0) {
                game.selectBanner(String(data[0].id));
            }
            // Extract weapon banner (banner with weapons array containing 5★)
            const wb = data.find((b) => Array.isArray(b.weapons) && b.weapons.some((w) => w.rarity === 5));
            weaponBanner = wb ?? null;
        }
    } catch (err) {
        console.error('[bannerStore] fetch failed:', err);
        apiError = err instanceof Error ? err.message : 'Unknown error';
        // Use fallback
        const fb = getFallbackBanner();
        banners = [fb];
        registerBannerInGame(fb);
        game.selectBanner(String(fb.id));
    } finally {
        isLoading = false;
    }
}

function selectBanner(id: string): void {
    game.selectBanner(id);
}

function getCurrentBanner(): BannerData | null {
    if (!game.selectedBannerId) return banners[0] ?? null;
    return banners.find((b) => String(b.id) === game.selectedBannerId) ?? banners[0] ?? null;
}

function getFeatured5Star(): BannerData['characters'][number] | null {
    const b = getCurrentBanner();
    if (!b) return null;
    return b.characters.find((c) => c.rarity === 5) ?? null;
}

function getFeatured4Stars(): BannerData['characters'][number][] {
    const b = getCurrentBanner();
    if (!b) return [];
    return b.characters.filter((c) => c.rarity === 4);
}

function getCountdown(): string {
    const b = getCurrentBanner();
    if (!b) return '';
    const diff = b.end_time * 1000 - Date.now();
    if (diff <= 0) return 'Berakhir';
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${d}h ${h}j ${m}m`;
}

function getFeatured5StarWeapons(): BannerData['weapons'][number][] {
    if (!weaponBanner) return [];
    return weaponBanner.weapons.filter((w) => w.rarity === 5);
}

function getFeatured4StarWeapons(): BannerData['weapons'][number][] {
    if (!weaponBanner) return [];
    return weaponBanner.weapons.filter((w) => w.rarity === 4);
}

function getWeaponBannerVersion(): string {
    return weaponBanner?.version ?? '—';
}

function getWeaponBannerCountdown(): string {
    if (!weaponBanner) return '';
    const diff = weaponBanner.end_time * 1000 - Date.now();
    if (diff <= 0) return 'Berakhir';
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${d}h ${h}j ${m}m`;
}

export function getBannerStore() {
    return {
        get banners() { return banners; },
        get isLoading() { return isLoading; },
        get apiError() { return apiError; },
        get selectedBannerId() { return game.selectedBannerId; },
        get currentBanner() { return getCurrentBanner(); },
        get featured5Star() { return getFeatured5Star(); },
        get featured4Stars() { return getFeatured4Stars(); },
        get countdownText() { return getCountdown(); },
        // Weapon banner (from API)
        get weaponBanner() { return weaponBanner; },
        get featured5StarWeapons() { return getFeatured5StarWeapons(); },
        get featured4StarWeapons() { return getFeatured4StarWeapons(); },
        get weaponBannerVersion() { return getWeaponBannerVersion(); },
        get weaponBannerCountdown() { return getWeaponBannerCountdown(); },
        fetchBanners,
        selectBanner
    };
}

// Re-export WishResult for convenience
export type { WishResult };
