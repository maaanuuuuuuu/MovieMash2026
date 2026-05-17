import { ComparisonScreen } from '../modules/comparison/ComparisonScreen';
import { useComparisonFlow } from '../modules/comparison/useComparisonFlow';
import { GLOBAL_FILM_SCOPE_ID, filmItemsByFilterId, type FilmFilter } from '../modules/content/filmSource';

type FilteredComparisonRouteProps = {
  filter: FilmFilter;
};

export function FilteredComparisonRoute({ filter }: FilteredComparisonRouteProps) {
  const flow = useComparisonFlow(GLOBAL_FILM_SCOPE_ID, filter.id, filmItemsByFilterId[filter.id]);

  return <ComparisonScreen flow={flow} filter={filter} />;
}
