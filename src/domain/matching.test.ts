import { describe, expect, it } from 'vitest';
import { matchDestination, matchProperty, rankDestinations, scoreBreak } from './matching';
import type {
  Destination,
  MonthScore,
  Property,
  Seasonality,
  SurfBreak,
  SurferProfile,
} from './types';

const season = (...scores: number[]) => scores as unknown as Seasonality;
const flat = Array.from({ length: 12 }, () => 8 as MonthScore) as unknown as Seasonality;
const bukit = season(3, 3, 5, 8, 9, 10, 10, 10, 9, 8, 5, 3); // Apr-Oct
const gulf = season(9, 8, 5, 4, 2, 1, 1, 1, 1, 4, 10, 10); // Nov-Feb

function makeBreak(overrides: Partial<SurfBreak> & Pick<SurfBreak, 'id'>): SurfBreak {
  return {
    name: overrides.id,
    aliases: [],
    destinationId: 'bali',
    type: 'reef',
    direction: 'left',
    skill: 'intermediate',
    skillCeiling: 'expert',
    optimal: {
      swellDirection: 'SW',
      swellSizeFt: { min: 3, max: 10 },
      windDirection: 'SE',
      tide: 'mid',
    },
    seasonality: flat,
    bottom: 'reef',
    hazards: [],
    crowdFactor: 3,
    paddleOutMinutes: 5,
    notes: '',
    mapPoint: { x: 0.5, y: 0.5 },
    ...overrides,
  };
}

function makeProperty(overrides: Partial<Property> & Pick<Property, 'id'>): Property {
  return {
    title: overrides.id,
    destinationId: 'bali',
    locality: 'Bingin',
    type: 'villa',
    priceUsd: 1_000_000,
    priceLocal: { amount: 16_200_000_000, currency: 'IDR' },
    bedrooms: 3,
    bathrooms: 3,
    landSqm: 400,
    builtSqm: 300,
    tenure: 'hak-sewa',
    features: [],
    seaView: false,
    images: [],
    description: '',
    nearbyBreaks: [],
    mapPoint: { x: 0.5, y: 0.5 },
    ...overrides,
  };
}

const beginner: SurferProfile = {
  ability: 'beginner',
  boards: ['longboard'],
  crowdTolerance: 2,
  preferredDirection: 'no-preference',
};
const charger: SurferProfile = {
  ability: 'expert',
  boards: ['shortboard'],
  crowdTolerance: 5,
  preferredDirection: 'left',
};

const mellowBeach = makeBreak({
  id: 'chaweng',
  type: 'beach',
  skill: 'beginner',
  skillCeiling: 'intermediate',
  crowdFactor: 2,
});
const heavyReef = makeBreak({
  id: 'padang-padang',
  type: 'reef',
  skill: 'expert',
  skillCeiling: 'expert',
  crowdFactor: 5,
});

describe('scoreBreak', () => {
  it('ranks the same two breaks oppositely for a beginner and an expert', () => {
    expect(scoreBreak(mellowBeach, beginner)).toBeGreaterThan(scoreBreak(heavyReef, beginner));
    expect(scoreBreak(heavyReef, charger)).toBeGreaterThan(scoreBreak(mellowBeach, charger));
  });

  it('punishes being under-gunned harder than being over-gunned', () => {
    // A beginner at an expert reef is in danger; an expert at a beginner beach is bored.
    const beginnerAtHeavy = scoreBreak(heavyReef, beginner);
    const expertAtMellow = scoreBreak(mellowBeach, charger);

    expect(beginnerAtHeavy).toBeLessThan(expertAtMellow);
  });

  it('does not penalise a break for being quieter than tolerated', () => {
    const quiet = makeBreak({ id: 'quiet', crowdFactor: 1 });
    const atTolerance = makeBreak({ id: 'at-tolerance', crowdFactor: 5 });

    expect(scoreBreak(quiet, charger)).toBeGreaterThanOrEqual(scoreBreak(atTolerance, charger));
  });

  it('weighs the months the surfer can actually travel', () => {
    const summerOnly: SurferProfile = { ...charger, travelMonths: [7] };
    const winterOnly: SurferProfile = { ...charger, travelMonths: [1] };
    const bukitBreak = makeBreak({ id: 'uluwatu', seasonality: bukit, skill: 'advanced' });

    expect(scoreBreak(bukitBreak, summerOnly)).toBeGreaterThan(scoreBreak(bukitBreak, winterOnly));
  });
});

describe('matchProperty', () => {
  it('explains itself: every result carries a readable headline', () => {
    const property = makeProperty({
      id: 'walkable',
      nearbyBreaks: [{ breakId: 'chaweng', travelMinutes: 5, travelMode: 'walk' }],
    });

    const result = matchProperty(property, [mellowBeach], beginner);

    expect(result.headline.length).toBeGreaterThan(0);
    expect(result.signals.every((signal) => signal.reason.length > 0)).toBe(true);
  });

  it('rewards walking to the water over driving to it', () => {
    const walk = makeProperty({
      id: 'walk',
      nearbyBreaks: [{ breakId: 'chaweng', travelMinutes: 5, travelMode: 'walk' }],
    });
    const drive = makeProperty({
      id: 'drive',
      nearbyBreaks: [{ breakId: 'chaweng', travelMinutes: 45, travelMode: 'drive' }],
    });

    expect(matchProperty(walk, [mellowBeach], beginner).score).toBeGreaterThan(
      matchProperty(drive, [mellowBeach], beginner).score,
    );
  });

  it('ranks on the best reachable break, not an average of them', () => {
    // One great wave nearby beats several mediocre ones, which is how surfers think.
    const mixed = makeProperty({
      id: 'mixed',
      nearbyBreaks: [
        { breakId: 'padang-padang', travelMinutes: 5, travelMode: 'walk' },
        { breakId: 'chaweng', travelMinutes: 5, travelMode: 'walk' },
      ],
    });
    const onlyGood = makeProperty({
      id: 'only-good',
      nearbyBreaks: [{ breakId: 'padang-padang', travelMinutes: 5, travelMode: 'walk' }],
    });

    expect(matchProperty(mixed, [mellowBeach, heavyReef], charger).score).toBe(
      matchProperty(onlyGood, [heavyReef], charger).score,
    );
  });

  it('scores zero and says so when no break is reachable', () => {
    const inland = matchProperty(makeProperty({ id: 'inland' }), [mellowBeach], beginner);

    expect(inland.score).toBe(0);
    expect(inland.headline).toMatch(/no surf/i);
  });

  it('ignores an edge pointing at a break that is not in the atlas', () => {
    const orphan = makeProperty({
      id: 'orphan',
      nearbyBreaks: [{ breakId: 'ghost', travelMinutes: 5, travelMode: 'walk' }],
    });

    expect(matchProperty(orphan, [mellowBeach], beginner).score).toBe(0);
  });
});

describe('rankDestinations', () => {
  const bali = {
    id: 'bali',
    name: 'Bali',
    country: 'Indonesia',
    countryCode: 'ID',
    tagline: '',
    summary: '',
    heroImage: { src: '', alt: '', credit: '', creditUrl: '' },
    access: 'road' as const,
    surfSeason: { peakMonths: [], shoulderMonths: [], note: '' },
    weatherSeason: { peakMonths: [], shoulderMonths: [], note: '' },
    crowdSeason: { peakMonths: [], shoulderMonths: [], note: '' },
    skillRange: ['advanced' as const],
    priceRange: { minUsd: 0, maxUsd: 0 },
    tenureRegimeId: 'ID',
    breakIds: [],
    mapAspect: 1.4,
  };
  const koSamui = { ...bali, id: 'ko-samui', name: 'Ko Samui', countryCode: 'TH' };

  // Both breaks suit an intermediate, so the travel month is the only thing separating
  // them. That isolation is deliberate: see the ability-dominance test below.
  const breaks = [
    makeBreak({
      id: 'uluwatu',
      destinationId: 'bali',
      seasonality: bukit,
      skill: 'intermediate',
      skillCeiling: 'expert',
    }),
    makeBreak({
      id: 'chaweng',
      destinationId: 'ko-samui',
      seasonality: gulf,
      type: 'beach',
      skill: 'beginner',
      skillCeiling: 'advanced',
    }),
  ];
  const intermediate: SurferProfile = {
    ability: 'intermediate',
    boards: ['shortboard'],
    crowdTolerance: 4,
    preferredDirection: 'no-preference',
  };

  it('flips the ranking with the travel month, which is the whole seasonal argument', () => {
    const july: SurferProfile = { ...intermediate, travelMonths: [7] };
    const january: SurferProfile = { ...intermediate, travelMonths: [1] };

    expect(rankDestinations([bali, koSamui], breaks, july)[0]!.destination.id).toBe('bali');
    expect(rankDestinations([bali, koSamui], breaks, january)[0]!.destination.id).toBe('ko-samui');
  });

  it('lets ability outrank season: an expert is not sent to a beginner beach in season', () => {
    const beginnerBreaks = [
      makeBreak({ id: 'uluwatu', destinationId: 'bali', seasonality: bukit, skill: 'advanced' }),
      makeBreak({
        id: 'chaweng',
        destinationId: 'ko-samui',
        seasonality: gulf,
        type: 'beach',
        skill: 'beginner',
        skillCeiling: 'intermediate',
      }),
    ];
    const januaryExpert: SurferProfile = { ...charger, travelMonths: [1] };

    // January is Bali's off-season and Ko Samui's peak, yet Bali still wins because the
    // only wave in Ko Samui is far below this surfer's level. Ability is weighted highest
    // on purpose — a wave you do not want is not a match, whatever the season.
    expect(rankDestinations([bali, koSamui], beginnerBreaks, januaryExpert)[0]!.destination.id).toBe(
      'bali',
    );
  });

  it('gives a different ordering to a beginner than to an expert', () => {
    const beginnerOrder = rankDestinations([bali, koSamui], breaks, beginner).map(
      (entry) => entry.destination.id,
    );
    const expertOrder = rankDestinations([bali, koSamui], breaks, charger).map(
      (entry) => entry.destination.id,
    );

    expect(beginnerOrder).not.toEqual(expertOrder);
  });

  it('breaks ties deterministically so results do not shuffle between renders', () => {
    const first = rankDestinations([bali, koSamui], [], beginner).map((e) => e.destination.id);
    const second = rankDestinations([koSamui, bali], [], beginner).map((e) => e.destination.id);

    expect(first).toEqual(second);
  });
});

describe('matchDestination', () => {
  it('reports no breaks rather than scoring an empty destination', () => {
    const nowhere: Destination = {
      id: 'nowhere',
      name: 'Nowhere',
      country: 'Nowhere',
      countryCode: 'ZZ',
      tagline: '',
      summary: '',
      heroImage: { src: '', alt: '', credit: '', creditUrl: '' },
      access: 'flight',
      surfSeason: { peakMonths: [], shoulderMonths: [], note: '' },
      weatherSeason: { peakMonths: [], shoulderMonths: [], note: '' },
      crowdSeason: { peakMonths: [], shoulderMonths: [], note: '' },
      skillRange: [],
      priceRange: { minUsd: 0, maxUsd: 0 },
      tenureRegimeId: 'ZZ',
      breakIds: [],
      mapAspect: 1.4,
    };

    const empty = matchDestination(nowhere, [], beginner);

    expect(empty.score).toBe(0);
    expect(empty.headline).toMatch(/no breaks/i);
  });
});
