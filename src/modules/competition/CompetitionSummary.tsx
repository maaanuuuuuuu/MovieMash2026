import { RotateCcw, Trophy } from 'lucide-react';
import type { FilmItem } from '../content/types';

type CompetitionSummaryProps = {
  topThree: FilmItem[];
  onStartNewLeague: () => void;
};

export function CompetitionSummary({ topThree, onStartNewLeague }: CompetitionSummaryProps) {
  return (
    <section className="competition-summary" aria-labelledby="competition-summary-title">
      <div className="competition-summary__badge">
        <Trophy aria-hidden="true" size={20} />
        League finished
      </div>
      <h2 id="competition-summary-title">Global top 3 right now</h2>
      <p>The league is done. Start a new one to freeze the current top 20.</p>
      <ol className="competition-summary__podium">
        {topThree.map((item, index) => (
          <li key={item.id} className="competition-summary__podium-item">
            <span className="competition-summary__rank">#{index + 1}</span>
            <img src={item.imageSrc} alt="" />
            <span>
              <strong>{item.label}</strong>
              <span>{item.year}</span>
            </span>
          </li>
        ))}
      </ol>
      <button type="button" className="competition-summary__restart" onClick={onStartNewLeague}>
        <RotateCcw aria-hidden="true" size={18} />
        Start a new league
      </button>
    </section>
  );
}
