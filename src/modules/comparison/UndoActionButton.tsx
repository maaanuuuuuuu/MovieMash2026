import { Undo2 } from 'lucide-react';
import './UndoActionButton.css';

type UndoActionButtonProps = {
  ariaLabel: string;
  onUndo: () => void;
  visible: boolean;
};

export function UndoActionButton({ ariaLabel, onUndo, visible }: UndoActionButtonProps) {
  if (!visible) {
    return null;
  }

  return (
    <button type="button" className="undo-action-button" onClick={onUndo} aria-label={ariaLabel} title={ariaLabel}>
      <Undo2 aria-hidden="true" size={24} strokeWidth={2.4} />
    </button>
  );
}
