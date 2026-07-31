// ─── Genshin Impact Gacha Engine ──────────────────────────────────────────────
// Accurate pity system, soft pity, 50/50, guaranteed
// Based on real Genshin Impact gacha mechanics

// ─── Types ────────────────────────────────────────────────────────────────────

export type Rarity = 3 | 4 | 5;
export type PullType = 'character' | 'weapon';

export interface PullResult {
	id: string;
	name: string;
	rarity: Rarity;
	type: PullType;
	element?: string;
	isRateUp: boolean;
	isGuaranteed: boolean;
	iconUrl: string;
}

export interface GachaState {
	pity5: number;          // Current pity count for 5★ (0-89)
	pity4: number;          // Current pity count for 4★ (0-9)
	guaranteed5: boolean;   // Next 5★ is guaranteed rate-up
	guaranteed4: boolean;   // Next 4★ is guaranteed rate-up
	totalPulls: number;
	history: PullResult[];  // All pull results
}

// ─── Rate Calculations ────────────────────────────────────────────────────────

/** Base 5★ rate: 0.6% */
const BASE_5STAR_RATE = 0.006;

/** Soft pity starts at pull 74 */
const SOFT_PITY_START = 74;

/** Hard pity at pull 90 */
const HARD_PITY = 90;

/** 4★ base rate: 5.1% */
const BASE_4STAR_RATE = 0.051;

/** 4★ hard pity every 10 pulls */
const HARD_PITY_4STAR = 10;

/** 50/50 rate for featured character */
const RATE_UP_5STAR_CHANCE = 0.5;

/** 50/50 rate for featured 4★ (actually 50% for featured, 50% split among standard) */
const RATE_UP_4STAR_CHANCE = 0.5;

/** Standard 5★ characters (lose 50/50 pool) */
const STANDARD_5STAR = [
	{ id: 'jean', name: 'Jean', element: 'Anemo' },
	{ id: 'diluc', name: 'Diluc', element: 'Pyro' },
	{ id: 'mona', name: 'Mona', element: 'Hydro' },
	{ id: 'keqing', name: 'Keqing', element: 'Electro' },
	{ id: 'qiqi', name: 'Qiqi', element: 'Cryo' },
	{ id: 'tighnari', name: 'Tighnari', element: 'Dendro' },
	{ id: 'dehya', name: 'Dehya', element: 'Pyro' }
];

/** Common 3★ weapons */
const WEAPONS_3STAR = [
	{ id: 'cool-steel', name: 'Cool Steel' },
	{ id: 'harbinger-of-dawn', name: "Harbinger of Dawn" },
	{ id: 'dark-iron-sword', name: 'Dark Iron Sword' },
	{ id: 'skyrider-sword', name: 'Skyrider Sword' },
	{ id: 'debate-club', name: 'Debate Club' },
	{ id: 'bloodtainted-greatsword', name: 'Bloodtainted Greatsword' },
	{ id: 'black-tassel', name: 'Black Tassel' },
	{ id: 'magic-guide', name: 'Magic Guide' },
	{ id: 'thrilling-tales-of-dragon-slayers', name: 'Thrilling Tales' },
	{ id: 'emerald-orb', name: 'Emerald Orb' },
	{ id: 'raven-bow', name: 'Raven Bow' },
	{ id: 'sharpshooters-oath', name: "Sharpshooter's Oath" }
];

// ─── Image URL Helpers ────────────────────────────────────────────────────────

const API_BASE = 'https://genshin.jmp.blue';

function charIconUrl(slug: string): string {
	return `${API_BASE}/characters/${slug}/icon-big`;
}

function weaponIconUrl(slug: string): string {
	return `${API_BASE}/weapons/${slug}/icon`;
}

// ─── RNG ──────────────────────────────────────────────────────────────────────

function rng(): number {
	const arr = new Uint32Array(1);
	crypto.getRandomValues(arr);
	return arr[0] / (0xffffffff + 1);
}

// ─── 5★ Rate with Soft Pity ──────────────────────────────────────────────────

export function get5StarRate(currentPity: number): number {
	if (currentPity < SOFT_PITY_START) return BASE_5STAR_RATE;
	if (currentPity >= HARD_PITY - 1) return 1.0;
	// Soft pity: linear increase from 0.6% to ~100% over pulls 74-90
	return BASE_5STAR_RATE + (currentPity - (SOFT_PITY_START - 1)) * 0.06;
}

// ─── Pull Pools (set by banner data) ─────────────────────────────────────────

let featured5Star: { id: string; name: string; element: string } | null = null;
let featured4Star: { id: string; name: string; element: string }[] = [];
let standard4Star: { id: string; name: string; element: string }[] = [];

/** Set banner data for the gacha engine */
export function setBannerPools(
	f5: { id: string; name: string; element: string } | null,
	f4: { id: string; name: string; element: string }[],
	s4: { id: string; name: string; element: string }[]
) {
	featured5Star = f5;
	featured4Star = f4;
	standard4Star = s4;
}

// ─── Single Pull ──────────────────────────────────────────────────────────────

export function executePull(state: GachaState): { result: PullResult; newState: GachaState } {
	const s = { ...state, history: [...state.history] };
	s.pity5++;
	s.pity4++;
	s.totalPulls++;

	const roll = rng();
	const rate5 = get5StarRate(s.pity5 - 1);
	let result: PullResult;

	if (roll < rate5 || s.pity5 >= HARD_PITY) {
		// ── 5★ Obtained ──
		let isRateUp = false;
		let isGuaranteed = s.guaranteed5;
		let char: { id: string; name: string; element?: string };

		if (s.guaranteed5 || rng() < RATE_UP_5STAR_CHANCE) {
			// Win 50/50 or guaranteed
			char = featured5Star ?? STANDARD_5STAR[0];
			isRateUp = true;
			s.guaranteed5 = false;
		} else {
			// Lost 50/50
			char = STANDARD_5STAR[Math.floor(rng() * STANDARD_5STAR.length)];
			isRateUp = false;
			s.guaranteed5 = true; // Next 5★ is guaranteed
		}

		result = {
			id: char.id,
			name: char.name,
			rarity: 5,
			type: 'character',
			element: char.element,
			isRateUp,
			isGuaranteed,
			iconUrl: charIconUrl(char.id)
		};
		s.pity5 = 0;
		s.pity4 = 0; // 5★ also resets 4★ pity
	} else if (s.pity4 >= HARD_PITY_4STAR || roll < rate5 + BASE_4STAR_RATE) {
		// ── 4★ Obtained ──
		let isRateUp = false;
		let char: { id: string; name: string; element?: string };

		if (s.guaranteed4 || rng() < RATE_UP_4STAR_CHANCE) {
			if (featured4Star.length > 0) {
				char = featured4Star[Math.floor(rng() * featured4Star.length)];
				isRateUp = true;
			} else {
				char = standard4Star[Math.floor(rng() * standard4Star.length)];
			}
			s.guaranteed4 = false;
		} else {
			if (standard4Star.length > 0) {
				char = standard4Star[Math.floor(rng() * standard4Star.length)];
			} else {
				char = featured4Star[Math.floor(rng() * featured4Star.length)];
				isRateUp = true;
			}
			s.guaranteed4 = true;
		}

		result = {
			id: char.id,
			name: char.name,
			rarity: 4,
			type: 'character',
			element: char.element,
			isRateUp,
			isGuaranteed: s.guaranteed4,
			iconUrl: charIconUrl(char.id)
		};
		s.pity4 = 0;
	} else {
		// ── 3★ Weapon ──
		const wpn = WEAPONS_3STAR[Math.floor(rng() * WEAPONS_3STAR.length)];
		result = {
			id: wpn.id,
			name: wpn.name,
			rarity: 3,
			type: 'weapon',
			isRateUp: false,
			isGuaranteed: false,
			iconUrl: weaponIconUrl(wpn.id)
		};
	}

	s.history.push(result);
	return { result, newState: s };
}

// ─── Multi Pull ───────────────────────────────────────────────────────────────

export function executeMultiPull(state: GachaState, count: number): { results: PullResult[]; newState: GachaState } {
	const results: PullResult[] = [];
	let s = state;
	for (let i = 0; i < count; i++) {
		const { result, newState } = executePull(s);
		results.push(result);
		s = newState;
	}
	return { results, newState: s };
}

// ─── Create Initial State ────────────────────────────────────────────────────

export function createInitialState(): GachaState {
	return {
		pity5: 0,
		pity4: 0,
		guaranteed5: false,
		guaranteed4: false,
		totalPulls: 0,
		history: []
	};
}
