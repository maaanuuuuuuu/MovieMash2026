import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { filmFilters } from '../modules/content/filmSource';
import { RankingPage } from '../modules/ranking/RankingPage';
import { SavedMoviesPage } from '../modules/ranking/SavedMoviesPage';
import { BranchPreviewSelector } from './BranchPreviewSelector';
import { DevDatabaseTransfer } from './DevDatabaseTransfer';
import { isLocalDevOrigin } from './devDatabaseTransferProtocol';
import { FilteredComparisonRoute } from './FilteredComparisonRoute';

export function AppRoutes() {
  const showDevDatabaseTransfer = import.meta.env.DEV && isLocalDevOrigin(window.location.origin);

  return (
    <HashRouter>
      <Routes>
        {filmFilters.map((filter) => (
          <Route
            key={filter.comparisonPath}
            path={filter.comparisonPath}
            element={<FilteredComparisonRoute filter={filter} />}
          />
        ))}
        {filmFilters.map((filter) => (
          <Route key={filter.rankingPath} path={filter.rankingPath} element={<RankingPage filter={filter} />} />
        ))}
        {filmFilters.map((filter) => (
          <Route key={filter.savedPath} path={filter.savedPath} element={<SavedMoviesPage filter={filter} />} />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BranchPreviewSelector />
      {showDevDatabaseTransfer ? <DevDatabaseTransfer /> : null}
    </HashRouter>
  );
}
