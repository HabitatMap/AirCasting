import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from ".";

interface CalendarState {
  selectedDate: number | null;
}

const initialState: CalendarState = {
  selectedDate: null,
};

const calendarSlice = createSlice({
  name: "calendar",
  initialState,
  reducers: {
    setSelectedDate(state, action: PayloadAction<number | null>) {
      state.selectedDate = action.payload;
    },
  },
});

export const { setSelectedDate } = calendarSlice.actions;
export default calendarSlice.reducer;

export const selectSelectedDate = (state: RootState) =>
  state.calendar.selectedDate;
