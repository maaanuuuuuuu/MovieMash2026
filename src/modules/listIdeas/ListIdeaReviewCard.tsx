import './ListIdeas.css';
import type { ListIdeaRecord, ListIdeaStatus } from './listIdeaRepository';

type ListIdeaReviewCardProps = {
  idea: ListIdeaRecord;
  busyStatus: ListIdeaStatus | undefined;
  onStatusChange: (status: ListIdeaStatus) => void;
};

function formatTimestamp(value: number | null) {
  if (value === null) {
    return 'just now';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value);
}

export function ListIdeaReviewCard({ idea, busyStatus, onStatusChange }: ListIdeaReviewCardProps) {
  return (
    <article className="list-idea-review-card">
      <div className="list-idea-review-card__header">
        <div>
          <p className="eyebrow">{idea.category}</p>
          <h2 className="list-idea-review-card__title">{idea.title}</h2>
        </div>
        <span className="list-idea-review-card__status">{idea.status}</span>
      </div>
      <div className="list-idea-review-card__meta">
        <span>{idea.createdByEmail ?? idea.createdByUid}</span>
        <span>Submitted {formatTimestamp(idea.createdAtMs)}</span>
      </div>
      <div className="list-idea-review-card__body">
        {idea.examples ? <p><strong>Examples:</strong> {idea.examples}</p> : null}
        {idea.notes ? <p><strong>Notes:</strong> {idea.notes}</p> : null}
        {!idea.examples && !idea.notes ? <p>No extra notes.</p> : null}
      </div>
      <div className="list-idea-review-card__actions">
        {(['pending', 'approved', 'rejected'] as const).map((status) => (
          <button
            key={status}
            type="button"
            className={status === idea.status ? 'list-idea-status-button' : 'list-idea-status-button list-idea-status-button--idle'}
            disabled={busyStatus !== undefined}
            onClick={() => onStatusChange(status)}
          >
            {busyStatus === status ? 'Saving...' : status}
          </button>
        ))}
      </div>
    </article>
  );
}
