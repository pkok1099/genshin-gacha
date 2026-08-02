import { fetchBannerData, getFallbackBanner, type BannerData } from '$lib/services/bannerApi';

export const ssr = true;
export const prerender = true;

// Fetch banner metadata (names/versions — small text) at build time so it is
// baked into the prerendered HTML. The store refreshes from the API in the
// background once the page mounts, so stale build data self-heals.
export async function load(): Promise<{ banners: BannerData[] }> {
        try {
                const data = await fetchBannerData();
                return { banners: data.length > 0 ? data : [getFallbackBanner()] };
        } catch {
                return { banners: [getFallbackBanner()] };
        }
}
