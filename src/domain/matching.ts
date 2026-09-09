/**
 * Surfer profile matching (SPEC.md CAP-6).
 *
 * A transparent weighted heuristic, deliberately not a learned model: the demo has to be
 * able to explain every ranking it produces, and a client asking "why is Ko Samui above
 * Bali for me?" deserves a sentence, not a number. Every contributing signal therefore
 * emits a human-readable reason, and the UI shows the reason.
 *
 * The payoff is that a single static dataset ranks differently for different people — a
 * beginner longboarder and an advanced surfer see materially different orderings of the
 * identical seed.
 */

import type {
  BoardType,
  Destination,
  MonthScore,
  Property,
  SkillLevel,
  SurfBreak,
  SurferProfile,
} from './types';
import { skillRank } from './filters';

export interface MatchSignal {
  readonly key: 'ability' | 'direction' | 'crowd' | 'season' | 'access' | 'board';
  /** 0-1, where 1 is a perfect fit for this signal. */
  readonly score: number;
  /** Relative importance of this signal in the overall score. */
  readonly weight: number;
  /** Shown to the user. Must read as a sentence fragment, not a label. */
  readonly reason: string;
}

export interface MatchResult {
  /** 0-100, rounded. */
  readonly score: number;
  readonly signals: readonly MatchSignal[];
  /** The one or two reasons worth showing on a card. */
  readonly headline: string;
}

const WEIGHTS = {
  ability: 3,
  direction: 1,
  crowd: 1.5,
  season: 2.5,
  board: 1,
  access: 2,
} as const;

/**
 * How well a break suits an ability.
 *
 * Being under-gunned is punished harder than being over-gunned: an expert on a beginner
 * beach break is bored, a beginner at Padang Padang is in danger.
 */
function abilityScore(surfBreak: SurfBreak, ability: SkillLevel): number {
  const surfer = skillRank(ability);
  const floor = skillRank(surfBreak.skill);
  const ceiling = skillRank(surfBreak.skillCeiling);

  if (surfer >= floor && surfer <= ceiling) return 1;
  if (surfer < floor) return Math.max(0, 1 - (floor - surfer) * 0.5);
  return Math.max(0, 1 - (surfer - ceiling) * 0.25);
}

/** Longboards want forgiving beach breaks; guns want size and reef. */
function boardScore(surfBreak: SurfBreak, boards: readonly BoardType[]): number {
  if (boards.length === 0) return 0.5;

  return Math.max(
    ...boards.map((board) => {
      switch (board) {
        case 'longboard':
        case 'sup':
          return surfBreak.type === 'beach' || surfBreak.type === 'point' ? 1 : 0.3;
        case 'gun':
          return surfBreak.optimal.swellSizeFt.max >= 8 ? 1 : 0.3;
        case 'fish':
          return surfBreak.optimal.swellSizeFt.min <= 4 ? 1 : 0.5;
        case 'shortboard':
        default:
          return surfBreak.type === 'reef' || surfBreak.type === 'point' ? 1 : 0.7;
      }
    }),
  );
}

function crowdScore(surfBreak: SurfBreak, tolerance: number): number {
  // Quieter than you can tolerate is never a penalty.
  return surfBreak.crowdFactor <= tolerance
    ? 1
    : Math.max(0, 1 - (surfBreak.crowdFactor - tolerance) * 0.3);
}

function seasonScore(surfBreak: SurfBreak, travelMonths: readonly number[] | undefined): number {
  if (!travelMonths || travelMonths.length === 0) return 0.5;
  const best = Math.max(
    ...travelMonths.map((month) => (surfBreak.seasonality[month - 1] ?? 0) as MonthScore),
  );
  return best / 10;
}

function directionScore(surfBreak: SurfBreak, preferred: SurferProfile['preferredDirection']): number {
  if (preferred === 'no-preference') return 1;
  if (surfBreak.direction === 'both') return 1;
  return surfBreak.direction === preferred ? 1 : 0.35;
}

/** How well a single break suits the profile, before any property is considered. */
export function scoreBreak(surfBreak: SurfBreak, profile: SurferProfile): number {
  const parts = [
    { score: abilityScore(surfBreak, profile.ability), weight: WEIGHTS.ability },
    { score: directionScore(surfBreak, profile.preferredDirection), weight: WEIGHTS.direction },
    { score: crowdScore(surfBreak, profile.crowdTolerance), weight: WEIGHTS.crowd },
    { score: seasonScore(surfBreak, profile.travelMonths), weight: WEIGHTS.season },
    { score: boardScore(surfBreak, profile.boards), weight: WEIGHTS.board },
  ];
  const total = parts.reduce((sum, part) => sum + part.weight, 0);
  return parts.reduce((sum, part) => sum + part.score * part.weight, 0) / total;
}

function combine(signals: readonly MatchSignal[]): number {
  const total = signals.reduce((sum, signal) => sum + signal.weight, 0);
  if (total === 0) return 0;
  return Math.round(
    (signals.reduce((sum, signal) => sum + signal.score * signal.weight, 0) / total) * 100,
  );
}

function headlineFrom(signals: readonly MatchSignal[]): string {
  const ranked = [...signals].sort((a, b) => b.score * b.weight - a.score * a.weight);
  const best = ranked.filter((signal) => signal.score >= 0.75).slice(0, 2);
  if (best.length > 0) return best.map((signal) => signal.reason).join('; ');

  // Nothing scored well — say what is holding it back rather than inventing a positive.
  const worst = ranked[ranked.length - 1];
  return worst ? worst.reason : 'No strong match';
}

/**
 * Score a property for a profile: the best break it can reach, adjusted for how easily it
 * can be reached.
 */
export function matchProperty(
  property: Property,
  breaks: readonly SurfBreak[],
  profile: SurferProfile,
): MatchResult {
  const breaksById = new Map(breaks.map((b) => [b.id, b]));

  const reachable = property.nearbyBreaks
    .map((edge) => ({ edge, surfBreak: breaksById.get(edge.breakId) }))
    .filter((entry): entry is { edge: typeof entry.edge; surfBreak: SurfBreak } =>
      entry.surfBreak !== undefined,
    );

  if (reachable.length === 0) {
    return {
      score: 0,
      signals: [],
      headline: 'No surf within reach of this property',
    };
  }

  // Rank on the single best break, not an average: one great wave nearby beats three
  // mediocre ones, which is how surfers actually think about a location.
  const best = reachable.reduce((bestSoFar, entry) =>
    scoreBreak(entry.surfBreak, profile) > scoreBreak(bestSoFar.surfBreak, profile)
      ? entry
      : bestSoFar,
  );
  const { surfBreak, edge } = best;

  const accessRaw =
    edge.travelMode === 'walk'
      ? 1
      : Math.max(0, 1 - Math.max(0, edge.travelMinutes - 10) / 50);

  const signals: MatchSignal[] = [
    {
      key: 'ability',
      score: abilityScore(surfBreak, profile.ability),
      weight: WEIGHTS.ability,
      reason:
        abilityScore(surfBreak, profile.ability) === 1
          ? `${surfBreak.name} suits your level`
          : `${surfBreak.name} is a stretch at your level`,
    },
    {
      key: 'direction',
      score: directionScore(surfBreak, profile.preferredDirection),
      weight: WEIGHTS.direction,
      reason:
        directionScore(surfBreak, profile.preferredDirection) === 1
          ? `${surfBreak.direction === 'both' ? 'Breaks both ways' : `A ${surfBreak.direction}-hander`}, as you prefer`
          : `Runs the opposite way to your preference`,
    },
    {
      key: 'crowd',
      score: crowdScore(surfBreak, profile.crowdTolerance),
      weight: WEIGHTS.crowd,
      reason:
        crowdScore(surfBreak, profile.crowdTolerance) === 1
          ? 'Quiet enough for you'
          : 'Busier than you said you like',
    },
    {
      key: 'season',
      score: seasonScore(surfBreak, profile.travelMonths),
      weight: WEIGHTS.season,
      reason:
        seasonScore(surfBreak, profile.travelMonths) >= 0.7
          ? 'Working when you can travel'
          : 'Quiet in the months you named',
    },
    {
      key: 'board',
      score: boardScore(surfBreak, profile.boards),
      weight: WEIGHTS.board,
      reason:
        boardScore(surfBreak, profile.boards) >= 0.7
          ? 'Suits what you ride'
          : 'Not really your board',
    },
    {
      key: 'access',
      score: accessRaw,
      weight: WEIGHTS.access,
      reason:
        edge.travelMode === 'walk'
          ? `${edge.travelMinutes} minutes on foot to the water`
          : `${edge.travelMinutes} minute ${edge.travelMode} to the water`,
    },
  ];

  return { score: combine(signals), signals, headline: headlineFrom(signals) };
}

/** Score a destination on its best break for this profile. */
export function matchDestination(
  destination: Destination,
  breaks: readonly SurfBreak[],
  profile: SurferProfile,
): MatchResult {
  const own = breaks.filter((surfBreak) => surfBreak.destinationId === destination.id);
  if (own.length === 0) {
    return { score: 0, signals: [], headline: 'No breaks recorded here' };
  }

  const best = own.reduce((bestSoFar, surfBreak) =>
    scoreBreak(surfBreak, profile) > scoreBreak(bestSoFar, profile) ? surfBreak : bestSoFar,
  );

  const signals: MatchSignal[] = [
    {
      key: 'ability',
      score: abilityScore(best, profile.ability),
      weight: WEIGHTS.ability,
      reason:
        abilityScore(best, profile.ability) === 1
          ? `${best.name} suits your level`
          : `Best wave here is ${best.skill} and up`,
    },
    {
      key: 'season',
      score: seasonScore(best, profile.travelMonths),
      weight: WEIGHTS.season,
      reason:
        seasonScore(best, profile.travelMonths) >= 0.7
          ? 'On song when you can travel'
          : 'Off-season when you can travel',
    },
    {
      key: 'crowd',
      score: crowdScore(best, profile.crowdTolerance),
      weight: WEIGHTS.crowd,
      reason:
        crowdScore(best, profile.crowdTolerance) === 1
          ? 'As quiet as you like it'
          : 'Busier than you said you like',
    },
    {
      key: 'direction',
      score: directionScore(best, profile.preferredDirection),
      weight: WEIGHTS.direction,
      reason:
        directionScore(best, profile.preferredDirection) === 1
          ? 'Runs the way you prefer'
          : 'Mostly the opposite way to your preference',
    },
    {
      key: 'board',
      score: boardScore(best, profile.boards),
      weight: WEIGHTS.board,
      reason: boardScore(best, profile.boards) >= 0.7 ? 'Suits what you ride' : 'Not your board',
    },
  ];

  return { score: combine(signals), signals, headline: headlineFrom(signals) };
}

export function rankDestinations(
  destinations: readonly Destination[],
  breaks: readonly SurfBreak[],
  profile: SurferProfile,
): readonly { destination: Destination; match: MatchResult }[] {
  return destinations
    .map((destination) => ({ destination, match: matchDestination(destination, breaks, profile) }))
    .sort((a, b) =>
      b.match.score === a.match.score
        ? a.destination.id.localeCompare(b.destination.id)
        : b.match.score - a.match.score,
    );
}

export function rankProperties(
  properties: readonly Property[],
  breaks: readonly SurfBreak[],
  profile: SurferProfile,
): readonly { property: Property; match: MatchResult }[] {
  return properties
    .map((property) => ({ property, match: matchProperty(property, breaks, profile) }))
    .sort((a, b) =>
      b.match.score === a.match.score
        ? a.property.id.localeCompare(b.property.id)
        : b.match.score - a.match.score,
    );
}
