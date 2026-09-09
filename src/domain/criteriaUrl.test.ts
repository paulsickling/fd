import { describe, expect, it } from 'vitest';
import {
  criteriaFromSearchParams,
  criteriaToSearchParams,
  isEmptyCriteria,
} from './criteriaUrl';
import type { PropertySearchCriteria } from './filters';

const parse = (query: string) => criteriaFromSearchParams(new URLSearchParams(query));

describe('criteria round trip', () => {
  it('survives a full round trip unchanged, so a shared URL reproduces the search', () => {
    const criteria: PropertySearchCriteria = {
      destinationId: 'bali',
      minPriceUsd: 500_000,
      maxPriceUsd: 2_000_000,
      minBedrooms: 3,
      seaView: true,
      skill: 'intermediate',
      breakDirection: 'left',
      maxTravelMinutes: 15,
      sort: 'price-asc',
      propertyTypes: ['villa', 'estate'],
      tenureTypes: ['hak-sewa'],
      breakTypes: ['reef'],
    };

    expect(criteriaFromSearchParams(criteriaToSearchParams(criteria))).toEqual(criteria);
  });

  it('omits absent filters rather than writing empty parameters', () => {
    expect(criteriaToSearchParams({ destinationId: 'bali' }).toString()).toBe(
      'destinationId=bali',
    );
  });

  it('round-trips seaView false, which is a real filter and not an absence', () => {
    expect(parse('seaView=false')).toEqual({ seaView: false });
    expect(parse('seaView=true')).toEqual({ seaView: true });
  });
});

describe('parsing a user-editable URL', () => {
  it('drops a non-numeric number rather than passing NaN into a filter', () => {
    expect(parse('minBedrooms=banana')).toEqual({});
    expect(parse('maxPriceUsd=')).toEqual({});
  });

  it('drops an unknown enum value', () => {
    expect(parse('sort=by-vibes')).toEqual({});
    expect(parse('skill=godlike')).toEqual({});
    expect(parse('breakDirection=sideways')).toEqual({});
  });

  it('keeps the valid members of a partially invalid list', () => {
    expect(parse('propertyTypes=villa,submarine,condo')).toEqual({
      propertyTypes: ['villa', 'condo'],
    });
  });

  it('drops a list with no valid members at all', () => {
    expect(parse('breakTypes=lava,glacier')).toEqual({});
  });

  it('ignores an empty destination rather than filtering on the empty string', () => {
    expect(parse('destinationId=')).toEqual({});
  });

  it('ignores parameters it does not know about', () => {
    expect(parse('utm_source=newsletter&destinationId=bali')).toEqual({ destinationId: 'bali' });
  });
});

describe('isEmptyCriteria', () => {
  it('distinguishes no filters from any filter', () => {
    expect(isEmptyCriteria({})).toBe(true);
    expect(isEmptyCriteria({ seaView: false })).toBe(false);
    expect(isEmptyCriteria({ destinationId: 'bali' })).toBe(false);
  });
});
