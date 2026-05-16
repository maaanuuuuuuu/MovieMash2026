import { useEffect, useState } from 'react';
import { filmCatalogs, filmItemsByCatalogId } from '../modules/content/filmSource';
import { initializeRankingStates } from '../modules/persistence/rankingRepository';
import { AppLoading } from './AppLoading';
import { AppRoutes } from './AppRoutes';
import { useProductionDatabaseImport } from './useProductionDatabaseImport';

const rankingScopes = filmCatalogs.map((catalog) => ({
  catalogId: catalog.id,
  items: filmItemsByCatalogId[catalog.id],
}));

export function App() {
  const [ready, setReady] = useState(false);

  useProductionDatabaseImport();

  // Prepare IndexedDB from every frozen catalog before screens read user state.
  useEffect(() => {
    let mounted = true;

    void initializeRankingStates(rankingScopes).then(() => {
      if (mounted) {
        setReady(true);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) {
    return <AppLoading />;
  }

  return <AppRoutes />;
}
