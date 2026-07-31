// ─── Redeem Code API Service ─────────────────────────────────────────────────
// Fetches active Genshin Impact redeem codes from the Ennead API.

const CODES_API = 'https://api.ennead.cc/mihoyo/genshin/codes';
const REDEEM_URL = 'https://genshin.hoyoverse.com/en/gift?code=';

export interface RedeemReward {
    name: string;
    quantity: number;
    raw?: string;
}

export interface RedeemCode {
    code: string;
    description?: string;
    rewards: RedeemReward[];
    isExpired: boolean;
    discoveredAt?: number;
    raw?: unknown;
}

interface EnneadCodeItem {
    code?: string;
    name?: string;
    description?: string;
    rewards?: string | string[];
    is_expired?: boolean;
    expired?: boolean;
    discovered_at?: number;
    [k: string]: unknown;
}

// ─── Fetch Active Codes ──────────────────────────────────────────────────────

export async function fetchRedeemCodes(): Promise<RedeemCode[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
        const res = await fetch(CODES_API, { signal: controller.signal });
        if (!res.ok) throw new Error(`Codes API error: ${res.status}`);
        const data = await res.json();
        return parseCodesResponse(data);
    } finally {
        clearTimeout(timeout);
    }
}

// ─── Parse the loosely-typed Ennead response ─────────────────────────────────

function parseCodesResponse(data: unknown): RedeemCode[] {
    if (!data) return [];

    // Possible shapes:
    //   { codes: [...] }
    //   [ ... ]
    //   { active: [...], expired: [...] }
    const candidates: EnneadCodeItem[] = [];
    if (Array.isArray(data)) {
        candidates.push(...(data as EnneadCodeItem[]));
    } else if (typeof data === 'object' && data !== null) {
        const obj = data as Record<string, unknown>;
        const arr = obj.codes ?? obj.active ?? obj.data;
        if (Array.isArray(arr)) {
            candidates.push(...(arr as EnneadCodeItem[]));
        }
    }

    return candidates
        .map((item) => parseCode(item))
        .filter((c): c is RedeemCode => c !== null);
}

function parseCode(item: EnneadCodeItem): RedeemCode | null {
    if (!item || typeof item !== 'object') return null;
    const code = (item.code ?? item.name ?? '') as string;
    if (!code) return null;

    return {
        code,
        description: typeof item.description === 'string' ? item.description : undefined,
        rewards: parseRewards(item.rewards),
        isExpired: Boolean(item.is_expired ?? item.expired ?? false),
        discoveredAt: typeof item.discovered_at === 'number' ? item.discovered_at : undefined,
        raw: item
    };
}

function parseRewards(rewards: unknown): RedeemReward[] {
    if (!rewards) return [];
    const list: string[] = [];
    if (Array.isArray(rewards)) {
        for (const r of rewards) {
            if (typeof r === 'string') list.push(r);
            else if (r && typeof r === 'object' && 'raw' in r) {
                const raw = (r as { raw: unknown }).raw;
                if (typeof raw === 'string') list.push(raw);
            }
        }
    } else if (typeof rewards === 'string') {
        list.push(...rewards.split(/[,;]+/).map((s) => s.trim()).filter(Boolean));
    }

    return list.map((raw) => {
        const parsed = parseRewardString(raw);
        return { ...parsed, raw };
    });
}

function parseRewardString(raw: string): Omit<RedeemReward, 'raw'> {
    // Examples:
    //   "160 Primogems"
    //   "5x Hero's Wit"
    //   "50000 Mora"
    const m = raw.match(/(\d+)\s*[x×]?\s*(.+)/);
    if (m) {
        return { name: m[2]!.trim(), quantity: parseInt(m[1]!, 10) };
    }
    return { name: raw.trim(), quantity: 0 };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function buildRedeemUrl(code: string): string {
    return `${REDEEM_URL}${encodeURIComponent(code)}`;
}

/** Try to extract primogem reward quantity from a list of rewards. 0 if none. */
export function extractPrimogemAmount(rewards: RedeemReward[]): number {
    for (const r of rewards) {
        if (/primogem/i.test(r.name)) return r.quantity;
    }
    return 0;
}
