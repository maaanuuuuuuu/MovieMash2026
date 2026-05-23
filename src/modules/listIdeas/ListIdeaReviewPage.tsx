import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './ListIdeas.css';
import { useAuthSession } from '../auth/useAuthSession';
import { isAdminSession } from './adminAccess';
import { ListIdeaReviewCard } from './ListIdeaReviewCard';
import { listListIdeas, updateListIdeaStatus, type ListIdeaRecord, type ListIdeaStatus } from './listIdeaRepository';

export function ListIdeaReviewPage() {
  const session = useAuthSession();
  const [ideas, setIdeas] = useState<ListIdeaRecord[]>([]);
  const [message, setMessage] = useState<string>('');
  const [busyIdeaId, setBusyIdeaId] = useState<string | undefined>();
  const [busyStatus, setBusyStatus] = useState<ListIdeaStatus | undefined>();

  // Load the current Firestore submissions when an allowed admin session is ready.
  useEffect(() => {
    if (!isAdminSession(session)) {
      return;
    }

    let cancelled = false;

    void listListIdeas()
      .then((records) => {
        if (!cancelled) {
          setIdeas(records);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : 'Loading failed.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [session]);

  async function handleStatusChange(ideaId: string, status: ListIdeaStatus) {
    setBusyIdeaId(ideaId);
    setBusyStatus(status);
    setMessage('');

    try {
      await updateListIdeaStatus(ideaId, status);
      setIdeas((current) =>
        current.map((idea) =>
          idea.id === ideaId ? { ...idea, status, updatedAtMs: Date.now() } : idea,
        ),
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Saving failed.');
    } finally {
      setBusyIdeaId(undefined);
      setBusyStatus(undefined);
    }
  }

  return (
    <main className="list-idea-page">
      <Link to="/suggestions/new" className="list-idea-page__back">
        <ArrowLeft aria-hidden="true" size={18} /> Back to idea form
      </Link>
      <section className="list-idea-panel">
        <p className="eyebrow">Admin review</p>
        <h1>Review list ideas</h1>
        {session.status === 'loading' ? (
          <p className="list-idea-panel__hint">Checking admin access...</p>
        ) : !isAdminSession(session) ? (
          <p className="list-idea-page__message list-idea-page__message--error">Only the allowlisted admin email can open this screen.</p>
        ) : ideas.length === 0 ? (
          <p className="list-idea-panel__hint">No submitted ideas yet.</p>
        ) : (
          <div className="list-idea-review-list">
            {ideas.map((idea) => (
              <ListIdeaReviewCard
                key={idea.id}
                idea={idea}
                busyStatus={busyIdeaId === idea.id ? busyStatus : undefined}
                onStatusChange={(status) => {
                  void handleStatusChange(idea.id, status);
                }}
              />
            ))}
          </div>
        )}
        {message ? (
          <p className="list-idea-page__message list-idea-page__message--error" role="status">
            {message}
          </p>
        ) : null}
      </section>
    </main>
  );
}
