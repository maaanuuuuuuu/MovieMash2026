import { act, fireEvent, waitFor } from '@testing-library/react';
import { expect } from 'vitest';

function mockPosterBox(element: Element) {
  element.getBoundingClientRect = () =>
    ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 200,
      bottom: 300,
      width: 200,
      height: 300,
      toJSON: () => '',
    }) as DOMRect;
}

export async function swipeFirstPoster(
  deltaX: number,
  deltaY: number,
  expectedDisposition?: 'interested' | 'removed',
) {
  const poster = document.querySelector('.item-card .item-card__poster-wrap');

  if (!poster) {
    throw new Error('Missing poster');
  }

  mockPosterBox(poster);
  const card = poster.closest('.item-card');
  fireEvent.pointerDown(poster, { pointerId: 1, clientX: 100, clientY: 150 });
  await waitFor(() => {
    expect(card).toHaveClass('item-card--dragging');
  });
  fireEvent.pointerMove(poster, { pointerId: 1, clientX: 100 + deltaX, clientY: 150 + deltaY });

  if (expectedDisposition) {
    await waitFor(() => {
      expect(card).toHaveClass(`item-card--${expectedDisposition}`);
    });
  }

  fireEvent.pointerUp(poster, { pointerId: 1, clientX: 100 + deltaX, clientY: 150 + deltaY });
}

export async function swipeRankingRow(rowButton: HTMLElement, startX: number, endX: number) {
  fireEvent.pointerDown(rowButton, { pointerId: 1, clientX: startX });
  fireEvent.pointerMove(rowButton, { pointerId: 1, clientX: endX });

  await act(async () => {
    fireEvent.pointerUp(rowButton, { pointerId: 1, clientX: endX });
    await new Promise((resolve) => window.setTimeout(resolve, 0));
  });

  await waitFor(() => {
    if (!document.body.contains(rowButton)) {
      return;
    }

    expect(rowButton).not.toHaveClass('ranking-row__button--dragging');
  });
}
