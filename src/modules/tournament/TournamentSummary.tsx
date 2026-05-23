import { RotateCcw, Trophy } from 'lucide-react';
import type { FilmItem } from '../content/types';

type TournamentSummaryProps = {
  podium: FilmItem[];
  onRestart: () => void;
};

export function TournamentSummary({ podium, onRestart }: TournamentSummaryProps) {
  return (
    <section className="tournament-summary" aria-labelledby="tournament-summary-title">
      <div className="tournament-summary__badge">
        <Trophy aria-hidden="true" size={20} />
        Tournament finished
      </div>
      <h2 id="tournament-summary-title">Bracket podium</h2>
      <p>The tournament is done. Start a new bracket to freeze the current All top 16.</p>
      <ol className="tournament-summary__podium">
        {podium.map((item, index) => (
          <li key={item.id} className="tournament-summary__podium-item">
            <span className="tournament-summary__rank">#{index + 1}</span>
            <img src={item.imageSrc} alt="" />
            <span>
              <strong>{item.label}</strong>
              <span>{item.year}</span>
            </span>
          </li>
        ))}
      </ol>
      <button type="button" className="tournament-summary__restart" onClick={onRestart}>
        <RotateCcw aria-hidden="true" size={18} />
        Start a new tournament
      </button>
    </section>
  );
}
