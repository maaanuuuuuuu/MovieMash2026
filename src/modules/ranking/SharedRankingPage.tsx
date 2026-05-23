import { ArrowLeft, Trophy } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { filmFilterById, filmItemById } from '../content/filmSource';
import './SharedRankingPage.css';
import { readSharedRankingSnapshot } from './sharedRanking';

export function SharedRankingPage() {
  const location = useLocation();
  const snapshot = readSharedRankingSnapshot(location.search);

  if (!snapshot) {
    return (
      <main className="shared-ranking-page">
        <section className="shared-ranking-panel">
          <p className="eyebrow">Shared ranking</p>
          <h1>Share link not available</h1>
          <p className="shared-ranking-panel__copy">This top 20 link is missing or broken.</p>
          <Link to="/" className="shared-ranking-panel__cta">
            Try the app
          </Link>
        </section>
      </main>
    );
  }

  const filter = filmFilterById.get(snapshot.filterId);

  if (!filter) {
    return (
      <main className="shared-ranking-page">
        <section className="shared-ranking-panel">
          <p className="eyebrow">Shared ranking</p>
          <h1>Share link not available</h1>
          <p className="shared-ranking-panel__copy">This filter is no longer available in the app.</p>
          <Link to="/" className="shared-ranking-panel__cta">
            Try the app
          </Link>
        </section>
      </main>
    );
  }

  const sharedItems = snapshot.topItemIds
    .map((itemId) => filmItemById.get(itemId))
    .filter((item) => item !== undefined);

  return (
    <main className="shared-ranking-page">
      <section className="shared-ranking-panel">
        <div className="shared-ranking-panel__header">
          <Link to={filter.rankingPath} className="shared-ranking-panel__back">
            <ArrowLeft aria-hidden="true" size={22} />
            <span>Open ranking</span>
          </Link>
          <p className="eyebrow">{filter.eyebrow}</p>
          <h1>Shared top {sharedItems.length}</h1>
          <p className="shared-ranking-panel__copy">A read-only snapshot from MovieMash. Open the app to make your own ranking.</p>
          <Link to={filter.comparisonPath} className="shared-ranking-panel__cta">
            Try the app
          </Link>
        </div>

        <ol className="shared-ranking-list" aria-label="Shared top 20">
          {sharedItems.map((item, index) => (
            <li key={item.id} className="shared-ranking-card">
              <span className="shared-ranking-card__rank">{index + 1}</span>
              <img className="shared-ranking-card__poster" src={item.imageSrc} alt="" />
              <span className="shared-ranking-card__main">
                <span className="shared-ranking-card__title">{item.label}</span>
                <span className="shared-ranking-card__meta">{item.year}</span>
              </span>
              <Trophy aria-hidden="true" size={18} className="shared-ranking-card__icon" />
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
