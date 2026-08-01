// ─── Achievement System ─────────────────────────────────────────────────────
// Milestone badges computed from wish history. Each achievement has a check
// function that takes the full history + sim state and returns whether it's
// unlocked. We compute on-demand (no persistence) so achievements stay
// accurate after JSON imports and survive the per-mode pity refactor.

import type { WishResult, WishMode } from '$lib/stores/gameState.svelte';

export interface Achievement {
        id: string;
        title: string;
        desc: string;
        icon: string;            // emoji or unicode symbol
        tier: 'bronze' | 'silver' | 'gold' | 'platinum';
        hidden?: boolean;        // hide desc until unlocked (spoiler)
        check: (history: WishResult[], stats: AchievementStats) => boolean;
}

export interface AchievementStats {
        totalPulls: number;
        count5: number;
        count4: number;
        count3: number;
        wins5050: number;
        losses5050: number;
        bestStreak: number;       // longest no-5★ gap across all banners
        hardPityReached: boolean; // any 5★ pulled at pity ≥ 90?
        pulledFeatured5: boolean; // any rate-up 5★ pulled?
        pulledAll3star10: boolean; // any 10-pull batch with all 10 being 3★?
        noviceMaxed: boolean;
}

// ── Stats computation ────────────────────────────────────────────────────────

function classifyBanner(bannerId: string): WishMode {
        if (bannerId === 'standard') return 'standard';
        if (bannerId === 'novice') return 'novice';
        return 'character';
}

export function computeAchievementStats(history: WishResult[], noviceMaxed: boolean): AchievementStats {
        let count5 = 0, count4 = 0, count3 = 0;
        let wins5050 = 0, losses5050 = 0;
        let bestStreak = 0;
        let hardPityReached = false;
        let pulledFeatured5 = false;
        let sinceLast5 = 0;

        // Detect "all 3★ 10-pull" — group consecutive entries by timestamp
        // proximity (within 5s = same batch), check if any batch of 10 has
        // zero 5★ AND zero 4★.
        let pulledAll3star10 = false;
        if (history.length >= 10) {
                const batches: WishResult[][] = [];
                let currentBatch: WishResult[] = [];
                for (let i = 0; i < history.length; i++) {
                        const w = history[i];
                        if (currentBatch.length === 0) {
                                currentBatch.push(w);
                        } else {
                                const prev = currentBatch[currentBatch.length - 1];
                                if (Math.abs(w.timestamp - prev.timestamp) <= 5000) {
                                        currentBatch.push(w);
                                } else {
                                        batches.push(currentBatch);
                                        currentBatch = [w];
                                }
                        }
                }
                if (currentBatch.length > 0) batches.push(currentBatch);
                pulledAll3star10 = batches.some(b =>
                        b.length === 10 && b.every(r => r.rarity === 3)
                );
        }

        for (const w of history) {
                if (w.rarity === 5) {
                        count5++;
                        if (w.pityCount >= 90) hardPityReached = true;
                        if (w.isRateUp) pulledFeatured5 = true;
                        if (w.is5050Win === true) wins5050++;
                        else if (w.is5050Win === false) losses5050++;
                        if (sinceLast5 > bestStreak) bestStreak = sinceLast5;
                        sinceLast5 = 0;
                } else {
                        if (w.rarity === 4) count4++;
                        else count3++;
                        sinceLast5++;
                }
        }
        // If the last recorded pull wasn't a 5★, sinceLast5 holds the current
        // ongoing streak — but for "best ever" we only count completed gaps,
        // so we don't fold sinceLast5 into bestStreak here.

        return {
                totalPulls: history.length,
                count5,
                count4,
                count3,
                wins5050,
                losses5050,
                bestStreak,
                hardPityReached,
                pulledFeatured5,
                pulledAll3star10,
                noviceMaxed
        };
}

// ── Achievement definitions ──────────────────────────────────────────────────

export const ACHIEVEMENTS: Achievement[] = [
        // ── Bronze (early milestones) ──
        {
                id: 'first-pull',
                title: 'Langkah Pertama',
                desc: 'Lakukan pull pertamamu',
                icon: '✦',
                tier: 'bronze',
                check: (h, s) => s.totalPulls >= 1
        },
        {
                id: 'first-5star',
                title: 'Bintang Pertama',
                desc: 'Dapatkan 5★ pertamamu',
                icon: '★',
                tier: 'bronze',
                check: (h, s) => s.count5 >= 1
        },
        {
                id: 'first-10pull',
                title: 'Sepuluh Sekaligus',
                desc: 'Lakukan 10-pull pertamamu (10+ pulls total)',
                icon: '✦✦',
                tier: 'bronze',
                check: (h, s) => s.totalPulls >= 10
        },
        {
                id: 'first-4star',
                title: 'Ungu Pertama',
                desc: 'Dapatkan 4★ pertamamu',
                icon: '✧',
                tier: 'bronze',
                check: (h, s) => s.count4 >= 1
        },

        // ── Silver (mid milestones) ──
        {
                id: 'pulls-100',
                title: 'Pencabut Awal',
                desc: 'Lakukan 100 pull total',
                icon: '💯',
                tier: 'silver',
                check: (h, s) => s.totalPulls >= 100
        },
        {
                id: 'five-5star',
                title: 'Kolektor 5★',
                desc: 'Dapatkan 5× 5★',
                icon: '★★★★★',
                tier: 'silver',
                check: (h, s) => s.count5 >= 5
        },
        {
                id: 'win-5050',
                title: 'Beruntung',
                desc: 'Menang 50/50 pertamamu',
                icon: '🎲',
                tier: 'silver',
                check: (h, s) => s.wins5050 >= 1
        },
        {
                id: 'featured-5star',
                title: 'Featured!',
                desc: 'Dapatkan featured 5★ (rate-up)',
                icon: '✨',
                tier: 'silver',
                check: (h, s) => s.pulledFeatured5
        },
        {
                id: 'soft-pity-hit',
                title: 'Soft Pity Worker',
                desc: 'Dapatkan 5★ saat pity 74-89 (soft pity zone)',
                icon: '🎯',
                tier: 'silver',
                hidden: true,
                check: (h) => h.some(w => w.rarity === 5 && w.pityCount >= 74 && w.pityCount < 90)
        },

        // ── Gold (rare milestones) ──
        {
                id: 'pulls-500',
                title: 'Wish Veteran',
                desc: 'Lakukan 500 pull total',
                icon: '🏆',
                tier: 'gold',
                check: (h, s) => s.totalPulls >= 500
        },
        {
                id: 'win-5x-5050',
                title: 'Pembawa Hoki',
                desc: 'Menang 5× 50/50',
                icon: '🍀',
                tier: 'gold',
                check: (h, s) => s.wins5050 >= 5
        },
        {
                id: 'hard-pity',
                title: 'Hard Pity Reached',
                desc: 'Dapatkan 5★ tepat di hard pity (90)',
                icon: '⏰',
                tier: 'gold',
                hidden: true,
                check: (h, s) => s.hardPityReached
        },
        {
                id: 'all-3star-10pull',
                title: 'Sangat Sial',
                desc: 'Dapatkan 10× 3★ dalam satu 10-pull',
                icon: '💔',
                tier: 'gold',
                hidden: true,
                check: (h, s) => s.pulledAll3star10
        },
        {
                id: 'novice-maxed',
                title: 'Lulusan Beginner',
                desc: 'Selesaikan Novice Wish (20/20 pulls)',
                icon: '🎓',
                tier: 'gold',
                check: (h, s) => s.noviceMaxed
        },

        // ── Platinum (legendary) ──
        {
                id: 'pulls-1000',
                title: 'Wish Legend',
                desc: 'Lakukan 1000 pull total',
                icon: '👑',
                tier: 'platinum',
                check: (h, s) => s.totalPulls >= 1000
        },
        {
                id: 'win-10x-5050',
                title: 'Hoki Terkurung',
                desc: 'Menang 10× 50/50',
                icon: '🍀🍀',
                tier: 'platinum',
                check: (h, s) => s.wins5050 >= 10
        },
        {
                id: 'best-streak-89',
                title: 'Penyabar Sejati',
                desc: 'Streak no-5★ terpanjang 89 pulls (1 short of hard pity)',
                icon: '🧘',
                tier: 'platinum',
                hidden: true,
                check: (h, s) => s.bestStreak >= 89
        }
];

// ── Helpers ──────────────────────────────────────────────────────────────────

export function tierColor(tier: Achievement['tier']): string {
        switch (tier) {
                case 'bronze':   return 'border-[#CD7F32]/50 bg-[#CD7F32]/10 text-[#CD7F32]';
                case 'silver':   return 'border-[#B8C1D3]/50 bg-[#B8C1D3]/10 text-[#B8C1D3]';
                case 'gold':     return 'border-[#E6C77A]/60 bg-[#E6C77A]/10 text-[#E6C77A]';
                case 'platinum': return 'border-[#7DCBE0]/60 bg-[#7DCBE0]/10 text-[#7DCBE0]';
        }
}

export function tierLabel(tier: Achievement['tier']): string {
        return tier.charAt(0).toUpperCase() + tier.slice(1);
}
