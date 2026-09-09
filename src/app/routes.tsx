import { Route, Routes } from 'react-router-dom';
import { SiteHeader } from '@/components/SiteHeader';
import { SurferProfilePanel } from '@/features/profile/SurferProfilePanel';
import { DestinationsHome } from '@/features/destinations/DestinationsHome';
import { DestinationPage } from '@/features/destinations/DestinationPage';
import { PropertySearchPage } from '@/features/search/PropertySearchPage';
import { BreakPage } from '@/features/breaks/BreakPage';
import { PropertyDetailPage } from '@/features/properties/PropertyDetailPage';

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
      <SurferProfilePanel />
      <Routes>
        <Route path="/" element={<DestinationsHome />} />
        <Route path="/destinations/:destinationId" element={<DestinationPage />} />
        <Route path="/properties" element={<PropertySearchPage />} />
        <Route path="/properties/:propertyId" element={<PropertyDetailPage />} />
        <Route path="/breaks/:breakId" element={<BreakPage />} />
      </Routes>
    </div>
  );
}
