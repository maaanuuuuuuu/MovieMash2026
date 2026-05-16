import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import './CelebrationToast.css';

type CelebrationToastProps = {
  visible: boolean;
  onClose: () => void;
};

export function CelebrationToast({ visible, onClose }: CelebrationToastProps) {
  if (!visible) {
    return null;
  }

  return (
    <section className="celebration-toast" aria-label="Ranking milestone">
      <Sparkles aria-hidden="true" size={24} />
      <div>
        <p>Congrats, your ranking is starting to look like something, wanna see?</p>
        <div className="celebration-toast__actions">
          <Link to="/ranking" onClick={onClose}>
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
