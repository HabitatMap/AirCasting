import { useRef } from "react";
import { fetchMeasurements } from "../../../store/fixedStreamSlice";
import { useAppDispatch } from "../../../store/hooks";

interface FetchRange {
  start: number;
  end: number;
}

interface LastFetchedRange {
  start: number | null;
  end: number | null;
}

export const useMeasurementsFetcher = (streamId: number | null) => {
  const isCurrentlyFetchingRef = useRef(false);
  const lastFetchedRangeRef = useRef<LastFetchedRange>({
    start: null,
    end: null,
  });
  const dispatch = useAppDispatch();
  const validateFetchRange = ({ start, end }: FetchRange): boolean => {
    if (!streamId || isCurrentlyFetchingRef.current) return false;

    const now = Date.now();
    end = Math.min(end, now);

    return start < end;
  };

  const adjustFetchRange = ({ start, end }: FetchRange): FetchRange | null => {
    const { start: lastStart, end: lastEnd } = lastFetchedRangeRef.current;

    if (lastStart === null || lastEnd === null) return { start, end };

    // Return null if data already exists
    if (start >= lastStart && end <= lastEnd) return null;

    // Adjust range to fetch only missing data
    if (start < lastStart) return { start, end: lastStart };
    if (end > lastEnd) return { start: lastEnd, end };

    return null;
  };

  const updateLastFetchedRange = (newRange: FetchRange) => {
    const { start, end } = lastFetchedRangeRef.current;
    lastFetchedRangeRef.current = {
      start: Math.min(newRange.start, start ?? newRange.start),
      end: Math.max(newRange.end, end ?? newRange.end),
    };
  };

  const fetchMeasurementsIfNeeded = async (start: number, end: number) => {
    const range = { start, end };

    if (!validateFetchRange(range)) return;

    const adjustedRange = adjustFetchRange(range);
    if (!adjustedRange) return;

    isCurrentlyFetchingRef.current = true;

    try {
      await dispatch(
        fetchMeasurements({
          streamId: Number(streamId),
          startTime: Math.floor(adjustedRange.start).toString(),
          endTime: Math.floor(adjustedRange.end).toString(),
        })
      ).unwrap();

      updateLastFetchedRange(adjustedRange);
    } catch (error) {
      console.error("Error fetching measurements:", error);
    } finally {
      isCurrentlyFetchingRef.current = false;
    }
  };

  return { fetchMeasurementsIfNeeded };
};
