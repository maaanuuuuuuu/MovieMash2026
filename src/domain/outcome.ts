import type { ItemId, NotSeenDisposition } from './item';

export type DecidedOutcome =
  | {
      type: 'winner';
      winnerId: ItemId;
      loserId: ItemId;
    }
  | {
      type: 'tie';
      leftId: ItemId;
      rightId: ItemId;
    };

export type NotSeenOutcome = {
  type: 'notSeen';
  itemId: ItemId;
  otherId: ItemId;
  disposition: NotSeenDisposition;
};

export type ComparisonOutcome = DecidedOutcome | NotSeenOutcome;

export type OutcomeKind = ComparisonOutcome['type'];
