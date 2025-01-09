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
  const lastFetchedStartRef = useRef<number | null>(null);
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

      // Update last fetched start time after successful fetch
      lastFetchedStartRef.current = start;
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
          const monthStart = selectedDate - MILLISECONDS_IN_A_MONTH / 2;
          const monthEnd = selectedDate + MILLISECONDS_IN_A_MONTH / 2;
          await fetchChunk(monthStart, monthEnd);
        } else if (isInitialFetchRef.current) {
          // For initial fetch, load one week of data
        isCurrentlyFetchingRef.current = true;

        // For initial fetch, load two days of data
        if (isInitialFetchRef.current) {
          await fetchChunk(end - MILLISECONDS_IN_A_DAY * 2, end);
          isInitialFetchRef.current = false;
          return;
        }

        // For subsequent fetches, check if we need to load more data
        if (
          lastFetchedStartRef.current === null ||
          start < lastFetchedStartRef.current
        ) {
          // Calculate the fetch window
          const fetchStart = Math.min(
            start,
            lastFetchedStartRef.current
              ? lastFetchedStartRef.current - MILLISECONDS_IN_A_MONTH
              : end - MILLISECONDS_IN_A_MONTH
          );

          const fetchEnd = lastFetchedStartRef.current || end;

          await fetchChunk(fetchStart, fetchEnd);
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
