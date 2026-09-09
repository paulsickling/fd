import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';

/**
 * The headline demo path (SPEC.md, "Success signal").
 *
 * The client demonstration is one continuous walk: someone states only "intermediate
 * surfer, left-hand reef, want it working in July, budget under USD 1.5M", sees Bali
 * ranked above Ko Samui with the reason shown, opens a Bingin property, reads its nearby
 * breaks and the seasonality overlay, and understands from the tenure note what they would
 * actually be buying. Every other suite here proves one screen in isolation; this one
 * proves the screens join up, because a demo that dead-ends is a demo that fails.
 *
 * <App /> already supplies the providers and a BrowserRouter, so navigation is driven the
 * way the client will drive it: by clicking links, never by setting a URL.
 */

beforeEach(() => {
  // The profile is persisted, and BrowserRouter reads a jsdom history shared by the whole
  // file — both have to be returned to a cold visitor's state between walks.
  window.localStorage.clear();
  window.history.pushState({}, '', '/');
});

/** The demo brief, stated as the panel lets a viewer state it. */
async function stateTheBrief(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /set your surfing/i }));
  await user.click(screen.getByRole('radio', { name: /intermediate/i }));
  await user.selectOptions(screen.getByLabelText(/preferred direction/i), 'left');
  await user.click(screen.getByRole('button', { name: 'Jul' }));
  await user.click(screen.getByRole('button', { name: /^done$/i }));
}

interface DestinationCard {
  readonly name: string;
  /** null until a profile is set — the score is opt-in, like the profile itself. */
  readonly score: number | null;
  readonly reason: string;
}

/**
 * The destination cards as a viewer reads them: in displayed order, each with whatever
 * score and reason it is showing. Waits for the cards themselves — the section heading
 * renders while the data is still loading.
 */
async function destinationCards(region: HTMLElement): Promise<DestinationCard[]> {
  const items = await within(region).findAllByRole('listitem');
  return items.map((item) => {
    const text = item.textContent ?? '';
    const match = /(\d+)% match(?: · (.+))?$/.exec(text);
    return {
      name: within(item).getByRole('heading', { level: 3 }).textContent ?? '',
      score: match?.[1] ? Number(match[1]) : null,
      reason: match?.[2] ?? '',
    };
  });
}

describe('the client demo path', () => {
  it('opens on destination discovery rather than a postcode search', async () => {
    render(<App />);

    const discovery = await screen.findByRole('region', { name: /three destinations/i });
    const cards = await destinationCards(discovery);
    expect(cards.map((card) => card.name)).toEqual(['Bali', 'Ko Samui', 'Mentawai Islands']);
    // CAP-6 is opt-in: with no profile stated, nothing is scored or re-ordered.
    expect(cards.every((card) => card.score === null)).toBe(true);

    // The premise of the product: there is nothing to type on arrival. No postcode box,
    // no search field — the first choice offered is an island.
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('searchbox')).toBeNull();
    expect(within(discovery).getByRole('link', { name: /bali/i })).toHaveAttribute(
      'href',
      '/destinations/bali',
    );
  });

  it('re-ranks the destinations against the stated brief, each with a reason', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('region', { name: /three destinations/i });

    await stateTheBrief(user);

    const ranked = await screen.findByRole('region', { name: /ranked for how you surf/i });
    await within(ranked).findAllByText(/% match/);
    const cards = await destinationCards(ranked);
    expect(cards).toHaveLength(3);

    // CAP-6: a bare number cannot carry a demo. Every card states a score and, next to it,
    // the plain-English reason it scored that way.
    for (const card of cards) {
      expect(card.score).toBeGreaterThan(0);
      expect(card.reason).toMatch(/[a-z]{4}/i);
    }

    // Really ranked, not merely annotated: the cards come back best-fit first.
    const scores = cards.map((card) => card.score as number);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));

    // The success signal names this comparison specifically: an intermediate wanting lefts
    // in July belongs in Bali, not on the Gulf coast of Thailand — and the gap is in the
    // score, not just in the order the seed happened to ship in.
    const bali = cards.find((card) => card.name === 'Bali');
    const koSamui = cards.find((card) => card.name === 'Ko Samui');
    expect(bali?.score).toBeGreaterThan(koSamui?.score ?? 0);
  });

  it('walks brief → destination → property → break → property with no dead end', async () => {
    const user = userEvent.setup();
    render(<App />);

    // 1. Land on discovery. Destinations first, no postcode anywhere.
    const discovery = await screen.findByRole('region', { name: /three destinations/i });
    expect(await destinationCards(discovery)).toHaveLength(3);
    expect(screen.queryByRole('textbox')).toBeNull();

    // 2. State the brief; the same seed re-ranks and explains itself.
    await stateTheBrief(user);
    const ranked = await screen.findByRole('region', { name: /ranked for how you surf/i });
    await within(ranked).findAllByText(/% match/);
    const scored = await destinationCards(ranked);
    const bali = scored.find((card) => card.name === 'Bali');
    expect(bali?.score).toBeGreaterThan(scored.find((c) => c.name === 'Ko Samui')?.score ?? 0);
    expect(bali?.reason).toMatch(/[a-z]{4}/i);
    // The panel keeps saying what it is ranking for, so the client never loses the thread.
    expect(screen.getByRole('heading', { name: /ranking for/i })).toHaveTextContent(
      /intermediate surfer, travelling Jul/i,
    );

    // 3. Into the destination: its own breaks, and the twelve-month overlay.
    await user.click(within(ranked).getByRole('link', { name: /bali/i }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Bali' })).toBeVisible();
    expect(window.location.pathname).toBe('/destinations/bali');

    const destinationSurf = await screen.findByRole('region', { name: /^the surf$/i });
    expect(within(destinationSurf).getAllByRole('link').length).toBeGreaterThanOrEqual(3);
    expect(within(destinationSurf).getByRole('link', { name: /bingin/i })).toHaveAttribute(
      'href',
      '/breaks/bingin',
    );

    const season = await screen.findByRole('region', { name: /when to be here/i });
    expect(within(season).getByText(/the year in the water/i)).toBeInTheDocument();
    // CAP-5: one graphic carrying all three tracks, readable without seeing the marks.
    expect(
      within(season).getByRole('img', { name: /twelve-month surf, weather and crowd overlay/i }),
    ).toBeInTheDocument();

    // The destination already answers the ownership question for the country.
    expect(
      await screen.findByRole('region', { name: /what a foreign buyer can own in indonesia/i }),
    ).toBeInTheDocument();

    // 4. Into a listing that fits the stated budget of USD 1.5M.
    const grid = await screen.findByRole('region', { name: /property in bali/i });
    await user.click(within(grid).getByRole('link', { name: /garden villa, bingin/i }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Garden Villa, Bingin' }),
    ).toBeVisible();
    expect(window.location.pathname).toBe('/properties/bali-bingin-garden-villa');
    expect(screen.getByText('USD 1,200,000')).toBeInTheDocument();

    // CAP-3: the surf arrives as structured, attached facts — every break with its own
    // surveyed travel time, not a sentence in the blurb.
    const doorstep = await screen.findByRole('region', { name: /the surf from this door/i });
    const nearbyBreaks = within(doorstep).getAllByRole('link');
    expect(nearbyBreaks).toHaveLength(2);
    for (const row of nearbyBreaks) {
      expect(row.textContent).toMatch(/\d+ min (walk|drive)/);
    }

    // 6. The expat deal-breaker, on the listing itself: what you would actually own, and
    // the risk stated at full weight rather than in small print.
    const tenure = await screen.findByRole('region', {
      name: /what you would own in indonesia/i,
    });
    expect(within(tenure).getByRole('heading', { name: /hak pakai/i })).toBeInTheDocument();
    expect(tenure).toHaveTextContent(/immigration status/i);

    // 5. Property → break. The break is a record of its own, not listing decoration.
    await user.click(within(doorstep).getByRole('link', { name: /bingin/i }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Bingin' })).toBeVisible();
    expect(window.location.pathname).toBe('/breaks/bingin');
    expect(screen.getByText(/left-hand reef/i)).toBeInTheDocument();

    // …and break → property, the reverse edge. This is the half a surf guide never has,
    // and the assertion that makes the dataset a graph rather than a decoration.
    const nearbyProperty = await screen.findByRole('region', { name: /property near bingin/i });
    await user.click(within(nearbyProperty).getByRole('link', { name: /cliff house, bingin/i }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Cliff House, Bingin' }),
    ).toBeVisible();
    expect(window.location.pathname).toBe('/properties/bali-bingin-cliff-house');

    // The walk could continue indefinitely: this listing offers the same edges back out.
    const secondDoorstep = await screen.findByRole('region', {
      name: /the surf from this door/i,
    });
    expect(within(secondDoorstep).getByRole('link', { name: /bingin/i })).toHaveAttribute(
      'href',
      '/breaks/bingin',
    );
    expect(
      await screen.findByRole('region', { name: /what you would own in indonesia/i }),
    ).toBeInTheDocument();
  }, 30_000);
});
