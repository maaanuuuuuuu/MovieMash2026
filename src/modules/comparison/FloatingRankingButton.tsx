import { ListOrdered } from 'lucide-react';
import { Link } from 'react-router-dom';

type FloatingRankingButtonProps = {
  visible: boolean;
  to: string;
};

export function FloatingRankingButton({ visible, to }: FloatingRankingButtonProps) {
  return (
    <Link
      to={to}
      className={visible ? 'ranking-fab ranking-fab--visible' : 'ranking-fab'}
      aria-label="Open ranking"
      title="Open ranking"
    >
      <ListOrdered aria-hidden="true" size={24} strokeWidth={2.4} />
    </Link>
  );
}
