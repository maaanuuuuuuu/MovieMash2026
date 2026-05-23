import { ArrowLeft, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../comparison/ComparisonScreen.css';
import { ConfirmationBurst } from '../comparison/ConfirmationBurst';
import { FloatingRankingButton } from '../comparison/FloatingRankingButton';
import { useIdleVisibility } from '../comparison/useIdleVisibility';
import { CompetitionItemCard } from '../competition/CompetitionItemCard';
import { allFilmFilter } from '../content/filmSource';
import { FilmFilterSwitch } from '../content/FilmFilterSwitch';
import { TournamentRoundBadge } from './TournamentRoundBadge';
import { TournamentSummary } from './TournamentSummary';
import './TournamentPage.css';
import { useTournamentFlow } from './useTournamentFlow';

export function TournamentPage() {
  const flow = useTournamentFlow();
  const rankingButtonVisible = useIdleVisibility(flow.isInteracting, flow.feedback?.id);

  if (flow.isLoading) {
    return (
      <main className="comparison-screen comparison-screen--empty tournament-page">
        <header className="comparison-header">
          <FilmFilterSwitch activeFilter={allFilmFilter} view="tournament" />
          <p className="eyebrow">Tournament mode</p>
          <h1>Bracket in progress</h1>
        </header>
        <p className="comparison-screen__loading">Building the current top 16 bracket...</p>
      </main>
    );
  }

  if (!flow.bracket) {
    return (
      <main className="comparison-screen comparison-screen--empty tournament-page">
        <header className="comparison-header">
          <FilmFilterSwitch activeFilter={allFilmFilter} view="tournament" />
          <p className="eyebrow">Tournament mode</p>
          <h1>Tournament unavailable</h1>
        </header>
        <section className="tournament-empty-state">
          <p>You need at least 16 active movies in All before starting a tournament.</p>
          <Link to="/" className="tournament-page__back-link">
            <ArrowLeft aria-hidden="true" size={18} />
            Back to all matches
          </Link>
        </section>
      </main>
    );
  }

  if (flow.bracket.completedAt) {
    return (
      <main className="comparison-screen tournament-page">
        <header className="comparison-header">
          <FilmFilterSwitch activeFilter={allFilmFilter} view="tournament" />
          <p className="eyebrow">Tournament mode</p>
          <h1>Bracket finished</h1>
        </header>
        <TournamentSummary podium={flow.podium} onRestart={() => void flow.startNewTournament()} />
        <FloatingRankingButton visible={rankingButtonVisible} to={allFilmFilter.rankingPath} />
      </main>
    );
  }

  if (!flow.leftItem || !flow.rightItem) {
    return null;
  }

  return (
    <main className="comparison-screen tournament-page">
      <header className="comparison-header">
        <FilmFilterSwitch activeFilter={allFilmFilter} view="tournament" />
        <p className="eyebrow">Tournament mode</p>
        <h1>Bracket in progress</h1>
        <p className="tournament-page__hint">Frozen top 16 from All. Every match is one real Elo duel.</p>
      </header>

      <section className="tournament-page__hero">
        <TournamentRoundBadge round={flow.activeRound} />
        <div className="tournament-page__spark">
          <Sparkles aria-hidden="true" size={18} />
          No tie. No not seen. Pick the winner.
        </div>
      </section>

      <header className="comparison-status competition-page__status tournament-page__status">
        <span>{flow.playedCount} played</span>
        <span>{flow.pendingCount} left in bracket</span>
        <span>Top 16 locked</span>
      </header>

      <section className="comparison-stage" aria-label="Choose one item">
        <div className="tournament-page__lane">
          <span className="tournament-page__seed">Seed #{flow.leftSeed?.seed ?? '-'}</span>
          <CompetitionItemCard
            item={flow.leftItem}
            previewItem={flow.nextLeftItem}
            side="left"
            onChoose={flow.chooseLeft}
            onInteractionChange={flow.setIsInteracting}
          />
        </div>
        <div className="tournament-page__versus" aria-hidden="true">
          VS
        </div>
        <div className="tournament-page__lane">
          <span className="tournament-page__seed">Seed #{flow.rightSeed?.seed ?? '-'}</span>
          <CompetitionItemCard
            item={flow.rightItem}
            previewItem={flow.nextRightItem}
            side="right"
            onChoose={flow.chooseRight}
            onInteractionChange={flow.setIsInteracting}
          />
        </div>
      </section>

      <ConfirmationBurst feedback={flow.feedback} />
      <FloatingRankingButton visible={rankingButtonVisible} to={allFilmFilter.rankingPath} />
    </main>
  );
}
