import type { ItemId, NotSeenDisposition, RankingItemState } from '../../domain/item';
import type { ComparisonOutcome, DecidedOutcome } from '../../domain/outcome';
import type { FilmItem } from '../content/types';
import { getMetaBoolean, persistOutcome, setMetaBoolean, undoDecidedOutcome } from '../persistence/rankingRepository';
import { hasReachedCelebrationThreshold } from '../rankingEngine/stability';
import {
  getOutcomeLogMessage,
  getQueueAfterNotSeen,
  otherItemId,
  type FeedbackKind,
  type FlowFeedback,
  type PendingNotSeen,
  type UndoableVote,
} from './useComparisonFlow.utils';

const CELEBRATION_META_KEY = 'celebrationShown';
const NOT_SEEN_UNDO_WINDOW_MS = 10000;

type PendingRef = { current: PendingNotSeen | undefined };

type ComparisonFlowActionInput = {
  rankingScopeId: string;
  itemIds: string[];
  itemById: Map<string, FilmItem>;
  activeStates: RankingItemState[];
  currentMatchup: PendingNotSeen['matchup'] | undefined;
  queue: PendingNotSeen['matchup'][];
  canMarkNotSeen: boolean;
  setFeedback: (feedback: FlowFeedback | undefined) => void;
  undoableVote: UndoableVote | undefined;
  setUndoableVote: (vote: UndoableVote | undefined) => void;
  setCelebrationVisible: (visible: boolean) => void;
  pendingNotSeenRef: PendingRef;
  clearPendingNotSeenTimeout: () => void;
  setPendingNotSeen: (pending: PendingNotSeen | undefined) => void;
  schedulePendingNotSeen: (pending: PendingNotSeen, delayMs: number, onTimeout: () => void) => void;
  advanceQueue: () => void;
  replaceQueue: (queue: PendingNotSeen['matchup'][]) => void;
  restoreMatchup: (matchup: PendingNotSeen['matchup']) => void;
};

export function createComparisonFlowActions(input: ComparisonFlowActionInput) {
  function outcomeLogMessage(outcome: ComparisonOutcome) {
    return getOutcomeLogMessage(outcome, input.itemById);
  }

  async function maybeShowCelebration(nextStates: RankingItemState[]) {
    if (!hasReachedCelebrationThreshold(nextStates)) {
      return;
    }

    const alreadyShown = await getMetaBoolean(CELEBRATION_META_KEY);

    if (!alreadyShown) {
      await setMetaBoolean(CELEBRATION_META_KEY, true);
      input.setCelebrationVisible(true);
    }
  }

  function showFeedback(kind: FeedbackKind, label: string) {
    input.setFeedback({ id: Date.now(), kind, label });
  }

  // Commit the delayed not-seen action before the next user choice changes the flow.
  async function flushPendingNotSeen() {
    const pending = input.pendingNotSeenRef.current;

    if (!pending) {
      return;
    }

    input.clearPendingNotSeenTimeout();
    input.setPendingNotSeen(undefined);
    const result = await persistOutcome(input.rankingScopeId, pending.outcome, input.itemIds);
    console.log(
      result.applied
        ? outcomeLogMessage(pending.outcome)
        : `${outcomeLogMessage(pending.outcome)} blocked: ${result.reason}`,
    );

    if (result.applied) {
      await maybeShowCelebration(result.states);
      return;
    }

    if (result.reason === 'minimumActiveItems') showFeedback('blocked', 'Last 10 stay');
  }

  async function commitOutcome(outcome: DecidedOutcome, kind: FeedbackKind, label: string, matchup: PendingNotSeen['matchup']) {
    await flushPendingNotSeen();
    input.setUndoableVote(undefined);
    input.advanceQueue();
    showFeedback(kind, label);
    const result = await persistOutcome(input.rankingScopeId, outcome, input.itemIds);
    console.log(
      result.applied ? outcomeLogMessage(outcome) : `${outcomeLogMessage(outcome)} blocked: ${result.reason}`,
    );

    if (result.applied) {
      input.setUndoableVote({ id: Date.now(), comparisonId: result.comparisonId, matchup });
      await maybeShowCelebration(result.states);
      return;
    }

    if (result.reason === 'minimumActiveItems') showFeedback('blocked', 'Last 10 stay');
  }

  function chooseLeft() {
    if (!input.currentMatchup) {
      return;
    }

    void commitOutcome(
      { type: 'winner', winnerId: input.currentMatchup.leftId, loserId: input.currentMatchup.rightId },
      'picked',
      'Picked',
      input.currentMatchup,
    );
  }

  function chooseRight() {
    if (!input.currentMatchup) {
      return;
    }

    void commitOutcome(
      { type: 'winner', winnerId: input.currentMatchup.rightId, loserId: input.currentMatchup.leftId },
      'picked',
      'Picked',
      input.currentMatchup,
    );
  }

  function tie() {
    if (!input.currentMatchup) {
      return;
    }

    void commitOutcome(
      { type: 'tie', leftId: input.currentMatchup.leftId, rightId: input.currentMatchup.rightId },
      'tie',
      'Tie',
      input.currentMatchup,
    );
  }

  function markNotSeen(itemId: ItemId, disposition: NotSeenDisposition) {
    const currentMatchup = input.currentMatchup;

    if (!currentMatchup) {
      return;
    }

    if (!input.canMarkNotSeen) {
      showFeedback('blocked', 'Last 10 stay');
      return;
    }

    input.setUndoableVote(undefined);
    void flushPendingNotSeen().then(() => {
      const nextQueue = getQueueAfterNotSeen(itemId, input.activeStates, input.queue);
      const pending: PendingNotSeen = {
        id: Date.now(),
        matchup: currentMatchup,
        outcome: { type: 'notSeen', itemId, otherId: otherItemId(currentMatchup, itemId), disposition },
      };

      input.replaceQueue(nextQueue);
      input.schedulePendingNotSeen(pending, NOT_SEEN_UNDO_WINDOW_MS, () => {
        void flushPendingNotSeen();
      });
      showFeedback(disposition, disposition === 'interested' ? 'Interested' : 'Removed');
    });
  }

  function undoNotSeen() {
    const pending = input.pendingNotSeenRef.current;

    if (!pending) {
      return;
    }

    input.clearPendingNotSeenTimeout();
    input.setPendingNotSeen(undefined);
    input.restoreMatchup(pending.matchup);
  }

  function undoLastVote() {
    const vote = input.undoableVote;

    if (!vote) {
      return;
    }

    input.setUndoableVote(undefined);
    void undoDecidedOutcome(input.rankingScopeId, vote.comparisonId, input.itemIds).then((result) => {
      if (result.applied) {
        input.restoreMatchup(vote.matchup);
        showFeedback('undo', 'Undone');
        return;
      }

      showFeedback('blocked', 'Undo expired');
    });
  }

  return { chooseLeft, chooseRight, tie, markNotSeen, undoNotSeen, undoLastVote };
}
