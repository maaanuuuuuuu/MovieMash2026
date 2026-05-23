import type { TournamentRound } from './tournamentBracket';

type TournamentRoundBadgeProps = {
  round: TournamentRound;
};

const ROUND_COPY: Record<TournamentRound, { label: string; detail: string }> = {
  'round-of-16': { label: 'Round of 16', detail: '8 seeded duels' },
  quarterfinal: { label: 'Quarterfinals', detail: '8 movies left' },
  semifinal: { label: 'Semifinals', detail: '4 movies left' },
  'third-place': { label: 'Small final', detail: 'Fight for 3rd place' },
  final: { label: 'Final', detail: 'One crown match left' },
};

export function TournamentRoundBadge({ round }: TournamentRoundBadgeProps) {
  const copy = ROUND_COPY[round];

  return (
    <div className="tournament-round-badge">
      <span className="tournament-round-badge__label">{copy.label}</span>
      <span className="tournament-round-badge__detail">{copy.detail}</span>
    </div>
  );
}
