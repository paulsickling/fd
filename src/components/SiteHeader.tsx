import { Link, NavLink } from 'react-router-dom';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'text-sm transition-colors',
    isActive ? 'text-ink-900' : 'text-ink-700 hover:text-ocean-700',
  ].join(' ');

export function SiteHeader() {
  return (
    <header className="border-b border-sand-200">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link
          to="/"
          className="text-sm uppercase tracking-[0.22em] text-ink-900 hover:text-ocean-700"
        >
          Salt &amp; Longitude
        </Link>
        <nav aria-label="Main">
          <ul className="flex items-center gap-6">
            <li>
              <NavLink to="/" end className={navLinkClass}>
                Destinations
              </NavLink>
            </li>
            <li>
              <NavLink to="/properties" className={navLinkClass}>
                Properties
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
