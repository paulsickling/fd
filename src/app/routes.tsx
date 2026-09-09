import { Route, Routes } from 'react-router-dom';
import { HomePlaceholder } from './HomePlaceholder';

/**
 * Route table. Destination comes before property in the hierarchy — that ordering is
 * the premise of the product (SPEC.md CAP-1), so it is expressed in the URL shape:
 *   /                      discovery
 *   /destinations/:id      destination page      (story 5)
 *   /properties/:id        listing detail        (story 7)
 *   /breaks/:id            surf break            (story 8)
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePlaceholder />} />
    </Routes>
  );
}
