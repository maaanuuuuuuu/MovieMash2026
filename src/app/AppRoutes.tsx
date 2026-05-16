import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ComparisonScreen } from '../modules/comparison/ComparisonScreen';
import { useComparisonFlow } from '../modules/comparison/useComparisonFlow';
import { GLOBAL_FILM_SCOPE_ID, filmFilters, filmItemsByFilterId } from '../modules/content/filmSource';
import { RankingPage } from '../modules/ranking/RankingPage';
import { SavedMoviesPage } from '../modules/ranking/SavedMoviesPage';
import { BranchPreviewSelector } from './BranchPreviewSelector';
import { DevDatabaseTransfer } from './DevDatabaseTransfer';
import { isLocalDevOrigin } from './devDatabaseTransferProtocol';

export function AppRoutes() {
  const flows = {
    all: useComparisonFlow(GLOBAL_FILM_SCOPE_ID, 'all', filmItemsByFilterId.all),
    action: useComparisonFlow(GLOBAL_FILM_SCOPE_ID, 'action', filmItemsByFilterId.action),
    comedy: useComparisonFlow(GLOBAL_FILM_SCOPE_ID, 'comedy', filmItemsByFilterId.comedy),
  };
  const showDevDatabaseTransfer = import.meta.env.DEV && isLocalDevOrigin(window.location.origin);

  return (
    <HashRouter>
      <Routes>
        {filmFilters.map((filter) => (
          <Route
            key={filter.comparisonPath}
            path={filter.comparisonPath}
            element={<ComparisonScreen flow={flows[filter.id]} filter={filter} />}
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
