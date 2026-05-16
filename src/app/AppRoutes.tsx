import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ComparisonScreen } from '../modules/comparison/ComparisonScreen';
import { useComparisonFlow } from '../modules/comparison/useComparisonFlow';
import { filmCatalogs, filmItemsByCatalogId } from '../modules/content/filmSource';
import { RankingPage } from '../modules/ranking/RankingPage';
import { BranchPreviewSelector } from './BranchPreviewSelector';
import { DevDatabaseTransfer } from './DevDatabaseTransfer';
import { isLocalDevOrigin } from './devDatabaseTransferProtocol';

export function AppRoutes() {
  const flows = {
    default: useComparisonFlow('default', filmItemsByCatalogId.default),
    action: useComparisonFlow('action', filmItemsByCatalogId.action),
    comedy: useComparisonFlow('comedy', filmItemsByCatalogId.comedy),
  };
  const showDevDatabaseTransfer = import.meta.env.DEV && isLocalDevOrigin(window.location.origin);

  return (
    <HashRouter>
      <Routes>
        {filmCatalogs.map((catalog) => (
          <Route
            key={catalog.comparisonPath}
            path={catalog.comparisonPath}
            element={<ComparisonScreen flow={flows[catalog.id]} catalog={catalog} />}
          />
        ))}
        {filmCatalogs.map((catalog) => (
          <Route key={catalog.rankingPath} path={catalog.rankingPath} element={<RankingPage catalog={catalog} />} />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BranchPreviewSelector />
      {showDevDatabaseTransfer ? <DevDatabaseTransfer /> : null}
    </HashRouter>
  );
}
