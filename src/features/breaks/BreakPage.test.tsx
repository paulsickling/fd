import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '@/app/providers';
import { BreakPage } from './BreakPage';

function renderBreak(id: string) {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[`/breaks/${id}`]}>
        <Routes>
          <Route path="/breaks/:breakId" element={<BreakPage />} />
        </Routes>
      </MemoryRouter>
    </AppProviders>,
  );
}

/** Hrefs of the listing links inside a section, which is what the reverse edge amounts to. */
function propertyHrefs(section: HTMLElement): string[] {
  return within(section)
    .getAllByRole('link')
    .map((link) => link.getAttribute('href') ?? '')
    .filter((href) => href.startsWith('/properties/'));
}

describe('BreakPage', () => {
  it('reads as an atlas entry: what the wave is and what it wants', async () => {
    renderBreak('uluwatu');

    expect(await screen.findByRole('heading', { name: 'Uluwatu', level: 1 })).toBeInTheDocument();
    expect(await screen.findByText(/left-hand reef break/i)).toBeInTheDocument();
    expect(await screen.findByText(/advanced.expert/i)).toBeInTheDocument();

    // Optimal conditions, bottom and paddle-out — the facts a surf guide leads with.
    expect(await screen.findByText('Coral reef')).toBeInTheDocument();
    expect(await screen.findByText('SW')).toBeInTheDocument();
    expect(await screen.findByText(/4.12 ft/)).toBeInTheDocument();
    expect(await screen.findByText(/SE offshore/)).toBeInTheDocument();
    expect(await screen.findByText('Any tide')).toBeInTheDocument();
    expect(await screen.findByText(/paddle out takes about 10 min/i)).toBeInTheDocument();
  });

  it('states the crowd and the hazards honestly rather than selling the wave', async () => {
    renderBreak('uluwatu');

    // Uluwatu is a 5 of 5: the number and the sentence both have to say so.
    expect(await screen.findByText(/crowd 5 of 5/i)).toBeInTheDocument();
    expect(await screen.findByText(/a zoo/i)).toBeInTheDocument();
    expect(await screen.findByText(/shallow coral reef/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/strong currents on bigger swells/i),
    ).toBeInTheDocument();
  });

  it('shows the aliases a wave is actually known by', async () => {
    renderBreak('lances-right');

    expect(await screen.findByRole('heading', { name: 'Lances Right', level: 1 })).toBeInTheDocument();
    expect(await screen.findByText(/also known as/i)).toHaveTextContent(/HT's \/ Hollow Trees/);
  });

  it('breaks the wave into its named sections when it has them', async () => {
    renderBreak('lances-right');

    const sections = await screen.findByRole('region', { name: /section by section/i });
    expect(within(sections).getByRole('heading', { name: 'The Office' })).toBeInTheDocument();
    expect(within(sections).getByRole('heading', { name: 'The Main Peak' })).toBeInTheDocument();
  });

  it('describes the break own twelve-month season, in words as well as marks', async () => {
    renderBreak('chaweng');

    // Chaweng is the counter-season spot: it peaks across the NE monsoon, not mid-year.
    const strip = await screen.findByRole('img', { name: /chaweng beach: twelve-month surf/i });
    expect(strip).toHaveAccessibleName(/peaks Nov-Feb/i);
    expect(await screen.findByText(/Jul: surf 1 out of 10/i)).toBeInTheDocument();
  });

  it('lists the property near the break and links each listing (CAP-4)', async () => {
    renderBreak('uluwatu');

    const nearby = await screen.findByRole('region', { name: /property near uluwatu/i });
    const hrefs = propertyHrefs(nearby);

    expect(hrefs).toHaveLength(4);
    expect(hrefs).toContain('/properties/bali-uluwatu-clifftop-pavilion');

    // The seeded edge itself is shown, so the break-to-property hop states its distance.
    expect(within(nearby).getAllByText(/min (walk|drive|boat) to Uluwatu/i).length).toBe(4);
  });

  it('carries the reverse edge on a second destination too', async () => {
    renderBreak('chaweng');

    const nearby = await screen.findByRole('region', { name: /property near chaweng beach/i });
    const hrefs = propertyHrefs(nearby);

    expect(hrefs).toHaveLength(7);
    expect(hrefs).toContain('/properties/samui-chaweng-hill-villa');
    // Bali listings must not leak into a Ko Samui break.
    expect(hrefs.some((href) => href.startsWith('/properties/bali-'))).toBe(false);
  });

  it('links back to the destination the break belongs to, so nothing dead-ends', async () => {
    renderBreak('uluwatu');

    const header = await screen.findByRole('region', { name: 'Uluwatu' });
    expect(within(header).getByRole('link', { name: 'Bali' })).toHaveAttribute(
      'href',
      '/destinations/bali',
    );
    expect(await screen.findByRole('link', { name: /back to bali/i })).toHaveAttribute(
      'href',
      '/destinations/bali',
    );
  });

  it('handles an unknown break without crashing', async () => {
    renderBreak('bells-beach');

    expect(await screen.findByText(/don.t have a break by that name/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to destinations/i })).toHaveAttribute(
      'href',
      '/',
    );
  });
});
