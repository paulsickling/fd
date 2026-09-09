/**
 * The single wire format for search criteria.
 *
 * Three things need to agree on how a PropertySearchCriteria is spelled as query
 * parameters: the browser URL (so a search is shareable — a CAP-2 success criterion), the
 * remote repository adapter (which sends criteria to a server), and the fake backend the
 * contract suite drives. Defining it once here is what keeps them honest; a second
 * spelling anywhere would be a silent divergence.
 */

import type { PropertySearchCriteria, PropertySort } from './filters';
import type {
  BreakDirection,
  BreakType,
  PropertyType,
  SkillLevel,
  TenureTypeId,
} from './types';

const SORTS: readonly PropertySort[] = [
  'price-asc',
  'price-desc',
  'bedrooms-desc',
  'closest-break',
];
const SKILLS: readonly SkillLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];
const DIRECTIONS: readonly BreakDirection[] = ['left', 'right', 'both'];
const PROPERTY_TYPES: readonly PropertyType[] = ['villa', 'estate', 'condo', 'land'];
const BREAK_TYPES: readonly BreakType[] = ['reef', 'point', 'beach', 'rivermouth'];
const TENURE_TYPES: readonly TenureTypeId[] = [
  'hak-pakai',
  'hak-sewa',
  'pt-pma',
  'th-leasehold-30',
  'th-company',
  'th-condo-foreign-quota',
];

export function criteriaToSearchParams(criteria: PropertySearchCriteria): URLSearchParams {
  const params = new URLSearchParams();
  const setIf = (key: string, value: string | number | boolean | undefined) => {
    if (value !== undefined) params.set(key, String(value));
  };

  setIf('destinationId', criteria.destinationId);
  setIf('minPriceUsd', criteria.minPriceUsd);
  setIf('maxPriceUsd', criteria.maxPriceUsd);
  setIf('minBedrooms', criteria.minBedrooms);
  setIf('seaView', criteria.seaView);
  setIf('breakDirection', criteria.breakDirection);
  setIf('skill', criteria.skill);
  setIf('maxTravelMinutes', criteria.maxTravelMinutes);
  setIf('sort', criteria.sort);
  if (criteria.propertyTypes?.length) params.set('propertyTypes', criteria.propertyTypes.join(','));
  if (criteria.tenureTypes?.length) params.set('tenureTypes', criteria.tenureTypes.join(','));
  if (criteria.breakTypes?.length) params.set('breakTypes', criteria.breakTypes.join(','));

  return params;
}

/**
 * Parses a number, rejecting junk rather than passing it into a filter.
 *
 * The empty-string case matters: `Number('')` is 0, so a bare `maxPriceUsd=` would
 * otherwise become a real filter of zero and silently return no results at all.
 */
function readNumber(params: URLSearchParams, key: string): number | undefined {
  const raw = params.get(key);
  if (raw === null || raw.trim() === '') return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

function readEnum<T extends string>(
  params: URLSearchParams,
  key: string,
  allowed: readonly T[],
): T | undefined {
  const raw = params.get(key);
  return raw !== null && (allowed as readonly string[]).includes(raw) ? (raw as T) : undefined;
}

function readEnumList<T extends string>(
  params: URLSearchParams,
  key: string,
  allowed: readonly T[],
): readonly T[] | undefined {
  const raw = params.get(key);
  if (raw === null) return undefined;
  const values = raw.split(',').filter((value): value is T => (allowed as readonly string[]).includes(value));
  return values.length > 0 ? values : undefined;
}

/**
 * A URL is user-editable, so every value is validated on the way in. An unknown sort or a
 * bedroom count of "banana" is dropped rather than propagated into the filters.
 */
export function criteriaFromSearchParams(params: URLSearchParams): PropertySearchCriteria {
  const destinationId = params.get('destinationId');
  const seaView = params.get('seaView');

  const minPriceUsd = readNumber(params, 'minPriceUsd');
  const maxPriceUsd = readNumber(params, 'maxPriceUsd');
  const minBedrooms = readNumber(params, 'minBedrooms');
  const maxTravelMinutes = readNumber(params, 'maxTravelMinutes');
  const skill = readEnum(params, 'skill', SKILLS);
  const breakDirection = readEnum(params, 'breakDirection', DIRECTIONS);
  const sort = readEnum(params, 'sort', SORTS);
  const propertyTypes = readEnumList(params, 'propertyTypes', PROPERTY_TYPES);
  const tenureTypes = readEnumList(params, 'tenureTypes', TENURE_TYPES);
  const breakTypes = readEnumList(params, 'breakTypes', BREAK_TYPES);

  return {
    ...(destinationId !== null && destinationId !== '' && { destinationId }),
    ...(minPriceUsd !== undefined && { minPriceUsd }),
    ...(maxPriceUsd !== undefined && { maxPriceUsd }),
    ...(minBedrooms !== undefined && { minBedrooms }),
    ...(seaView !== null && { seaView: seaView === 'true' }),
    ...(breakDirection !== undefined && { breakDirection }),
    ...(skill !== undefined && { skill }),
    ...(maxTravelMinutes !== undefined && { maxTravelMinutes }),
    ...(sort !== undefined && { sort }),
    ...(propertyTypes !== undefined && { propertyTypes }),
    ...(tenureTypes !== undefined && { tenureTypes }),
    ...(breakTypes !== undefined && { breakTypes }),
  };
}

/** True when no filter is applied — used to decide whether to show a "clear" affordance. */
export function isEmptyCriteria(criteria: PropertySearchCriteria): boolean {
  return criteriaToSearchParams(criteria).size === 0;
}
