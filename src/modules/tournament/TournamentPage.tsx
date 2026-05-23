import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../comparison/ComparisonScreen.css';
import { ConfirmationBurst } from '../comparison/ConfirmationBurst';
import { FloatingRankingButton } from '../comparison/FloatingRankingButton';
import { useIdleVisibility } from '../comparison/useIdleVisibility';
import { CompetitionItemCard } from '../competition/CompetitionItemCard';
import { allFilmFilter } from '../content/filmSource';
import { FilmFilterSwitch } from '../content/FilmFilterSwitch';
import './TournamentPage.css';
import { TournamentSummary } from './TournamentSummary';
import { useTournamentFlow } from './useTournamentFlow';

const TOURNAMENT_STAGE_STEPS = ['Round of 16', 'Quarterfinal', 'Semifinal', 'Third-place match', 'Final'];

export function TournamentPage() {
  const flow = useTournamentFlow();
  const rankingButtonVisible = useIdleVisibility(flow.isInteracting, flow.feedback?.id);
  const currentStepIndex = TOURNAMENT_STAGE_STEPS.indexOf(flow.currentRoundLabel);

  if (flow.isLoading) {
    return (
      <main className="comparison-screen comparison-screen--empty tournament-page">
        <header className="comparison-header">
          <FilmFilterSwitch activeFilter={allFilmFilter} view="tournament" />
          <p className="eyebrow">Tournament mode</p>
          <h1>Building the bracket</h1>
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
          <h1>Tournament finished</h1>
        </header>
        <TournamentSummary podiumItems={flow.podiumItems} onStartNewTournament={() => void flow.startNewTournament()} />
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
        <h1>{flow.currentRoundLabel}</h1>
        <p className="tournament-page__hint">Frozen top 16 from All. Every match has one winner.</p>
      </header>

      <ol className="tournament-page__steps" aria-label="Tournament rounds">
        {TOURNAMENT_STAGE_STEPS.map((step, index) => (
          <li
            key={step}
            className={
              index <= currentStepIndex
                ? 'tournament-page__step tournament-page__step--active'
                : 'tournament-page__step'
            }
          >
            {step}
          </li>
        ))}
      </ol>

      <header className="comparison-status tournament-page__status">
        <span>{flow.completedMatchCount} done</span>
        <span>{flow.bracket.totalMatches - flow.completedMatchCount} left</span>
        <span>{flow.bracket.totalMatches} total</span>
      </header>

      <section className="comparison-stage" aria-label="Choose one item">
        <CompetitionItemCard
          item={flow.leftItem}
          previewItem={flow.nextLeftItem}
          side="left"
          onChoose={flow.chooseLeft}
          onInteractionChange={flow.setIsInteracting}
        />
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
