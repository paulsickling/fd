import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '@/app/providers';
import { bundledSeed } from '@/data/json/JsonDataRepository';
import { formatBreakSummary, formatSkillRange } from '@/domain/format';
import { PropertyDetailPage } from './PropertyDetailPage';

/** Real seed ids — the page is only interesting against the researched data. */
const CLIFFTOP = 'bali-uluwatu-clifftop-pavilion'; // drives to every break
const CLIFF_HOUSE = 'bali-bingin-cliff-house'; // 4 min walk to Bingin
const SAMUI_VILLA = 'samui-chaweng-hill-villa'; // Thai 30-year leasehold

function seedProperty(id: string) {
  const property = bundledSeed.properties.find((candidate) => candidate.id === id);
  if (!property) throw new Error(`Seed property ${id} is missing`);
  return property;
}

function seedBreak(id: string) {
  const surfBreak = bundledSeed.breaks.find((candidate) => candidate.id === id);
  if (!surfBreak) throw new Error(`Seed break ${id} is missing`);
  return surfBreak;
}

function renderProperty(id: string) {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[`/properties/${id}`]}>
        <Routes>
          <Route path="/properties/:propertyId" element={<PropertyDetailPage />} />
        </Routes>
      </MemoryRouter>
    </AppProviders>,
  );
}

describe('PropertyDetailPage', () => {
  it('leads with the listing: title, price in both currencies, and the specification', async () => {
    renderProperty(CLIFFTOP);

    expect(
      await screen.findByRole('heading', { name: 'Clifftop Pavilion, Uluwatu', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText('USD 2,000,000')).toBeInTheDocument();
    expect(screen.getByText(/IDR 32\.40bn/)).toBeInTheDocument();

    // bed / bath / land / built, read off the definition list rather than the markup.
    expect(screen.getByText('Bedrooms').parentElement).toHaveTextContent('4');
    expect(screen.getByText('Bathrooms').parentElement).toHaveTextContent('4');
    expect(screen.getByText('500 m²')).toBeInTheDocument();
    expect(screen.getByText('420 m²')).toBeInTheDocument();
  });

  it('lists every nearby break with its travel time, closest first', async () => {
    renderProperty(CLIFF_HOUSE);

    const surf = await screen.findByRole('region', { name: /the surf/i });
    const rows = await within(surf).findAllByRole('link');

    expect(rows).toHaveLength(seedProperty(CLIFF_HOUSE).nearbyBreaks.length);
    expect(rows[0]).toHaveTextContent('Bingin');
    expect(rows[0]).toHaveTextContent('4 min walk');
    expect(rows[1]).toHaveTextContent('Padang Padang');
    expect(rows[1]).toHaveTextContent('7 min drive');
    expect(rows[2]).toHaveTextContent('Impossibles');
    expect(rows[2]).toHaveTextContent('9 min walk');
  });

  it('links each nearby break to its own page', async () => {
    renderProperty(CLIFF_HOUSE);

    const surf = await screen.findByRole('region', { name: /the surf/i });
    const bingin = await within(surf).findByRole('link', { name: /bingin/i });

    expect(bingin).toHaveAttribute('href', '/breaks/bingin');
  });

  it('takes the character of each break from the surf atlas, not from the listing', async () => {
    renderProperty(CLIFF_HOUSE);

    const surf = await screen.findByRole('region', { name: /the surf/i });
    const rows = await within(surf).findAllByRole('link');

    // Bingin and Padang Padang sit on the same stretch of reef but read differently,
    // and they can only read differently if the facts come from their atlas records.
    const bingin = seedBreak('bingin');
    const padang = seedBreak('padang-padang');

    expect(rows[0]).toHaveTextContent(formatBreakSummary(bingin.type, bingin.direction));
    expect(rows[0]).toHaveTextContent(formatSkillRange(bingin.skill, bingin.skillCeiling));
    expect(rows[1]).toHaveTextContent(formatSkillRange(padang.skill, padang.skillCeiling));
    expect(formatSkillRange(bingin.skill, bingin.skillCeiling)).not.toEqual(
      formatSkillRange(padang.skill, padang.skillCeiling),
    );
  });

  it('gives the walk-to-the-break listing its dawn patrol headline', async () => {
    renderProperty(CLIFF_HOUSE);

    expect(await screen.findByText('3 breaks · 4 min walk · dawn patrol on foot')).toBeInTheDocument();
  });

  it('does not claim a dawn patrol when every break is a drive away', async () => {
    renderProperty(CLIFFTOP);

    expect(await screen.findByText('3 breaks · 6 min drive')).toBeInTheDocument();
    expect(screen.queryByText(/dawn patrol/i)).not.toBeInTheDocument();
  });

  it('states the tenure of this listing with its risk note at full weight', async () => {
    renderProperty(CLIFF_HOUSE);

    expect(
      await screen.findByRole('heading', { name: /what you would own in indonesia/i }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /pt pma/i })).toBeInTheDocument();

    // CAP-8: the honest caveat is the reason the panel exists.
    expect(screen.getByText(/permanent running cost/i)).toBeInTheDocument();
  });

  it('shows the Thai regime on a Thai listing, not the Indonesian one', async () => {
    renderProperty(SAMUI_VILLA);

    expect(
      await screen.findByRole('heading', { name: /what you would own in thailand/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/30\+30\+30/)).toBeInTheDocument();
    expect(screen.queryByText(/hak pakai/i)).not.toBeInTheDocument();
  });

  it('credits the photographer of every image it shows, which the licence requires', async () => {
    renderProperty(CLIFFTOP);

    await screen.findByRole('heading', { level: 1 });
    const images = seedProperty(CLIFFTOP).images;

    expect(screen.getAllByText(/^photograph:$/i)).toHaveLength(images.length);
    for (const image of images) {
      expect(screen.getByRole('link', { name: image.credit })).toHaveAttribute(
        'href',
        image.creditUrl,
      );
      expect(screen.getByAltText(image.alt)).toBeInTheDocument();
    }
  });

  it('offers a way back to the destination the listing belongs to', async () => {
    renderProperty(CLIFF_HOUSE);

    expect(await screen.findByRole('link', { name: /back to property in bali/i })).toHaveAttribute(
      'href',
      '/destinations/bali',
    );
  });

  it('handles an unknown property id without crashing', async () => {
    renderProperty('bali-nonexistent-shack');

    expect(await screen.findByText(/don.t have a listing by that reference/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to destinations/i })).toBeInTheDocument();
  });
});
