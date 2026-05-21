import { lazy, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { filmFilters } from '../modules/content/filmSource';
import { RankingPage } from '../modules/ranking/RankingPage';
import { SavedMoviesPage } from '../modules/ranking/SavedMoviesPage';
import { BranchPreviewSelector } from './BranchPreviewSelector';
import { FilteredComparisonRoute } from './FilteredComparisonRoute';

const FirebaseAccountButton = lazy(async () => {
  const module = await import('../modules/auth/FirebaseAccountButton');

  return { default: module.FirebaseAccountButton };
});

export function AppRoutes() {
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
      <Suspense fallback={null}>
        <FirebaseAccountButton />
      </Suspense>
      <BranchPreviewSelector />
    </HashRouter>
  );
}
