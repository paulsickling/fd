import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App shell', () => {
  it('renders the home route through the router and query providers', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: /property, chosen by the water/i }),
    ).toBeInTheDocument();
  });
});
