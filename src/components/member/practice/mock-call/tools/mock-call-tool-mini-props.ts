export type MockCallToolMiniProps = {
  completedIds: Set<string>;
  nextClickId: string | null;
  onHotspot: (id: string) => void;
  onDecoy: () => void;
};
