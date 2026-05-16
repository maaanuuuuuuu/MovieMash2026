import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { StableTopMilestone } from '../rankingEngine/stability';
import './CelebrationToast.css';

type CelebrationToastProps = {
  milestone: StableTopMilestone | undefined;
  to: string;
  onClose: () => void;
};

function milestoneMessage(milestone: StableTopMilestone) {
  return milestone === 10
    ? 'Your first stable top 10 is ready. Wanna see?'
    : `Your stable top ${milestone} is ready. Wanna see?`;
}

export function CelebrationToast({ milestone, to, onClose }: CelebrationToastProps) {
  if (!milestone) {
    return null;
  }

  return (
    <section className="celebration-toast" aria-label="Ranking milestone">
      <Sparkles aria-hidden="true" size={24} />
      <div>
        <p>{milestoneMessage(milestone)}</p>
        <div className="celebration-toast__actions">
          <Link to={to} onClick={onClose}>
            See ranking
          </Link>
          <button type="button" onClick={onClose}>
            Keep going
          </button>
        </div>
      </div>
    </section>
  );
}
