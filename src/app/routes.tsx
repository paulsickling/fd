import { Route, Routes } from 'react-router-dom';
import { SiteHeader } from '@/components/SiteHeader';
import { DestinationsHome } from '@/features/destinations/DestinationsHome';
import { DestinationPage } from '@/features/destinations/DestinationPage';
import { PropertySearchPage } from '@/features/search/PropertySearchPage';

/**
 * Route table. Destination comes before property in the hierarchy — that ordering is the
 * premise of the product (SPEC.md CAP-1), so it is expressed in the URL shape:
 *   /                      discovery
 *   /destinations/:id      destination page
 *   /properties            search              (story 6)
 *   /properties/:id        listing detail      (story 7)
 *   /breaks/:id            surf break          (story 8)
 */
export function AppRoutes() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Routes>
        <Route path="/" element={<DestinationsHome />} />
        <Route path="/destinations/:destinationId" element={<DestinationPage />} />
        <Route path="/properties" element={<PropertySearchPage />} />
      </Routes>
    </div>
  );
}
