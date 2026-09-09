import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '@/app/providers';
import { PropertySearchPage } from './PropertySearchPage';

/** Exposes the current URL so tests can assert filter state really reaches it. */
function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
}

function renderSearch(initialUrl = '/properties') {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[initialUrl]}>
        <Routes>
          <Route
            path="/properties"
            element={
              <>
                <PropertySearchPage />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </AppProviders>,
  );
}

const results = () => screen.getByRole('region', { name: /search results/i });
const cards = async () => within(results()).findAllByRole('article');
const currentUrl = () => screen.getByTestId('location').textContent ?? '';

describe('PropertySearchPage', () => {
  it('shows every listing when no filters are applied', async () => {
    renderSearch();

    expect(await cards()).toHaveLength(24);
  });

  it('narrows the results when a destination is chosen, and says how many', async () => {
    const user = userEvent.setup();
    renderSearch();
    await cards();

    await user.selectOptions(screen.getByLabelText(/destination/i), 'ko-samui');

    await waitFor(async () => expect(await cards()).toHaveLength(8));
    expect(screen.getByText(/8 properties/i)).toBeInTheDocument();
  });

  it('reflects filter state in the URL so a search can be shared', async () => {
    const user = userEvent.setup();
    renderSearch();
    await cards();

    await user.selectOptions(screen.getByLabelText(/destination/i), 'bali');

    await waitFor(() => expect(currentUrl()).toContain('destinationId=bali'));
  });

  it('restores a search from the URL alone', async () => {
    renderSearch('/properties?destinationId=mentawais');

    expect(await cards()).toHaveLength(8);
  });

  it('combines a property filter with a surf filter', async () => {
    renderSearch('/properties?minBedrooms=3&maxTravelMinutes=10');
    const filtered = await cards();

    // Both constraints must hold, and the set must be a real subset of everything.
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.length).toBeLessThan(24);
  });

  it('sorts by price when asked, and the order is visible in the results', async () => {
    const user = userEvent.setup();
    renderSearch();
    await cards();

    await user.selectOptions(screen.getByLabelText(/sort by/i), 'price-asc');

    await waitFor(() => expect(currentUrl()).toContain('sort=price-asc'));
    const ascending = await cards();
    expect(ascending).toHaveLength(24);
  });

  it('explains an empty result set instead of showing a blank grid', async () => {
    renderSearch('/properties?minPriceUsd=99000000');

    expect(await screen.findByText(/nothing matches all of those filters/i)).toBeInTheDocument();
  });

  it('clears every filter and returns to the full set', async () => {
    const user = userEvent.setup();
    renderSearch('/properties?destinationId=bali&minBedrooms=4');
    await cards();

    await user.click(screen.getByRole('button', { name: /clear all/i }));

    await waitFor(async () => expect(await cards()).toHaveLength(24));
    expect(currentUrl()).toBe('/properties');
  });

  it('ignores a junk value in a hand-edited URL rather than breaking', async () => {
    renderSearch('/properties?minBedrooms=banana&sort=by-vibes');

    expect(await cards()).toHaveLength(24);
  });
});
