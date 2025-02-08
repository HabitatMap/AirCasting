// app/javascript/react/components/Graph/chartHooks/useMeasurementsFetcher.ts
import { useEffect, useRef } from "react";
import {
  checkDataAvailability,
  fetchMeasurements,
  updateFetchedTimeRanges,
} from "../../../store/fixedStreamSlice";
import { useAppDispatch } from "../../../store/hooks";
import {
  MILLISECONDS_IN_A_DAY,
  MILLISECONDS_IN_A_MONTH,
} from "../../../utils/timeRanges";

export const useMeasurementsFetcher = (streamId: number | null) => {
  const isCurrentlyFetchingRef = useRef(false);
  const dispatch = useAppDispatch();
  const isFirstRender = useRef(true);

  // Reset flag on mount
  useEffect(() => {
    isFirstRender.current = true;
  }, []);

  const fetchMeasurementsIfNeeded = async (start: number, end: number) => {
    if (!streamId || isCurrentlyFetchingRef.current) return;

    try {
      isCurrentlyFetchingRef.current = true;

      const hasData = await dispatch(
        checkDataAvailability({ streamId, start, end })
      ).unwrap();

      if (!hasData) {
        let fetchStart: number, fetchEnd: number;

        if (isFirstRender.current) {
          // On first render: use a 2-day buffer on each side.
          fetchStart = start - 2 * MILLISECONDS_IN_A_DAY;
          fetchEnd = end + 2 * MILLISECONDS_IN_A_DAY;
          console.log("Fetching first render: 2 days buffer", {
            fetchStart,
            fetchEnd,
          });
        } else {
          // Subsequent calls: use a 1-month buffer on each side.
          fetchStart = start - MILLISECONDS_IN_A_MONTH;
          fetchEnd = end + MILLISECONDS_IN_A_MONTH;
          console.log("Fetching subsequent render: 1 month buffer", {
            fetchStart,
            fetchEnd,
          });
        }

        await dispatch(
          fetchMeasurements({
            streamId: Number(streamId),
            startTime: Math.floor(fetchStart).toString(),
            endTime: Math.floor(fetchEnd).toString(),
          })
        ).unwrap();

        dispatch(
          updateFetchedTimeRanges({
            streamId,
            start: fetchStart,
            end: fetchEnd,
          })
        );

        if (isFirstRender.current) {
          isFirstRender.current = false;
        }
      }
    } catch (error) {
      console.error("Error fetching measurements:", error);
    } finally {
      isCurrentlyFetchingRef.current = false;
    }
  };

  return { fetchMeasurementsIfNeeded };
};
