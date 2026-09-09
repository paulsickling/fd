/**
 * Domain types for the surf-led property PoC.
 *
 * These mirror `_bmad-output/specs/spec-surf-led-expat-property-platform/data-model.md`,
 * which is the contract. Seed JSON must satisfy these types; the compiler is what enforces
 * that the researched data and the application agree.
 *
 * This module is pure: no React, no routing, no knowledge of where data comes from.
 */

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

/** 0 (flat / never works) to 10 (peak season) for a single calendar month. */
export type MonthScore = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/** Exactly twelve scores, January first. */
export type Seasonality = readonly [
  MonthScore, MonthScore, MonthScore, MonthScore, MonthScore, MonthScore,
  MonthScore, MonthScore, MonthScore, MonthScore, MonthScore, MonthScore,
];

export interface SeasonBand {
  /** 1-12, January = 1. */
  readonly peakMonths: readonly number[];
  readonly shoulderMonths: readonly number[];
  readonly note: string;
}

export interface ImageRef {
  readonly src: string;
  readonly alt: string;
  readonly credit: string;
  readonly creditUrl: string;
}

/**
 * Position on a destination's stylised map (CAP-9): unitless 0-1 within the map canvas.
 * Deliberately NOT latitude/longitude — no distance may ever be computed from these.
 * Travel times between properties and breaks are seeded edge data, never derived.
 */
export interface MapPoint {
  readonly x: number;
  readonly y: number;
}

export type BreakType = 'reef' | 'point' | 'beach' | 'rivermouth';
export type BreakDirection = 'left' | 'right' | 'both';
export type Tide = 'low' | 'mid' | 'high' | 'mid-to-high' | 'any';
export type DestinationAccess = 'road' | 'flight' | 'boat-charter';
export type PropertyType = 'villa' | 'estate' | 'condo' | 'land';
export type TravelMode = 'walk' | 'drive' | 'boat';
export type BoardType = 'shortboard' | 'longboard' | 'fish' | 'gun' | 'sup';

export interface OptimalConditions {
  readonly swellDirection: string;
  readonly swellSizeFt: { readonly min: number; readonly max: number };
  readonly windDirection: string;
  readonly tide: Tide;
}

export interface BreakSection {
  readonly name: string;
  readonly notes: string;
}

export interface SurfBreak {
  readonly id: string;
  readonly name: string;
  readonly aliases: readonly string[];
  readonly destinationId: string;
  readonly type: BreakType;
  readonly direction: BreakDirection;
  /** Minimum level that can realistically surf it. */
  readonly skill: SkillLevel;
  /** Top of the range the break rewards. */
  readonly skillCeiling: SkillLevel;
  readonly optimal: OptimalConditions;
  readonly seasonality: Seasonality;
  readonly bottom: string;
  readonly hazards: readonly string[];
  /** 1 (empty) to 5 (a zoo). */
  readonly crowdFactor: 1 | 2 | 3 | 4 | 5;
  readonly paddleOutMinutes: number;
  readonly sections?: readonly BreakSection[];
  readonly notes: string;
  readonly mapPoint: MapPoint;
}

export interface Destination {
  readonly id: string;
  readonly name: string;
  readonly country: string;
  /** ISO-3166 alpha-2; also the key into the tenure regime. */
  readonly countryCode: string;
  readonly tagline: string;
  readonly summary: string;
  readonly heroImage: ImageRef;
  readonly access: DestinationAccess;
  readonly surfSeason: SeasonBand;
  readonly weatherSeason: SeasonBand;
  readonly crowdSeason: SeasonBand;
  readonly skillRange: readonly SkillLevel[];
  readonly priceRange: { readonly minUsd: number; readonly maxUsd: number };
  readonly tenureRegimeId: string;
  readonly breakIds: readonly string[];
  /** Width/height ratio of the stylised map canvas. */
  readonly mapAspect: number;
}

/** The property-to-break edge, carrying the data that earns a listing its headline stat. */
export interface NearbyBreak {
  readonly breakId: string;
  readonly travelMinutes: number;
  readonly travelMode: TravelMode;
}

export type TenureTypeId =
  | 'hak-pakai'
  | 'hak-sewa'
  | 'pt-pma'
  | 'th-leasehold-30'
  | 'th-company'
  | 'th-condo-foreign-quota';

export interface TenureTypeDef {
  readonly id: TenureTypeId;
  readonly label: string;
  readonly foreignerEligible: boolean;
  /** null means perpetual. */
  readonly typicalYears: number | null;
  /** What the buyer is actually getting, in plain English. */
  readonly plainEnglish: string;
  /** The honest caveat. Never generic legalese. */
  readonly riskNote: string;
  /** 1 (weakest) to 5 (strongest) security of ownership for a foreign buyer. */
  readonly securityRating: 1 | 2 | 3 | 4 | 5;
}

export interface TenureRegime {
  readonly countryCode: string;
  readonly country: string;
  readonly types: readonly TenureTypeDef[];
}

export interface Property {
  readonly id: string;
  readonly title: string;
  readonly destinationId: string;
  /** Display only — never a search axis. Discovery is destination-first. */
  readonly locality: string;
  readonly type: PropertyType;
  readonly priceUsd: number;
  readonly priceLocal: { readonly amount: number; readonly currency: string };
  readonly bedrooms: number;
  readonly bathrooms: number;
  readonly landSqm: number;
  readonly builtSqm: number;
  readonly tenure: TenureTypeId;
  readonly tenureYears?: number;
  readonly features: readonly string[];
  /** Carries a real 20-40% market price premium. */
  readonly seaView: boolean;
  readonly images: readonly ImageRef[];
  readonly description: string;
  readonly nearbyBreaks: readonly NearbyBreak[];
  readonly mapPoint: MapPoint;
}

/** Client-side only, persisted to localStorage. Never leaves the browser. */
export interface SurferProfile {
  readonly ability: SkillLevel;
  readonly boards: readonly BoardType[];
  readonly crowdTolerance: 1 | 2 | 3 | 4 | 5;
  readonly preferredDirection: BreakDirection | 'no-preference';
  /** 1-12. Months they could realistically travel. */
  readonly travelMonths?: readonly number[];
}
