import { debounce } from "lodash";
import { useRef } from "react";
import { fetchMeasurements } from "../../../store/fixedStreamSlice";
import { useAppDispatch } from "../../../store/hooks";
import {
  MILLISECONDS_IN_A_DAY,
  MILLISECONDS_IN_A_MONTH,
} from "../../../utils/timeRanges";

export const useMeasurementsFetcher = (streamId: number | null) => {
  const isCurrentlyFetchingRef = useRef(false);
  const isInitialFetchRef = useRef(true);
  const dispatch = useAppDispatch();

  const fetchChunk = async (start: number, end: number) => {
    if (!streamId) return;

    try {
      await dispatch(
        fetchMeasurements({
          streamId: Number(streamId),
          startTime: Math.floor(start).toString(),
          endTime: Math.floor(end).toString(),
        })
      ).unwrap();
    } catch (error) {
      console.error("Error fetching chunk:", error);
    }
  };

  const fetchMeasurementsIfNeeded = debounce(
    async (start: number, end: number, selectedDate?: number | null) => {
      if (!streamId || isCurrentlyFetchingRef.current) return;
      isCurrentlyFetchingRef.current = true;

      try {
        if (selectedDate) {
          // For selected date, fetch one month of data centered around the selected date
          const monthStart = selectedDate - MILLISECONDS_IN_A_MONTH / 2;
          const monthEnd = selectedDate + MILLISECONDS_IN_A_MONTH / 2;
          await fetchChunk(monthStart, monthEnd);
        } else if (isInitialFetchRef.current) {
          // For initial fetch, load one week of data
          await fetchChunk(end - MILLISECONDS_IN_A_DAY * 2, end);
          isInitialFetchRef.current = false;
        } else {
          // For subsequent fetches, get one month of data
          await fetchChunk(end - MILLISECONDS_IN_A_MONTH, end);
        }
      } finally {
        isCurrentlyFetchingRef.current = false;
      }
    },
    300
  ) as (
    start: number,
    end: number,
    selectedDate?: number | null
  ) => Promise<void>;

  return { fetchMeasurementsIfNeeded };
};
