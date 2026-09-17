export type MockCallToolScheduleSlot = {
  weekday: string;
  time: string;
};

export type MockCallToolState = {
  completedClickIds: string[];
  selectedSlot: MockCallToolScheduleSlot | null;
  bookingSaved: boolean;
};

export function meetsRequiredBooking(
  state: MockCallToolState,
  require: { weekday: string; time: string },
): boolean {
  if (!state.bookingSaved) return false;
  if (!state.selectedSlot) return false;
  return (
    state.selectedSlot.weekday === require.weekday &&
    state.selectedSlot.time === require.time
  );
}
