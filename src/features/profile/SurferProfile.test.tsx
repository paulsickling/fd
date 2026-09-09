import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeEach } from 'vitest';
import { App } from '@/app/App';
import { parseProfile } from './surferProfileStore';

beforeEach(() => {
  window.localStorage.clear();
  // <App /> uses BrowserRouter and jsdom shares one history per file, so URL state would
  // otherwise leak from any test that navigates into the next one.
  window.history.pushState({}, '', '/');
});

/** Waits for the destination cards themselves, not just the section heading. */
const destinationOrder = async () => {
  const list = await screen.findByRole('heading', { name: /three destinations|ranked for how/i });
  const section = list.closest('section')!;
  const headings = await within(section).findAllByRole('heading', { level: 3 });
  return headings.map((heading) => heading.textContent);
};

async function setAbility(user: ReturnType<typeof userEvent.setup>, label: RegExp) {
  await user.click(screen.getByRole('button', { name: /set your surfing|edit your surfing/i }));
  await user.click(screen.getByRole('radio', { name: label }));
}

describe('surfer profile', () => {
  it('is opt-in: the site works fully with no profile set', async () => {
    render(<App />);

    expect(await screen.findByRole('heading', { name: /three destinations/i })).toBeInTheDocument();
    expect(screen.queryByText(/% match/)).not.toBeInTheDocument();
    // No dialog, no gate — the invitation is a button the viewer may ignore.
    expect(screen.getByRole('button', { name: /set your surfing/i })).toBeInTheDocument();
  });

  it('shows a match score with a reason once a profile is set', async () => {
    const user = userEvent.setup();
    render(<App />);
    await destinationOrder();

    await setAbility(user, /beginner/i);

    const badge = await screen.findAllByText(/% match/);
    expect(badge.length).toBeGreaterThan(0);
    // CAP-6: a bare number is not enough — the ranking has to explain itself.
    expect(badge[0]!.parentElement?.textContent).toMatch(/·/);
  });

  it('ranks the identical dataset differently for a beginner and an expert', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await destinationOrder();

    await setAbility(user, /beginner/i);
    await waitFor(async () => expect((await destinationOrder()).length).toBe(3));
    const beginnerOrder = await destinationOrder();

    unmount();
    window.localStorage.clear();

    render(<App />);
    await destinationOrder();
    await setAbility(user, /expert/i);
    await waitFor(async () => expect((await destinationOrder()).length).toBe(3));
    const expertOrder = await destinationOrder();

    expect(beginnerOrder).not.toEqual(expertOrder);
  });

  it('survives a reload by persisting to localStorage', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await destinationOrder();

    await setAbility(user, /expert/i);
    await screen.findAllByText(/% match/);

    unmount();
    render(<App />);

    // Remounting is the test's stand-in for a reload: the profile comes back from storage.
    expect(await screen.findByRole('heading', { name: /ranked for how you surf/i })).toBeVisible();
  });

  it('can be cleared, returning to the unranked view', async () => {
    const user = userEvent.setup();
    render(<App />);
    await destinationOrder();

    await setAbility(user, /expert/i);
    await screen.findAllByText(/% match/);

    await user.click(screen.getByRole('button', { name: /^clear$/i }));

    await waitFor(() => expect(screen.queryByText(/% match/)).not.toBeInTheDocument());
    expect(screen.getByRole('heading', { name: /three destinations/i })).toBeInTheDocument();
  });
});

describe('parseProfile', () => {
  it('rejects a stored blob that is not a profile', () => {
    expect(parseProfile(null)).toBeNull();
    expect(parseProfile('nonsense')).toBeNull();
    expect(parseProfile({})).toBeNull();
    expect(parseProfile({ ability: 'godlike' })).toBeNull();
  });

  it('keeps a valid profile and drops junk inside it', () => {
    const parsed = parseProfile({
      ability: 'advanced',
      boards: ['shortboard', 'jetski'],
      crowdTolerance: 99,
      preferredDirection: 'sideways',
      travelMonths: [7, 45, 'August'],
    });

    expect(parsed).toEqual({
      ability: 'advanced',
      boards: ['shortboard'],
      crowdTolerance: 3,
      preferredDirection: 'no-preference',
      travelMonths: [7],
    });
  });
});
