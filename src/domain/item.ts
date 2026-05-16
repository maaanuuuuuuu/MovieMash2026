export type ItemId = string;

export type ComparableItem<Category extends string = string> = {
  id: ItemId;
  category: Category;
  label: string;
  subtitle: string;
  imageSrc: string;
};

export type RankingItemState = {
  catalogId: string;
  itemId: ItemId;
  rating: number;
  appearances: number;
  wins: number;
  losses: number;
  ties: number;
  active: boolean;
  notSeen: boolean;
  createdAt: number;
  updatedAt: number;
};

export type StabilityTier = 'new' | 'settling' | 'stable';
