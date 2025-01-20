import { debounce } from "lodash";
import { useCallback, useMemo, useRef } from "react";
import { fetchMeasurements } from "../../../store/fixedStreamSlice";
import { useAppDispatch } from "../../../store/hooks";

export const useMeasurementsFetcher = (streamId: number | null) => {
  const dispatch = useAppDispatch();
  const isFetchingRef = useRef(false);

  const fetchData = useCallback(
    async (start: number, end: number) => {
      if (!streamId || isFetchingRef.current) return;

      try {
        isFetchingRef.current = true;
        await dispatch(
          fetchMeasurements({
            streamId,
            startTime: start.toString(),
            endTime: end.toString(),
          })
        ).unwrap();
        // Add 1 second cooldown
        setTimeout(() => {
          isFetchingRef.current = false;
        }, 2000);
      } catch (error) {
        console.error("Error fetching measurements:", error);
        isFetchingRef.current = false;
      }
    },
    [dispatch, streamId]
  );

  const fetchMeasurementsIfNeeded = useMemo(
    () => async (start: number, end: number) => {
      return new Promise<void>((resolve) => {
        const debouncedFetch = debounce(async () => {
          await fetchData(start, end);
          resolve();
        }, 300);
        debouncedFetch();
      });
    },
    [fetchData]
  );

  return { fetchMeasurementsIfNeeded };
};
