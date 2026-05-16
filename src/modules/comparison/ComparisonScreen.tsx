import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import './ComparisonScreen.css';
import { ConfirmationBurst } from './ConfirmationBurst';
import { CelebrationToast } from './CelebrationToast';
import { FloatingRankingButton } from './FloatingRankingButton';
import { ItemCard } from './ItemCard';
import { MatchSwipeZones, type MatchSwipeZoneState } from './MatchSwipeZones';
import { TieButton } from './TieButton';
import { UndoActionButton } from './UndoActionButton';
import type { ComparisonFlow } from './useComparisonFlow';
import { useIdleVisibility } from './useIdleVisibility';
import { filmFilters, type FilmFilter } from '../content/filmSource';

type ComparisonScreenProps = {
  flow: ComparisonFlow;
  filter: FilmFilter;
};

export function ComparisonScreen({ flow, filter }: ComparisonScreenProps) {
  const rankingButtonVisible = useIdleVisibility(flow.isInteracting, flow.feedback?.id);
  const [swipeZoneState, setSwipeZoneState] = useState<MatchSwipeZoneState | undefined>();
  const undoAction =
    flow.pendingNotSeen !== undefined
      ? { ariaLabel: 'Undo last swipe', onUndo: flow.undoNotSeen }
      : { ariaLabel: 'Undo last vote', onUndo: flow.undoLastVote };
  const handleSwipeZoneChange = useCallback((state: MatchSwipeZoneState | undefined) => {
    setSwipeZoneState(state);
  }, []);

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
        <nav className="catalog-switch" aria-label="Genre filter">
          {filmFilters.map((availableFilter) => (
            <Link
              key={availableFilter.id}
              to={availableFilter.comparisonPath}
              className={
                availableFilter.id === filter.id
                  ? 'catalog-switch__link catalog-switch__link--active'
                  : 'catalog-switch__link'
              }
            >
              {availableFilter.shortLabel}
            </Link>
          ))}
        </nav>
        <p className="eyebrow">{filter.eyebrow}</p>
        <h1>{filter.title}</h1>
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
          onSwipeZoneChange={handleSwipeZoneChange}
        />
        <TieButton onTie={flow.tie} />
        <ItemCard
          item={flow.rightItem}
          previewItem={flow.nextRightItem}
          side="right"
          onChoose={flow.chooseRight}
          onNotSeen={flow.markNotSeen}
          onInteractionChange={flow.setIsInteracting}
          onSwipeZoneChange={handleSwipeZoneChange}
        />
        <MatchSwipeZones state={swipeZoneState} />
      </section>

      <ConfirmationBurst feedback={flow.feedback} />
      <CelebrationToast
        milestone={flow.celebrationMilestone}
        to={filter.rankingPath}
        onClose={() => flow.setCelebrationMilestone(undefined)}
      />
      <UndoActionButton
        visible={flow.pendingNotSeen !== undefined || flow.undoableVote !== undefined}
        ariaLabel={undoAction.ariaLabel}
        onUndo={undoAction.onUndo}
      />
      <FloatingRankingButton visible={rankingButtonVisible} to={filter.rankingPath} />
    </main>
  );
}
