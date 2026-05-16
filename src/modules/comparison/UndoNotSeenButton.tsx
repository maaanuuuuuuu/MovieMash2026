import { Undo2 } from 'lucide-react';

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
      aria-label="Undo not seen"
      title="Undo not seen"
    >
      <Undo2 aria-hidden="true" size={24} strokeWidth={2.4} />
    </button>
  );
}
