/**
 * Seasonality maths for the twelve-month overlay (SPEC.md CAP-5).
 *
 * The overlay is the product's signature graphic because the underlying fact is real and
 * decision-useful: Bali's Bukit peaks April-October while Ko Samui peaks November-February,
 * so the two destinations are seasonally complementary. Everything here is pure — no React,
 * no data source — so the numbers can be tested without rendering a chart.
 */

import type { Destination, MonthScore, Seasonality, SurfBreak } from './types';

export const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

export const MONTHS_IN_YEAR = 12;

/** 1-12 (as used by SeasonBand) to a 0-11 array index. */
export function monthToIndex(month: number): number {
  return month - 1;
}

export function monthLabel(month: number): string {
  return MONTH_LABELS[monthToIndex(month)] ?? '';
}

/**
 * A destination's surf season is the best any of its breaks offers that month — a
 * destination is "on" if somewhere on it is working. This is what lets Bali read as a
 * year-round destination while each individual break has a sharp season.
 */
export function destinationSeasonality(breaks: readonly SurfBreak[]): Seasonality {
  const scores = Array.from({ length: MONTHS_IN_YEAR }, (_, index) => {
    let best = 0;
    for (const surfBreak of breaks) {
      const score = surfBreak.seasonality[index] ?? 0;
      if (score > best) best = score;
    }
    return best as MonthScore;
  });
  return scores as unknown as Seasonality;
}

export interface MonthBand {
  readonly month: number;
  readonly label: string;
  readonly surf: MonthScore;
  /** True when the destination's own weather band calls this month good. */
  readonly goodWeather: boolean;
  /** True when the destination's crowd band peaks this month. */
  readonly busy: boolean;
}

/**
 * The row the overlay renders: surf, weather and crowd aligned on one twelve-month axis.
 * Keeping the three signals in one structure is the point — the insight the buyer needs
 * ("the waves are best in July, but so is everyone else") only exists in their overlap.
 */
export function buildOverlay(
  destination: Destination,
  breaks: readonly SurfBreak[],
): readonly MonthBand[] {
  const surf = destinationSeasonality(breaks);
  const goodWeather = new Set([
    ...destination.weatherSeason.peakMonths,
    ...destination.weatherSeason.shoulderMonths,
  ]);
  const busy = new Set(destination.crowdSeason.peakMonths);

  return Array.from({ length: MONTHS_IN_YEAR }, (_, index) => {
    const month = index + 1;
    return {
      month,
      label: MONTH_LABELS[index]!,
      surf: surf[index]!,
      goodWeather: goodWeather.has(month),
      busy: busy.has(month),
    };
  });
}

/**
 * The months worth travelling for: good surf that is not also the crowd peak.
 * This is the overlay's actual recommendation, and the reason it beats three separate
 * charts.
 */
export function sweetSpotMonths(
  bands: readonly MonthBand[],
  minimumSurf: MonthScore = 7,
): readonly MonthBand[] {
  return bands.filter((band) => band.surf >= minimumSurf && band.goodWeather && !band.busy);
}

export function peakSurfMonths(
  bands: readonly MonthBand[],
  minimumSurf: MonthScore = 8,
): readonly MonthBand[] {
  return bands.filter((band) => band.surf >= minimumSurf);
}

/**
 * How well two destinations cover each other's off-season, 0-1.
 *
 * 1 means every month one is flat the other is firing — the Bali/Ko Samui case that makes
 * owning in both a year-round proposition. Used to justify cross-destination comparison
 * without a dedicated compare screen.
 */
export function seasonalComplementarity(a: Seasonality, b: Seasonality): number {
  let covered = 0;
  let weak = 0;
  for (let index = 0; index < MONTHS_IN_YEAR; index += 1) {
    const first = a[index] ?? 0;
    const second = b[index] ?? 0;
    if (first < 5) {
      weak += 1;
      if (second >= 7) covered += 1;
    }
  }
  // A destination that is never weak is trivially year-round on its own.
  return weak === 0 ? 1 : covered / weak;
}

/** Human-readable month span, e.g. "Apr-Oct", handling wrap-around like "Nov-Feb". */
export function describeMonthRange(months: readonly number[]): string {
  if (months.length === 0) return 'No reliable season';
  const sorted = [...months].sort((a, b) => a - b);
  if (sorted.length === MONTHS_IN_YEAR) return 'Year-round';

  // Detect a wrap-around run (e.g. Nov, Dec, Jan, Feb) by looking for the gap.
  const isContiguous = sorted.every(
    (month, index) => index === 0 || month === sorted[index - 1]! + 1,
  );
  if (isContiguous) {
    return `${monthLabel(sorted[0]!)}-${monthLabel(sorted[sorted.length - 1]!)}`;
  }

  const present = new Set(sorted);
  // The run start is the month whose predecessor is absent, walking the year cyclically.
  const start = sorted.find((month) => !present.has(month === 1 ? MONTHS_IN_YEAR : month - 1));
  const end = sorted.find((month) => !present.has(month === MONTHS_IN_YEAR ? 1 : month + 1));
  if (start === undefined || end === undefined) return 'Year-round';
  return `${monthLabel(start)}-${monthLabel(end)}`;
}
