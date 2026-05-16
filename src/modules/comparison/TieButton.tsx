import './TieButton.css';

type TieButtonProps = {
  onTie: () => void;
};

export function TieButton({ onTie }: TieButtonProps) {
  return (
    <button type="button" className="tie-button" onClick={onTie} aria-label="Mark this pair as a tie">
      tie
    </button>
  );
}
