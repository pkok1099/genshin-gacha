// ─── Character/Weapon Image & Slug Service (genshin.jmp.blue) ────────────────
// Only image-URL builders and the slug map are used by the UI. The fetch helpers
// were never called anywhere in the app, so they have been removed to keep the
// bundle lean and avoid shipping dead async code.

const API_BASE = 'https://genshin.jmp.blue';

// ─── Image URLs ──────────────────────────────────────────────────────────────

export function characterIconBigUrl(slug: string): string {
    return `${API_BASE}/characters/${slug}/icon-big`;
}

export function characterGachaSplashUrl(slug: string): string {
    return `${API_BASE}/characters/${slug}/gacha-splash`;
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
    return map[name] ?? name.toLowerCase().replace(/\s+/g, '-');
}
