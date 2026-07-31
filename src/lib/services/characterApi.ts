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

// ─── Image URLs ───────────────────────────────────────────────────────────────

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

// ─── Fetchers ─────────────────────────────────────────────────────────────────

export async function fetchCharacter(slug: string): Promise<GenshinCharacter> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        try {
                const res = await fetch(`${API_BASE}/characters/${slug}`, { signal: controller.signal });
                if (!res.ok) throw new Error(`Character API error: ${res.status}`);
                return res.json();
        } finally {
                clearTimeout(timeout);
        }
}

export async function fetchAllCharacterSlugs(): Promise<string[]> {
        const res = await fetch(`${API_BASE}/characters`);
        if (!res.ok) throw new Error(`Characters list error: ${res.status}`);
        return res.json();
}

export async function fetchAllWeaponSlugs(): Promise<string[]> {
        const res = await fetch(`${API_BASE}/weapons`);
        if (!res.ok) throw new Error(`Weapons list error: ${res.status}`);
        return res.json();
}

// ─── Slug Helper ──────────────────────────────────────────────────────────────

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
                'Columbina': 'columbina',
                'Jahoda': 'jahoda',
                'Ororon': 'ororon',
                'Sethos': 'sethos'
        };
        if (map[name]) return map[name];
        return name.toLowerCase().replace(/\s+/g, '-');
}
