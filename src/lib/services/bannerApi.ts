// ─── Banner API Service ───────────────────────────────────────────────────────

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
	start_time: number;
	end_time: number;
}

export interface CalendarResponse {
	events: unknown[];
	banners: BannerData[];
	challenges: unknown[];
}

export async function fetchBannerData(): Promise<BannerData[]> {
	const res = await fetch(BANNER_API);
	if (!res.ok) throw new Error(`Banner API error: ${res.status}`);
	const data: CalendarResponse = await res.json();
	// Filter to character banners only (those with 5★ chars)
	return (data.banners ?? []).filter((b) =>
		b.characters?.some((c) => c.rarity === 5)
	);
}
