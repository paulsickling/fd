import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '@/app/providers';
import { DestinationPage } from './DestinationPage';
import { bundledSeed } from '@/data/json/JsonDataRepository';

function renderDestination(id: string) {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[`/destinations/${id}`]}>
        <Routes>
          <Route path="/destinations/:destinationId" element={<DestinationPage />} />
        </Routes>
      </MemoryRouter>
    </AppProviders>,
  );
}

describe('DestinationPage', () => {
  it('leads with the destination, then its surf, then its property', async () => {
    renderDestination('bali');

    expect(await screen.findByRole('heading', { name: 'Bali', level: 1 })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /the surf/i })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /property in bali/i })).toBeInTheDocument();
  });

  it('lists the destination breaks and links each to its own page', async () => {
    renderDestination('bali');

    // Scoped to the surf section: "Uluwatu" also appears in property titles and localities,
    // which is itself a sign the break/property graph is wired up.
    const surfSection = await screen.findByRole('region', { name: /the surf/i });
    const uluwatu = within(surfSection).getByRole('link', { name: /uluwatu/i });

    expect(uluwatu).toHaveAttribute('href', '/breaks/uluwatu');
    // Derived from the seed: Bali's atlas gained the Canggu breaks after this was first
    // written, and a hard-coded count would only have recorded the old data.
    const baliBreaks = bundledSeed.breaks.filter((b) => b.destinationId === 'bali');
    expect(within(surfSection).getAllByRole('link')).toHaveLength(baliBreaks.length);
  });

  it('shows only that destination properties', async () => {
    renderDestination('ko-samui');

    const grid = await screen.findByRole('heading', { name: /property in ko samui/i });
    expect(grid).toBeInTheDocument();

    // Bali localities must not leak into the Ko Samui grid.
    expect(screen.queryByText('Bingin')).not.toBeInTheDocument();
  });

  it('states what a foreign buyer can own, with the risk note at full weight', async () => {
    renderDestination('bali');

    expect(
      await screen.findByRole('heading', { name: /what a foreign buyer can own in indonesia/i }),
    ).toBeInTheDocument();

    // CAP-8: the honest caveat is the point of the panel, so assert it is actually shown.
    expect(await screen.findByText(/immigration status/i)).toBeInTheDocument();
  });

  it('shows the Thai regime on a Thai destination, not the Indonesian one', async () => {
    renderDestination('ko-samui');

    expect(
      await screen.findByRole('heading', { name: /what a foreign buyer can own in thailand/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/hak pakai/i)).not.toBeInTheDocument();
  });

  it('credits the hero photographer, which the licence requires', async () => {
    renderDestination('bali');

    const credit = await screen.findByText(/photograph:/i);
    expect(credit).toBeInTheDocument();
  });

  it('handles an unknown destination without crashing', async () => {
    renderDestination('atlantis');

    expect(await screen.findByText(/don.t have a destination by that name/i)).toBeInTheDocument();
  });
});
