import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { allFilmFilter } from '../content/filmSource';

type PublicProfileMessageProps = {
  title: string;
};

export function PublicProfileMessage({ title }: PublicProfileMessageProps) {
  return (
    <main className="public-profile-page">
      <section className="public-profile-panel">
        <Link to={allFilmFilter.comparisonPath} className="public-profile-panel__back" aria-label="Back to comparisons">
          <ArrowLeft aria-hidden="true" size={23} />
        </Link>
        <h1>{title}</h1>
      </section>
    </main>
  );
}
