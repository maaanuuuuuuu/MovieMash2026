import { Link } from 'react-router-dom';
import { ConfirmationBurst } from './ConfirmationBurst';
import { CelebrationToast } from './CelebrationToast';
import { FloatingRankingButton } from './FloatingRankingButton';
import { ItemCard } from './ItemCard';
import { TieButton } from './TieButton';
import type { ComparisonFlow } from './useComparisonFlow';
import { useIdleVisibility } from './useIdleVisibility';
import { filmCatalogs, type FilmCatalog } from '../content/filmSource';

type ComparisonScreenProps = {
  flow: ComparisonFlow;
  catalog: FilmCatalog;
};

export function ComparisonScreen({ flow, catalog }: ComparisonScreenProps) {
  const rankingButtonVisible = useIdleVisibility(flow.isInteracting, flow.feedback?.id);

  if (!flow.leftItem || !flow.rightItem) {
    return (
      <main className="comparison-screen comparison-screen--empty">
        <p>Loading the next pair...</p>
      </main>
    );
  }

  return (
    <main className="comparison-screen">
      <header className="comparison-header">
        <nav className="catalog-switch" aria-label="Movie list selector">
          {filmCatalogs.map((availableCatalog) => (
            <Link
              key={availableCatalog.id}
              to={availableCatalog.comparisonPath}
              className={
                availableCatalog.id === catalog.id
                  ? 'catalog-switch__link catalog-switch__link--active'
                  : 'catalog-switch__link'
              }
            >
              {availableCatalog.shortLabel}
            </Link>
          ))}
        </nav>
        <p className="eyebrow">{catalog.eyebrow}</p>
        <h1>{catalog.title}</h1>
      </header>

      <header className="comparison-status">
        <span>{flow.comparisonCount} picks</span>
        <span>{flow.activeCount} active</span>
        <span>{flow.totalCount} total</span>
      </header>

      <section className="comparison-stage" aria-label="Choose one item">
        <ItemCard
          item={flow.leftItem}
          previewItem={flow.nextLeftItem}
          side="left"
          onChoose={flow.chooseLeft}
          onNotSeen={flow.markNotSeen}
          onInteractionChange={flow.setIsInteracting}
        />
        <TieButton onTie={flow.tie} />
        <ItemCard
          item={flow.rightItem}
          previewItem={flow.nextRightItem}
          side="right"
          onChoose={flow.chooseRight}
          onNotSeen={flow.markNotSeen}
          onInteractionChange={flow.setIsInteracting}
        />
      </section>

      <ConfirmationBurst feedback={flow.feedback} />
      <CelebrationToast visible={flow.celebrationVisible} onClose={() => flow.setCelebrationVisible(false)} />
      <FloatingRankingButton visible={rankingButtonVisible} to={catalog.rankingPath} />
    </main>
  );
}
