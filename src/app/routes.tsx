import { Link, Route, Routes } from 'react-router-dom';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { SurferProfilePanel } from '@/features/profile/SurferProfilePanel';
import { DestinationsHome } from '@/features/destinations/DestinationsHome';
import { DestinationPage } from '@/features/destinations/DestinationPage';
import { PropertySearchPage } from '@/features/search/PropertySearchPage';
import { PropertyDetailPage } from '@/features/properties/PropertyDetailPage';
import { BreakPage } from '@/features/breaks/BreakPage';
import { CreditsPage } from '@/features/credits/CreditsPage';

/**
 * Route table. Destination comes before property in the hierarchy — that ordering is the
 * premise of the product (SPEC.md CAP-1), so it is expressed in the URL shape:
 *   /                      discovery
 *   /destinations/:id      destination page
 *   /properties            search
 *   /properties/:id        listing detail
 *   /breaks/:id            surf break
 *   /credits               photography attribution
 */
export function AppRoutes() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Keyboard users should not have to tab the whole header on every page. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-ink-900 focus:px-4 focus:py-2 focus:text-sand-50"
      >
        Skip to content
      </a>
      <SiteHeader />
      <SurferProfilePanel />
      <div id="main" className="flex-1">
        <Routes>
          <Route path="/" element={<DestinationsHome />} />
          <Route path="/destinations/:destinationId" element={<DestinationPage />} />
          <Route path="/properties" element={<PropertySearchPage />} />
          <Route path="/properties/:propertyId" element={<PropertyDetailPage />} />
          <Route path="/breaks/:breakId" element={<BreakPage />} />
          <Route path="/credits" element={<CreditsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <SiteFooter />
    </div>
  );
}

function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-3xl font-light tracking-tight text-ink-900">
        There&rsquo;s nothing at this address.
      </h1>
      <p className="mt-4 text-ink-700">
        The page you were after has moved or never existed.{' '}
        <Link to="/" className="text-ocean-700 underline underline-offset-2">
          Start from the destinations
        </Link>
        .
      </p>
    </main>
  );
}
