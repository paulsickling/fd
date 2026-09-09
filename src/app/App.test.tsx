import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App shell', () => {
  it('opens on the destination surface, not on a property search', async () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: /property, chosen by the water/i }),
    ).toBeInTheDocument();

    // CAP-1: destinations are the entry point, so all three must be reachable from here.
    const list = await screen.findByRole('heading', { name: /three destinations/i });
    expect(list).toBeInTheDocument();

    for (const name of ['Bali', 'Ko Samui', 'Mentawai']) {
      expect(await screen.findByRole('heading', { name: new RegExp(name, 'i') })).toBeVisible();
    }
  });

  it('links each destination to its own page', async () => {
    render(<App />);

    const bali = await screen.findByRole('link', { name: /bali/i });
    expect(bali).toHaveAttribute('href', '/destinations/bali');
  });

  it('offers navigation to properties without making it the entry point', () => {
    render(<App />);

    const nav = screen.getByRole('navigation', { name: /main/i });
    expect(within(nav).getByRole('link', { name: /properties/i })).toHaveAttribute(
      'href',
      '/properties',
    );
  });
});
