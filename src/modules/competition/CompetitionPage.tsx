import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../comparison/ComparisonScreen.css';
import { ConfirmationBurst } from '../comparison/ConfirmationBurst';
import { FloatingRankingButton } from '../comparison/FloatingRankingButton';
import { TieButton } from '../comparison/TieButton';
import { useIdleVisibility } from '../comparison/useIdleVisibility';
import { allFilmFilter } from '../content/filmSource';
import { FilmFilterSwitch } from '../content/FilmFilterSwitch';
import './CompetitionPage.css';
import { CompetitionItemCard } from './CompetitionItemCard';
import { CompetitionSummary } from './CompetitionSummary';
import { useCompetitionFlow } from './useCompetitionFlow';

export function CompetitionPage() {
  const flow = useCompetitionFlow();
  const rankingButtonVisible = useIdleVisibility(flow.isInteracting, flow.feedback?.id);

  if (flow.isLoading) {
    return (
      <main className="comparison-screen comparison-screen--empty competition-page">
        <header className="comparison-header">
          <FilmFilterSwitch activeFilter={allFilmFilter} view="competition" />
          <p className="eyebrow">Competition mode</p>
          <h1>League in progress</h1>
        </header>
        <p className="comparison-screen__loading">Building the current top 20 league...</p>
      </main>
    );
  }

  if (!flow.league) {
    return (
      <main className="comparison-screen comparison-screen--empty competition-page">
        <header className="comparison-header">
          <FilmFilterSwitch activeFilter={allFilmFilter} view="competition" />
          <p className="eyebrow">Competition mode</p>
          <h1>League unavailable</h1>
        </header>
        <section className="competition-empty-state">
          <p>You need at least 20 active movies in All before starting a league.</p>
          <Link to="/" className="competition-page__back-link">
            <ArrowLeft aria-hidden="true" size={18} />
            Back to all matches
          </Link>
        </section>
      </main>
    );
  }

  if (flow.league.completedAt) {
    return (
      <main className="comparison-screen competition-page">
        <header className="comparison-header">
          <FilmFilterSwitch activeFilter={allFilmFilter} view="competition" />
          <p className="eyebrow">Competition mode</p>
          <h1>League finished</h1>
        </header>
        <CompetitionSummary topThree={flow.topThree.slice(0, 3)} onStartNewLeague={() => void flow.startNewLeague()} />
        <FloatingRankingButton visible={rankingButtonVisible} to={allFilmFilter.rankingPath} />
      </main>
    );
  }

  if (!flow.leftItem || !flow.rightItem) {
    return null;
  }

  return (
    <main className="comparison-screen competition-page">
      <header className="comparison-header">
        <FilmFilterSwitch activeFilter={allFilmFilter} view="competition" />
        <p className="eyebrow">Competition mode</p>
        <h1>League in progress</h1>
        <p className="competition-page__hint">Frozen top 20 from All. Each pair plays once.</p>
      </header>

      <header className="comparison-status competition-page__status">
        <span>{flow.completedMatchCount} done</span>
        <span>{flow.league.remainingMatchups.length} left</span>
        <span>{flow.league.totalMatchups} total</span>
      </header>

      <section className="comparison-stage" aria-label="Choose one item">
        <CompetitionItemCard
          item={flow.leftItem}
          previewItem={flow.nextLeftItem}
          side="left"
          onChoose={flow.chooseLeft}
          onInteractionChange={flow.setIsInteracting}
        />
        <TieButton onTie={flow.tie} />
        <CompetitionItemCard
          item={flow.rightItem}
          previewItem={flow.nextRightItem}
          side="right"
          onChoose={flow.chooseRight}
          onInteractionChange={flow.setIsInteracting}
        />
      </section>

      <ConfirmationBurst feedback={flow.feedback} />
      <FloatingRankingButton visible={rankingButtonVisible} to={allFilmFilter.rankingPath} />
    </main>
  );
}
