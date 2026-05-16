import { Undo2 } from 'lucide-react';
import './UndoNotSeenButton.css';

type UndoNotSeenButtonProps = {
  visible: boolean;
  onUndo: () => void;
};

export function UndoNotSeenButton({ visible, onUndo }: UndoNotSeenButtonProps) {
  if (!visible) {
    return null;
  }

  return (
    <button
      type="button"
      className="undo-not-seen-button"
      onClick={onUndo}
      aria-label="Undo last swipe"
      title="Undo last swipe"
    >
      <Undo2 aria-hidden="true" size={24} strokeWidth={2.4} />
    </button>
  );
}
