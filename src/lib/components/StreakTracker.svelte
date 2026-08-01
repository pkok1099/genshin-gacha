<script lang="ts">
        // Streak tracker — shows the current no-5★ streak for the ACTIVE banner,
        // plus best (longest) streak and the last 5★ pulled. Streak = number of
        // consecutive pulls since the last 5★ (or since the banner's first pull
        // if no 5★ has dropped yet).
        //
        // Streaks are computed from wish history (not tracked separately) so
        // they stay accurate after imports and survive the per-mode pity
        // refactor without an extra migration. We classify each entry by
        // bannerId (same logic as the history page filter).

        import { getGameState, type WishMode, type WishResult } from '$lib/stores/gameState.svelte';
        import { t, localeKey } from '$lib/i18n/index.svelte';

        // Re-render on locale change
        void localeKey();

        const game = getGameState();

        function classifyBanner(bannerId: string): WishMode {
                if (bannerId === 'standard') return 'standard';
                if (bannerId === 'novice') return 'novice';
                return 'character';
        }

        // ── Streak computation ──────────────────────────────────────────────
        // Walk the active-mode history in chronological order (oldest first).
        // - current streak = pulls since the last 5★ (or all pulls if no 5★)
        // - best streak    = longest gap between 5★s ever recorded
        // - last 5★        = the most recent 5★ entry (name + pity at pull)
        type StreakInfo = {
                current: number;
                best: number;
                last5: { name: string; pity: number; timestamp: number } | null;
                total5: number;
        };

        function computeStreak(mode: WishMode): StreakInfo {
                const items = game.wishHistory.filter((r) => classifyBanner(r.bannerId) === mode);
                // history is appended in chronological order, so items is already oldest→newest.
                let current = 0;
                let best = 0;
                let last5: StreakInfo['last5'] = null;
                let total5 = 0;
                let sinceLast5 = 0;

                for (const w of items) {
                        if (w.rarity === 5) {
                                total5 += 1;
                                // Close out the just-ended streak.
                                if (sinceLast5 > best) best = sinceLast5;
                                last5 = { name: w.name, pity: w.pityCount, timestamp: w.timestamp };
                                sinceLast5 = 0;
                        } else {
                                sinceLast5 += 1;
                        }
                }
                // If the user has never hit a 5★, sinceLast5 === items.length (the
                // whole history is the current streak). If they have, the current
                // streak is the gap since the last 5★.
                current = sinceLast5;
                // Edge case: if there was exactly one 5★ at the very end, current=0.
                // That's correct — they're not on a no-5★ streak right now.

                return { current, best, last5, total5 };
        }

        let activeMode = $derived(game.wishMode);
        let streak = $derived(computeStreak(activeMode));

        // ── Visual helpers ──────────────────────────────────────────────────
        // Streak intensity: longer streaks glow hotter (red → orange → gold at soft pity).
        function streakColor(s: number): string {
                if (s >= 74) return 'text-[#E8745A] animate-pulse';
                if (s >= 60) return 'text-[#E0B25A]';
                if (s >= 30) return 'text-[#F2E6D0]';
                return 'text-[#B8C1D3]';
        }

        function streakBarColor(s: number): string {
                if (s >= 74) return 'linear-gradient(to right, #E8745A, #FF8B5A)';
                if (s >= 60) return 'linear-gradient(to right, #E0B25A, #E6C77A)';
                if (s >= 30) return 'linear-gradient(to right, #C9A45A, #E6C77A)';
                return 'linear-gradient(to right, #5E6478, #8E97AA)';
        }

        function streakLabel(s: number): string {
                if (s >= 80) return t('streak.label.hard');
                if (s >= 74) return t('streak.label.soft');
                if (s >= 60) return t('streak.label.near-soft');
                if (s >= 30) return t('streak.label.mid');
                if (s > 0) return t('streak.label.early');
                return t('streak.label.just-got');
        }

        function streakLabelClass(s: number): string {
                if (s >= 74) return 'text-[#E8745A]';
                if (s >= 60) return 'text-[#E0B25A]';
                if (s >= 30) return 'text-[#F2E6D0]';
                return 'text-[#8E97AA]';
        }

        function fmtTime(ts: number): string {
                const d = new Date(ts);
                const now = Date.now();
                const diff = now - ts;
                if (diff < 60_000) return 'baru saja';
                if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m lalu`;
                if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}j lalu`;
                return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
        }

        // Streak visual: 10 dots, filled based on progress to soft pity (74).
        // Each dot = ~7.4 pulls. Beyond 74, dots glow red.
        const SOFT_PITY = 74;
        let dotCount = 10;
        let dotsFilled = $derived(Math.min(dotCount, Math.floor((streak.current / SOFT_PITY) * dotCount)));
</script>

<div class="bg-[#1A2337]/80 backdrop-blur-sm p-4 rounded-xl border border-[#C9A45A]/20 shadow-xl space-y-3">
        <div class="flex items-center justify-between">
                <h3 class="font-heading text-xs font-semibold text-[#F2E6D0] uppercase tracking-wider">
                        <span class="text-[#E6C77A]">🔥</span> {t('streak.title')}
                </h3>
                <span class="text-[10px] text-[#8E97AA] uppercase tracking-wider">
                        {#if activeMode === 'character'}Char Event{:else if activeMode === 'standard'}Standard{:else}Novice{/if}
                </span>
        </div>

        <!-- Current streak (big number) -->
        <div class="text-center py-2">
                <div class="text-[9px] text-[#8E97AA] uppercase tracking-wider mb-1">{t('streak.current')}</div>
                <div class="font-mono text-4xl font-bold tabular-nums {streakColor(streak.current)}">
                        {streak.current}
                        <span class="text-base text-[#8E97AA]">pulls</span>
                </div>
                <div class="mt-1 text-[10px] font-bold uppercase tracking-wider {streakLabelClass(streak.current)}">
                        {streakLabel(streak.current)}
                </div>
        </div>

        <!-- Visual dots -->
        <div class="flex justify-center gap-1 py-1">
                {#each Array(dotCount) as _, i}
                        <div
                                class="w-2.5 h-2.5 rounded-full transition-all duration-300 {i < dotsFilled
                                        ? (streak.current >= 74 ? 'bg-[#E8745A] shadow-[0_0_6px_rgba(232,116,90,0.7)]' : streak.current >= 60 ? 'bg-[#E0B25A] shadow-[0_0_4px_rgba(224,178,90,0.5)]' : 'bg-[#E6C77A]')
                                        : 'bg-[#24314A]'}"
                        ></div>
                {/each}
        </div>

        <!-- Streak bar (progress to soft pity) -->
        <div>
                <div class="flex justify-between text-[9px] text-[#8E97AA] mb-1">
                        <span>0</span>
                        <span class="text-[#E0B25A]">Soft Pity (74)</span>
                        <span class="text-[#E8745A]">Hard (90)</span>
                </div>
                <div class="h-1.5 bg-[#0B1020] rounded-full overflow-hidden border border-[#24314A]/60 relative">
                        <div
                                class="h-full rounded-full transition-all duration-500"
                                style="width: {Math.min((streak.current / 90) * 100, 100)}%; background: {streakBarColor(streak.current)}"
                        ></div>
                        <!-- Soft pity marker at 82% (74/90) -->
                        <div class="absolute top-0 bottom-0 w-px bg-[#E0B25A]/60" style="left: 82%"></div>
                </div>
        </div>

        <!-- Stats row -->
        <div class="grid grid-cols-3 gap-2 pt-2 border-t border-[#24314A]">
                <div class="text-center">
                        <div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">{t('streak.best')}</div>
                        <div class="font-mono text-sm font-bold text-[#E6C77A] tabular-nums">{streak.best}</div>
                </div>
                <div class="text-center">
                        <div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">{t('streak.total5')}</div>
                        <div class="font-mono text-sm font-bold text-[#E6C77A] tabular-nums">{streak.total5}</div>
                </div>
                <div class="text-center">
                        <div class="text-[9px] text-[#8E97AA] uppercase tracking-wider">{t('streak.last5')}</div>
                        <div class="font-mono text-[10px] font-bold text-[#F2E6D0] truncate" title={streak.last5?.name ?? ''}>
                                {streak.last5 ? streak.last5.name : '—'}
                        </div>
                        {#if streak.last5}
                                <div class="text-[8px] text-[#8E97AA] font-mono">pity {streak.last5.pity} · {fmtTime(streak.last5.timestamp)}</div>
                        {/if}
                </div>
        </div>

        {#if streak.current >= 74}
                <div class="text-[10px] text-[#E8745A] bg-[#E8745A]/10 border border-[#E8745A]/30 rounded-md p-2 text-center font-bold uppercase tracking-wider animate-pulse">
                        {t('streak.warning')}
                </div>
        {/if}
</div>
