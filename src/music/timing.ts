/**
 * Shared musical-time constants, in 4/4 time. A "tick" is the smallest
 * scheduling unit (a 16th note) — fine enough to cover every pattern's
 * fastest subdivision (arpeggio's 8th notes) with a single unified clock,
 * per the architecture's "one Transport, patterns just pick which ticks to
 * hit" design. Both the pattern engine and the beat scheduler import these
 * so they always agree on what a "beat" or "bar" means.
 */
export const TICKS_PER_BEAT = 4;
export const BEATS_PER_BAR = 4;
export const TICKS_PER_BAR = TICKS_PER_BEAT * BEATS_PER_BAR;
