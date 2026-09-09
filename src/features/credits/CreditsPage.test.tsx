import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '@/app/providers';
import { App } from '@/app/App';
import { CreditsPage } from './CreditsPage';
import { bundledSeed } from '@/data/json/JsonDataRepository';

function renderCredits() {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={['/credits']}>
        <CreditsPage />
      </MemoryRouter>
    </AppProviders>,
  );
}

describe('CreditsPage', () => {
  it('names every photographer whose work appears on the site', async () => {
    renderCredits();

    const expected = new Set([
      ...bundledSeed.destinations.map((d) => d.heroImage.credit),
      ...bundledSeed.properties.flatMap((p) => p.images.map((image) => image.credit)),
    ]);

    // Attribution is a licence obligation, so this must be complete, not a sample.
    for (const credit of expected) {
      expect(await screen.findByRole('link', { name: credit })).toBeInTheDocument();
    }
  });

  it('links each photographer to their own page', async () => {
    renderCredits();

    const first = bundledSeed.destinations[0]!.heroImage;
    const link = await screen.findByRole('link', { name: first.credit });

    expect(link).toHaveAttribute('href', first.creditUrl);
  });

  it('is honest that the listings are illustrative rather than real offers', async () => {
    renderCredits();

    expect(await screen.findByText(/not real listings/i)).toBeInTheDocument();
  });
});

describe('app shell', () => {
  it('offers a skip link so keyboard users can bypass the header', () => {
    render(<App />);

    expect(screen.getByRole('link', { name: /skip to content/i })).toHaveAttribute('href', '#main');
  });

  it('reaches the credits page from the footer, which is what makes attribution findable', () => {
    render(<App />);

    const footer = screen.getByRole('navigation', { name: /footer/i });
    expect(within(footer).getByRole('link', { name: /photography credits/i })).toHaveAttribute(
      'href',
      '/credits',
    );
  });

  it('states plainly that the listings are a demonstration', () => {
    render(<App />);

    expect(screen.getByText(/not offers for sale/i)).toBeInTheDocument();
  });
});
