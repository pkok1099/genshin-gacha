// ─── Character/Weapon API Service (genshin.jmp.blue) ──────────────────────────

const API_BASE = 'https://genshin.jmp.blue';

export interface GenshinCharacter {
    id: string;
    name: string;
    rarity: number;
    vision: string;
    vision_key: string;
    weapon: string;
    weapon_type: string;
    nation: string;
    title: string;
}

export interface GenshinWeapon {
    id: string;
    name: string;
    rarity: number;
    type: string;
}

// ─── Image URLs ──────────────────────────────────────────────────────────────

export function characterIconUrl(slug: string): string {
    return `${API_BASE}/characters/${slug}/icon`;
}

export function characterIconBigUrl(slug: string): string {
    return `${API_BASE}/characters/${slug}/icon-big`;
}

export function characterGachaSplashUrl(slug: string): string {
    return `${API_BASE}/characters/${slug}/gacha-splash`;
}

export function weaponIconUrl(slug: string): string {
    return `${API_BASE}/weapons/${slug}/icon`;
}

// ─── Fetchers (with timeout + error handling) ────────────────────────────────

async function fetchWithTimeout(url: string, ms = 8000): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ms);
    try {
        return await fetch(url, { signal: controller.signal });
    } finally {
        clearTimeout(timeout);
    }
}

export async function fetchCharacter(slug: string): Promise<GenshinCharacter> {
    const res = await fetchWithTimeout(`${API_BASE}/characters/${slug}`);
    if (!res.ok) throw new Error(`Character API error: ${res.status}`);
    return res.json();
}

export async function fetchAllCharacterSlugs(): Promise<string[]> {
    const res = await fetchWithTimeout(`${API_BASE}/characters`);
    if (!res.ok) throw new Error(`Characters list error: ${res.status}`);
    return res.json();
}

export async function fetchAllWeaponSlugs(): Promise<string[]> {
    const res = await fetchWithTimeout(`${API_BASE}/weapons`);
    if (!res.ok) throw new Error(`Weapons list error: ${res.status}`);
    return res.json();
}

// ─── Slug Helper ─────────────────────────────────────────────────────────────

/** Map a localized character name (e.g. "Raiden Shogun") to its jmp.blue slug. */
export function slugifyName(name: string): string {
    const map: Record<string, string> = {
        'Raiden Shogun': 'raiden',
        'Kaedehara Kazuha': 'kazuha',
        'Sangonomiya Kokomi': 'kokomi',
        'Kamisato Ayaka': 'ayaka',
        'Kamisato Ayato': 'ayato',
        'Shikanoin Heizou': 'shikanoin-heizou',
        'Kuki Shinobu': 'kuki-shinobu',
        'Hu Tao': 'hu-tao',
        'Yae Miko': 'yae-miko',
        'Arataki Itto': 'arataki-itto',
        'Klee': 'klee',
        'Wanderer': 'wanderer',
        'Faruzan': 'faruzan',
        'Columbina': 'columbina',
        'Jahoda': 'jahoda',
        'Ororon': 'ororon',
        'Sethos': 'sethos',
        'Tighnari': 'tighnari',
        'Dehya': 'dehya',
        'Nilou': 'nilou',
        'Nahida': 'nahida',
        'Cyno': 'cyno',
        'Alhaitham': 'alhaitham',
        'Neuvillette': 'neuvillette',
        'Furina': 'furina',
        'Navia': 'navia',
        'Xianyun': 'xianyun',
        'Chiori': 'chiori',
        'Arlecchino': 'arlecchino',
        'Clorinde': 'clorinde',
        'Sigewinne': 'sigewinne',
        'Emilie': 'emilie',
        'Kinich': 'kinich',
        'Mualani': 'mualani',
        'Xilonen': 'xilonen',
        'Chasca': 'chasca',
        'Mavuika': 'mavuika',
        'Citlali': 'citlali',
        'Lan Yan': 'lan-yan',
        'Mizuki': 'mizuki',
        'Varesa': 'varesa',
        'Skirk': 'skirk',
        'Dahlia': 'dahlia',
        'Iansan': 'iansan',
        'Ifa': 'ifa'
    };
    if (map[name]) return map[name];
    return name.toLowerCase().replace(/\s+/g, '-');
}
