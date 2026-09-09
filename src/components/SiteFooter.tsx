import { Link } from 'react-router-dom';

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-sand-200">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-sm text-ink-700">
          Salt &amp; Longitude — a demonstration. Listings are illustrative and modelled on
          real market research; they are not offers for sale.
        </p>
        <nav aria-label="Footer" className="mt-4">
          <ul className="flex flex-wrap gap-6 text-sm">
            <li>
              <Link to="/" className="text-ink-700 hover:text-ocean-700">
                Destinations
              </Link>
            </li>
            <li>
              <Link to="/properties" className="text-ink-700 hover:text-ocean-700">
                Properties
              </Link>
            </li>
            <li>
              <Link to="/credits" className="text-ink-700 hover:text-ocean-700">
                Photography credits
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
