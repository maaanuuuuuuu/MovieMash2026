import type { FlowFeedback } from './useComparisonFlow';
import './ConfirmationBurst.css';

type ConfirmationBurstProps = {
  feedback?: FlowFeedback;
};

export function ConfirmationBurst({ feedback }: ConfirmationBurstProps) {
  if (!feedback) {
    return null;
  }

  return (
    <div key={feedback.id} className={`confirmation-burst confirmation-burst--${feedback.kind}`} aria-live="polite">
      {feedback.label}
    </div>
  );
}
