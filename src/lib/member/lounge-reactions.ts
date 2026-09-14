export type LoungeReaction = "LIKE" | "CELEBRATE" | "HELPFUL";

export function applyReactionToggle<
  T extends {
    reaction_counts: Record<LoungeReaction, number>;
    my_reaction: LoungeReaction | null;
  },
>(post: T, reaction: LoungeReaction): T {
  const counts: Record<LoungeReaction, number> = {
    ...post.reaction_counts,
  };
  const prev = post.my_reaction;
  if (prev === reaction) {
    counts[reaction] = Math.max(0, (counts[reaction] ?? 0) - 1);
    return { ...post, reaction_counts: counts, my_reaction: null };
  }
  if (prev) {
    counts[prev] = Math.max(0, (counts[prev] ?? 0) - 1);
  }
  counts[reaction] = (counts[reaction] ?? 0) + 1;
  return { ...post, reaction_counts: counts, my_reaction: reaction };
}
