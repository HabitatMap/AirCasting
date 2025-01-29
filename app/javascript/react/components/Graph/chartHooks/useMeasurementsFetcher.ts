import { useRef } from "react";
import {
  checkDataAvailability,
  fetchMeasurements,
  updateFetchedTimeRanges,
} from "../../../store/fixedStreamSlice";
import { useAppDispatch } from "../../../store/hooks";
import { MILLISECONDS_IN_A_MONTH } from "../../../utils/timeRanges";

export const useMeasurementsFetcher = (streamId: number | null) => {
  const isCurrentlyFetchingRef = useRef(false);
  const dispatch = useAppDispatch();

  const fetchMeasurementsIfNeeded = async (start: number, end: number) => {
    if (!streamId || isCurrentlyFetchingRef.current) return;

    try {
      isCurrentlyFetchingRef.current = true;

      const hasData = await dispatch(
        checkDataAvailability({ streamId, start, end })
      ).unwrap();

      if (!hasData) {
        const fetchStart = start - MILLISECONDS_IN_A_MONTH;
        const fetchEnd = end + MILLISECONDS_IN_A_MONTH;

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
      }
    } catch (error) {
      console.error("Error fetching measurements:", error);
    } finally {
      isCurrentlyFetchingRef.current = false;
    }
  };

  return { fetchMeasurementsIfNeeded };
};
