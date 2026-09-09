import type { PropertySearchCriteria, PropertySort } from '@/domain/filters';
import type { Destination, TenureRegime } from '@/domain/types';

type CriteriaPatch = {
  [K in keyof PropertySearchCriteria]?: PropertySearchCriteria[K] | undefined;
};

/**
 * The filter panel.
 *
 * Ordered to match how this buyer actually narrows down: destination first, then budget,
 * then the surf, then the property itself, then ownership. A conventional portal would put
 * bedrooms at the top; here the surf outranks it, because that is the premise (SPEC.md
 * CAP-2).
 *
 * Fully controlled — the page owns the criteria and keeps them in the URL.
 */
export function SearchFilters({
  criteria,
  destinations,
  regimes,
  onChange,
  onClear,
  resultCount,
}: {
  criteria: PropertySearchCriteria;
  destinations: readonly Destination[];
  regimes: readonly TenureRegime[];
  onChange: (next: PropertySearchCriteria) => void;
  onClear: () => void;
  resultCount: number | undefined;
}) {
  /**
   * `undefined` here means "remove this filter", which under exactOptionalPropertyTypes is
   * distinct from the key being absent — hence the explicit union rather than Partial.
   */
  const update = (patch: CriteriaPatch) => {
    const next: Record<string, unknown> = { ...criteria, ...patch };
    // An undefined value means "filter removed", so drop the key rather than serialising it.
    for (const key of Object.keys(next)) {
      if (next[key] === undefined) delete next[key];
    }
    onChange(next as PropertySearchCriteria);
  };

  const tenureTypes = regimes.flatMap((regime) =>
    regime.types.map((type) => ({ ...type, country: regime.country })),
  );

  return (
    <form
      aria-label="Property filters"
      className="space-y-8"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-xs uppercase tracking-[0.2em] text-ink-700">
          {resultCount === undefined
            ? 'Searching'
            : `${resultCount} ${resultCount === 1 ? 'property' : 'properties'}`}
        </p>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-ocean-700 underline underline-offset-2 hover:text-ink-900"
        >
          Clear all
        </button>
      </div>

      <Field label="Destination" htmlFor="filter-destination">
        <Select
          id="filter-destination"
          value={criteria.destinationId ?? ''}
          onChange={(value) => update({ destinationId: value || undefined })}
          options={[
            { value: '', label: 'Anywhere' },
            ...destinations.map((d) => ({ value: d.id, label: d.name })),
          ]}
        />
      </Field>

      <fieldset>
        <legend className="text-[11px] uppercase tracking-[0.14em] text-ink-700">Budget</legend>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <NumberInput
            id="filter-min-price"
            label="Min USD"
            value={criteria.minPriceUsd}
            step={50_000}
            onChange={(value) => update({ minPriceUsd: value })}
          />
          <NumberInput
            id="filter-max-price"
            label="Max USD"
            value={criteria.maxPriceUsd}
            step={50_000}
            onChange={(value) => update({ maxPriceUsd: value })}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-[11px] uppercase tracking-[0.14em] text-ink-700">The surf</legend>
        <div className="mt-2 space-y-3">
          <Select
            id="filter-skill"
            aria-label="Your ability"
            value={criteria.skill ?? ''}
            onChange={(value) =>
              update({ skill: (value || undefined) as PropertySearchCriteria['skill'] })
            }
            options={[
              { value: '', label: 'Any ability' },
              { value: 'beginner', label: 'Beginner' },
              { value: 'intermediate', label: 'Intermediate' },
              { value: 'advanced', label: 'Advanced' },
              { value: 'expert', label: 'Expert' },
            ]}
          />
          <Select
            id="filter-break-type"
            aria-label="Break type"
            value={criteria.breakTypes?.[0] ?? ''}
            onChange={(value) =>
              update({
                breakTypes: value
                  ? ([value] as PropertySearchCriteria['breakTypes'])
                  : undefined,
              })
            }
            options={[
              { value: '', label: 'Any break type' },
              { value: 'reef', label: 'Reef break' },
              { value: 'point', label: 'Point break' },
              { value: 'beach', label: 'Beach break' },
              { value: 'rivermouth', label: 'Rivermouth' },
            ]}
          />
          <Select
            id="filter-direction"
            aria-label="Wave direction"
            value={criteria.breakDirection ?? ''}
            onChange={(value) =>
              update({
                breakDirection: (value || undefined) as PropertySearchCriteria['breakDirection'],
              })
            }
            options={[
              { value: '', label: 'Left or right' },
              { value: 'left', label: 'Lefts' },
              { value: 'right', label: 'Rights' },
            ]}
          />
          <Select
            id="filter-travel"
            aria-label="Maximum travel to a break"
            value={criteria.maxTravelMinutes === undefined ? '' : String(criteria.maxTravelMinutes)}
            onChange={(value) => update({ maxTravelMinutes: value ? Number(value) : undefined })}
            options={[
              { value: '', label: 'Any distance from the water' },
              { value: '10', label: 'Within 10 minutes' },
              { value: '20', label: 'Within 20 minutes' },
              { value: '40', label: 'Within 40 minutes' },
            ]}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-[11px] uppercase tracking-[0.14em] text-ink-700">
          The property
        </legend>
        <div className="mt-2 space-y-3">
          <Select
            id="filter-bedrooms"
            aria-label="Minimum bedrooms"
            value={criteria.minBedrooms === undefined ? '' : String(criteria.minBedrooms)}
            onChange={(value) => update({ minBedrooms: value ? Number(value) : undefined })}
            options={[
              { value: '', label: 'Any bedrooms' },
              { value: '2', label: '2+ bedrooms' },
              { value: '3', label: '3+ bedrooms' },
              { value: '4', label: '4+ bedrooms' },
              { value: '5', label: '5+ bedrooms' },
            ]}
          />
          <Select
            id="filter-type"
            aria-label="Property type"
            value={criteria.propertyTypes?.[0] ?? ''}
            onChange={(value) =>
              update({
                propertyTypes: value
                  ? ([value] as PropertySearchCriteria['propertyTypes'])
                  : undefined,
              })
            }
            options={[
              { value: '', label: 'Any type' },
              { value: 'villa', label: 'Villa' },
              { value: 'estate', label: 'Estate' },
              { value: 'condo', label: 'Condominium' },
              { value: 'land', label: 'Land' },
            ]}
          />
          <label className="flex items-center gap-2 text-sm text-ink-900">
            <input
              type="checkbox"
              checked={criteria.seaView === true}
              onChange={(event) => update({ seaView: event.target.checked ? true : undefined })}
              className="h-4 w-4 accent-ocean-700"
            />
            Sea view only
          </label>
        </div>
      </fieldset>

      <Field label="Ownership" htmlFor="filter-tenure">
        <Select
          id="filter-tenure"
          value={criteria.tenureTypes?.[0] ?? ''}
          onChange={(value) =>
            update({
              tenureTypes: value
                ? ([value] as PropertySearchCriteria['tenureTypes'])
                : undefined,
            })
          }
          options={[
            { value: '', label: 'Any ownership structure' },
            ...tenureTypes.map((type) => ({
              value: type.id,
              label: `${type.label} (${type.country})`,
            })),
          ]}
        />
      </Field>

      <Field label="Sort by" htmlFor="filter-sort">
        <Select
          id="filter-sort"
          value={criteria.sort ?? ''}
          onChange={(value) => update({ sort: (value || undefined) as PropertySort | undefined })}
          options={[
            { value: '', label: 'Default' },
            { value: 'price-asc', label: 'Price, low to high' },
            { value: 'price-desc', label: 'Price, high to low' },
            { value: 'bedrooms-desc', label: 'Most bedrooms' },
            { value: 'closest-break', label: 'Closest to a break' },
          ]}
        />
      </Field>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="text-[11px] uppercase tracking-[0.14em] text-ink-700"
      >
        {label}
      </label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Select({
  id,
  value,
  onChange,
  options,
  ...rest
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
  'aria-label'?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full border-b border-sand-200 bg-transparent py-2 text-sm text-ink-900 focus:border-ocean-500 focus:outline-none"
      {...rest}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function NumberInput({
  id,
  label,
  value,
  step,
  onChange,
}: {
  id: string;
  label: string;
  value: number | undefined;
  step: number;
  onChange: (value: number | undefined) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        step={step}
        placeholder={label}
        value={value === undefined ? '' : String(value)}
        onChange={(event) => {
          const raw = event.target.value;
          onChange(raw === '' ? undefined : Number(raw));
        }}
        className="w-full border-b border-sand-200 bg-transparent py-2 text-sm text-ink-900 placeholder:text-ink-700/70 focus:border-ocean-500 focus:outline-none"
      />
    </div>
  );
}
