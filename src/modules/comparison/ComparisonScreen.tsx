import { useCallback, useState } from 'react';
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
import { FilmFilterSwitch } from '../content/FilmFilterSwitch';
import type { FilmFilter } from '../content/filmSource';
import { SuggestListIdeaButton } from '../listIdeas/SuggestListIdeaButton';

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

  const leftItem = flow.leftItem;
  const rightItem = flow.rightItem;
  const isLoading = !leftItem || !rightItem;

  return (
    <main className={isLoading ? 'comparison-screen comparison-screen--empty' : 'comparison-screen'}>
      <header className="comparison-header">
        <FilmFilterSwitch activeFilter={filter} view="comparison" />
        <p className="eyebrow">{filter.eyebrow}</p>
        <h1>{filter.title}</h1>
        <SuggestListIdeaButton />
      </header>

      {isLoading ? (
        <p className="comparison-screen__loading">Loading the next pair...</p>
      ) : (
        <>
          <header className="comparison-status">
            <span>{flow.comparisonCount} picks</span>
            <span>{flow.activeCount} active</span>
            <span>{flow.totalCount} total</span>
          </header>

          <section className="comparison-stage" aria-label="Choose one item">
            <ItemCard
              item={leftItem}
              previewItem={flow.nextLeftItem}
              side="left"
              onChoose={flow.chooseLeft}
              onNotSeen={flow.markNotSeen}
              onInteractionChange={flow.setIsInteracting}
              onSwipeZoneChange={handleSwipeZoneChange}
            />
            <TieButton onTie={flow.tie} />
            <ItemCard
              item={rightItem}
              previewItem={flow.nextRightItem}
              side="right"
              onChoose={flow.chooseRight}
              onNotSeen={flow.markNotSeen}
              onInteractionChange={flow.setIsInteracting}
              onSwipeZoneChange={handleSwipeZoneChange}
            />
            <MatchSwipeZones state={swipeZoneState} />
          </section>
        </>
      )}

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
