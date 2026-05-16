import { useEffect, useState } from 'react';
import { GLOBAL_FILM_SCOPE_ID, filmItems } from '../modules/content/filmSource';
import { initializeRankingStates } from '../modules/persistence/rankingRepository';
import { AppLoading } from './AppLoading';
import { AppRoutes } from './AppRoutes';
import { useProductionDatabaseImport } from './useProductionDatabaseImport';

const rankingScopes = [{ catalogId: GLOBAL_FILM_SCOPE_ID, items: filmItems }];

export function App() {
  const [ready, setReady] = useState(false);

  useProductionDatabaseImport();

  // Prepare the single global IndexedDB ranking before screens read user state.
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
