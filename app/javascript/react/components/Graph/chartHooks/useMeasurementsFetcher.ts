import { debounce } from "lodash";
import { useEffect, useRef } from "react";
import { fetchMeasurements } from "../../../store/fixedStreamSlice";
import { useAppDispatch } from "../../../store/hooks";
import { MILLISECONDS_IN_A_WEEK } from "../../../utils/timeRanges";

const CHUNK_SIZE = MILLISECONDS_IN_A_WEEK;

export const useMeasurementsFetcher = (streamId: number | null) => {
  const isCurrentlyFetchingRef = useRef(false);
  const isBackgroundFetchingRef = useRef(false);
  const dispatch = useAppDispatch();

  const fetchChunk = async (
    start: number,
    end: number,
    isBackground = false
  ) => {
    try {
      await dispatch(
        fetchMeasurements({
          streamId: Number(streamId),
          startTime: Math.floor(start).toString(),
          endTime: Math.floor(end).toString(),
          isBackground,
        })
      ).unwrap();
    } catch (error) {
      console.error("Error fetching chunk:", error);
    }
  };

  const fetchInBackground = async (start: number, end: number) => {
    isBackgroundFetchingRef.current = true;
    let currentStart = start;
    while (currentStart < end && isBackgroundFetchingRef.current) {
      const chunkEnd = Math.min(currentStart + CHUNK_SIZE, end);
      await fetchChunk(currentStart, chunkEnd, true);
      currentStart = chunkEnd;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    isBackgroundFetchingRef.current = false;
  };

  // Cancel background fetching when component unmounts or streamId changes
  useEffect(() => {
    return () => {
      isBackgroundFetchingRef.current = false;
    };
  }, [streamId]);

  const fetchMeasurementsIfNeeded = debounce(
    async (start: number, end: number) => {
      if (!streamId || isCurrentlyFetchingRef.current) return;
      isCurrentlyFetchingRef.current = true;

      try {
        // First fetch just the visible range
        await fetchChunk(start, Math.min(start + CHUNK_SIZE, end), false);

        // Then fetch the rest in the background
        if (end > start + CHUNK_SIZE) {
          fetchInBackground(start + CHUNK_SIZE, end);
        }
      } finally {
        isCurrentlyFetchingRef.current = false;
      }
    },
    300
  ) as (start: number, end: number) => Promise<void>;

  return { fetchMeasurementsIfNeeded };
};
