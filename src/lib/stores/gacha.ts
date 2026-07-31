// ─── Gacha Store (Svelte 5 Runes) ────────────────────────────────────────────
import { createInitialState, executePull, executeMultiPull, setBannerPools, type GachaState, type PullResult } from '$lib/utils/gachaEngine';

// ─── Banner Data Types ────────────────────────────────────────────────────────

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
        start_time: number;
        end_time: number;
}

// ─── 4★ Standard Characters ──────────────────────────────────────────────────

const STANDARD_4STAR_SLUGS = [
        'bennett', 'xiangling', 'xingqiu', 'fischl', 'sucrose',
        'beidou', 'ningguang', 'xinyan', 'rosaria', 'razor',
        'noelle', 'barbara', 'kaeya', 'lisa', 'amber',
        'collei', 'dori', 'candace', 'kuki-shinobu', 'gorou',
        'sayu', 'thoma', 'chongyun', 'diona', 'yanfei',
        'yun-jin', 'shikanoin-heizou', 'layla', 'faruzan', 'sara',
        'yaoyao', 'mika', 'kaveh', 'kirara', 'freminet',
        'lynette', 'charlotte', 'chevreuse', 'gaming', 'kachina',
        'sethos', 'ororon', 'sethos'
];

// ─── Global State ─────────────────────────────────────────────────────────────

let gachaState: GachaState = $state(createInitialState());
let banners: BannerData[] = $state([]);
let isLoading: boolean = $state(true);
let apiError: string = $state('');
let selectedBannerIdx: number = $state(0);
let showResultModal: boolean = $state(false);
let lastPullResults: PullResult[] = $state([]);

// ─── Derived ──────────────────────────────────────────────────────────────────

let currentBanner: BannerData | null = $derived(banners[selectedBannerIdx] ?? null);

let featured5Star: BannerCharacter | null = $derived(
        currentBanner?.characters.find((c) => c.rarity === 5) ?? null
);

let featured4Stars: BannerCharacter[] = $derived(
        currentBanner?.characters.filter((c) => c.rarity === 4) ?? []
);

let bannerEndTime: Date | null = $derived(
        currentBanner ? new Date(currentBanner.end_time * 1000) : null
);

let countdownText: string = $derived(
        !bannerEndTime ? '' : (() => {
                const diff = bannerEndTime.getTime() - Date.now();
                if (diff <= 0) return 'Banner berakhir';
                const d = Math.floor(diff / 86400000);
                const h = Math.floor((diff % 86400000) / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                return `${d}h ${h}j ${m}m`;
        })()
);

// ─── Actions ──────────────────────────────────────────────────────────────────

function updatePools() {
        if (!currentBanner) return;

        const f5 = featured5Star
                ? { id: slugify(featured5Star.name), name: featured5Star.name, element: featured5Star.element }
                : null;

        const f4 = featured4Stars.map((c) => ({
                id: slugify(c.name),
                name: c.name,
                element: c.element
        }));

        const s4 = STANDARD_4STAR_SLUGS.map((slug) => ({
                id: slug,
                name: capitalize(slug),
                element: ''
        }));

        setBannerPools(f5, f4, s4);
}

function doSinglePull(): PullResult {
        updatePools();
        const { result, newState } = executePull(gachaState);
        gachaState = newState;
        lastPullResults = [result];
        showResultModal = true;
        return result;
}

function doTenPull(): PullResult[] {
        updatePools();
        const { results, newState } = executeMultiPull(gachaState, 10);
        gachaState = newState;
        lastPullResults = results;
        showResultModal = true;
        return results;
}

function resetState() {
        gachaState = createInitialState();
        lastPullResults = [];
        showResultModal = false;
}

function closeModal() {
        showResultModal = false;
}

// ─── Banner API Fetch ─────────────────────────────────────────────────────────

async function fetchBanners() {
        isLoading = true;
        apiError = '';
        try {
                const res = await fetch('https://api.ennead.cc/mihoyo/genshin/calendar');
                if (!res.ok) throw new Error(`API error: ${res.status}`);
                const data = await res.json();
                if (data?.banners?.length) {
                        banners = data.banners.filter((b: BannerData) =>
                                b.characters.some((c: BannerCharacter) => c.rarity === 5)
                        );
                        if (banners.length > 0) selectedBannerIdx = 0;
                }
        } catch (err) {
                console.error('Failed to fetch banners:', err);
                apiError = 'Gagal memuat data banner. Coba lagi nanti.';
        } finally {
                isLoading = false;
        }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(name: string): string {
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
                'Sethos': 'sethos'
        };
        if (map[name]) return map[name];
        return name.toLowerCase().replace(/\s+/g, '-');
}

function capitalize(slug: string): string {
        return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ─── Export Store ──────────────────────────────────────────────────────────────

export function getGachaStore() {
        return {
                // State
                get state() { return gachaState; },
                set state(v: GachaState) { gachaState = v; },
                get banners() { return banners; },
                get isLoading() { return isLoading; },
                get apiError() { return apiError; },
                get selectedBannerIdx() { return selectedBannerIdx; },
                set selectedBannerIdx(v: number) { selectedBannerIdx = v; },
                get showResultModal() { return showResultModal; },
                set showResultModal(v: boolean) { showResultModal = v; },
                get lastPullResults() { return lastPullResults; },

                // Derived
                get currentBanner() { return currentBanner; },
                get featured5Star() { return featured5Star; },
                get featured4Stars() { return featured4Stars; },
                get countdownText() { return countdownText; },

                // Actions
                doSinglePull,
                doTenPull,
                resetState,
                closeModal,
                fetchBanners
        };
}
