import type { ComparableItem } from '../../domain/item';

export function item(id: string): ComparableItem {
  return {
    id,
    category: 'test',
    label: id,
    subtitle: id,
    imageSrc: `/posters/${id}.jpg`,
  };
}

export function items(prefix: string, count: number) {
  return Array.from({ length: count }, (_value, index) => item(`${prefix}-${index}`));
}
