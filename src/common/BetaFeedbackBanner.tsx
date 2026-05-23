import './BetaFeedbackBanner.css';

const GITHUB_ISSUES_URL = 'https://github.com/maaanuuuuuuu/MovieMash2026/issues/new/choose';

export function BetaFeedbackBanner() {
  return (
    <p className="beta-feedback-banner">
      <span>MovieMash is in beta.</span>{' '}
      <a
        className="beta-feedback-banner__link"
        href={GITHUB_ISSUES_URL}
        target="_blank"
        rel="noreferrer"
      >
        Report a bug or share an idea on GitHub Issues
      </a>
      .
    </p>
  );
}
