import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import './ListIdeas.css';
import { signInWithGoogle } from '../auth/authRepository';
import { useAuthSession } from '../auth/useAuthSession';
import { isAdminSession } from './adminAccess';
import { createListIdea } from './listIdeaRepository';

type FormState = {
  title: string;
  category: string;
  examples: string;
  notes: string;
};

const emptyForm: FormState = {
  title: '',
  category: '',
  examples: '',
  notes: '',
};

export function SuggestListIdeaPage() {
  const session = useAuthSession();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [status, setStatus] = useState<{ tone: 'idle' | 'error' | 'success'; message: string }>({
    tone: 'idle',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (session.status !== 'signedIn') {
      return;
    }

    setIsSubmitting(true);
    setStatus({ tone: 'idle', message: '' });

    try {
      await createListIdea(session.user, form);
      setForm(emptyForm);
      setStatus({ tone: 'success', message: 'Your idea is saved for review.' });
    } catch (error) {
      setStatus({ tone: 'error', message: error instanceof Error ? error.message : 'Saving failed.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignIn() {
    setStatus({ tone: 'idle', message: '' });

    try {
      await signInWithGoogle();
    } catch (error) {
      setStatus({ tone: 'error', message: error instanceof Error ? error.message : 'Google sign-in failed.' });
    }
  }

  return (
    <main className="list-idea-page">
      <Link to="/" className="list-idea-page__back">
        <ArrowLeft aria-hidden="true" size={18} /> Back to comparisons
      </Link>
      <section className="list-idea-panel">
        <p className="eyebrow">Future lists</p>
        <h1>Suggest a list idea</h1>
        <p className="list-idea-panel__hint">Share a title, a category, and a few notes. This stays separate from your ranking flow.</p>
        {session.status === 'signedIn' ? (
          <>
            <div className="list-idea-form">
              <label className="list-idea-field">
                <span>List title</span>
                <input value={form.title} maxLength={80} onChange={(event) => setForm({ ...form, title: event.target.value })} />
              </label>
              <label className="list-idea-field">
                <span>Category</span>
                <input value={form.category} maxLength={60} onChange={(event) => setForm({ ...form, category: event.target.value })} />
              </label>
              <label className="list-idea-field">
                <span>Examples</span>
                <textarea value={form.examples} maxLength={400} onChange={(event) => setForm({ ...form, examples: event.target.value })} />
              </label>
              <label className="list-idea-field">
                <span>Notes</span>
                <textarea value={form.notes} maxLength={600} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
              </label>
            </div>
            <div className="list-idea-page__actions">
              <button
                type="button"
                className="list-idea-page__button"
                disabled={isSubmitting || form.title.trim().length === 0 || form.category.trim().length === 0}
                onClick={() => {
                  void handleSubmit();
                }}
              >
                {isSubmitting ? 'Saving...' : 'Send idea'}
              </button>
              {isAdminSession(session) ? (
                <Link to="/suggestions/review" className="list-idea-link">
                  Open review screen
                </Link>
              ) : null}
            </div>
          </>
        ) : (
          <div className="list-idea-page__actions">
            <p className="list-idea-panel__hint">
              {session.status === 'unconfigured'
                ? 'Sign-in is not available in this build.'
                : session.status === 'loading'
                  ? 'Checking Google sign-in...'
                  : 'Google sign-in is required before you can send an idea.'}
            </p>
            {session.status === 'signedOut' || session.status === 'error' ? (
              <button
                type="button"
                className="list-idea-page__button"
                onClick={() => {
                  void handleSignIn();
                }}
              >
                Sign in with Google
              </button>
            ) : null}
          </div>
        )}
        {status.message ? (
          <p className={`list-idea-page__message list-idea-page__message--${status.tone}`} role="status">
            {status.message}
          </p>
        ) : null}
      </section>
    </main>
  );
}
