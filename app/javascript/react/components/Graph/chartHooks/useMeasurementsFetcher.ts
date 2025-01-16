import { debounce } from "lodash";
import { useRef } from "react";
import { fetchMeasurements } from "../../../store/fixedStreamSlice";
import { useAppDispatch } from "../../../store/hooks";
import { MILLISECONDS_IN_A_MONTH } from "../../../utils/timeRanges";

export const useMeasurementsFetcher = (streamId: number | null) => {
  const isCurrentlyFetchingRef = useRef(false);
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
    async (start: number, end: number) => {
      if (!streamId || isCurrentlyFetchingRef.current) return;

      try {
        isCurrentlyFetchingRef.current = true;

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
  ) as (start: number, end: number) => Promise<void>;

  return { fetchMeasurementsIfNeeded };
};
