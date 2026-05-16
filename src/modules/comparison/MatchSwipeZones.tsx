import { Lightbulb, Trash2 } from 'lucide-react';
import type { NotSeenDisposition } from '../../domain/item';
import './MatchSwipeZones.css';

export type MatchSwipeZoneState = {
  disposition: NotSeenDisposition | undefined;
  ready: boolean;
};

type MatchSwipeZonesProps = {
  state: MatchSwipeZoneState | undefined;
};

function getZoneClassName(
  zoneDisposition: NotSeenDisposition,
  state: MatchSwipeZoneState | undefined,
) {
  const active = state?.disposition === zoneDisposition;

  return [
    'match-swipe-zone',
    `match-swipe-zone--${zoneDisposition}`,
    active ? 'match-swipe-zone--active' : '',
    active && state.ready ? 'match-swipe-zone--ready' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function MatchSwipeZones({ state }: MatchSwipeZonesProps) {
  if (!state) {
    return null;
  }

  return (
    <div className="match-swipe-zones match-swipe-zones--visible" aria-hidden="true">
      <div className={getZoneClassName('interested', state)}>
        <Lightbulb aria-hidden="true" size={20} strokeWidth={2.5} />
        <span>Interested</span>
      </div>
      <div className={getZoneClassName('removed', state)}>
        <Trash2 aria-hidden="true" size={20} strokeWidth={2.5} />
        <span>Remove</span>
      </div>
    </div>
  );
}
