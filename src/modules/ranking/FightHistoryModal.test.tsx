import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { filmItems } from '../content/filmSource';
import { FightHistoryModal } from './FightHistoryModal';

describe('fight history modal', () => {
  it('shows friend interest signals above the fight history list', () => {
    const item = filmItems[0];

    render(
      <FightHistoryModal
        item={item}
        records={[]}
        itemById={new Map([[item.id, item]])}
        socialProofLines={['Tom loves this', 'Julie really likes this']}
        socialProofLoading={false}
        onClose={() => undefined}
      />,
    );

    expect(screen.getByLabelText('Friend interest signals')).toBeInTheDocument();
    expect(screen.getByText('Tom loves this')).toBeInTheDocument();
    expect(screen.getByText('Julie really likes this')).toBeInTheDocument();
  });
});
