import { useEffect, useRef } from "react";
import {
  checkDataAvailability,
  fetchMeasurements,
  updateFetchedTimeRanges,
} from "../../../store/fixedStreamSlice";
import { useAppDispatch } from "../../../store/hooks";
import {
  MILLISECONDS_IN_A_DAY,
  MILLISECONDS_IN_A_WEEK,
} from "../../../utils/timeRanges";

export const useMeasurementsFetcher = (streamId: number | null) => {
  const isCurrentlyFetchingRef = useRef(false);
  const dispatch = useAppDispatch();
  const isFirstRender = useRef(true);

  useEffect(() => {
    isFirstRender.current = true;
  }, []);

  const fetchMeasurementsIfNeeded = async (start: number, end: number) => {
    if (!streamId || isCurrentlyFetchingRef.current) {
      return;
    }

    try {
      isCurrentlyFetchingRef.current = true;
      const hasData = await dispatch(
        checkDataAvailability({ streamId, start, end })
      ).unwrap();

      if (!hasData) {
        let fetchStart: number, fetchEnd: number;
        if (isFirstRender.current) {
          fetchStart = start - MILLISECONDS_IN_A_DAY;
          fetchEnd = end + MILLISECONDS_IN_A_DAY;
        } else {
          fetchStart = start - MILLISECONDS_IN_A_WEEK * 2;
          fetchEnd = end + MILLISECONDS_IN_A_WEEK * 2;
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
      console.error(
        "[useMeasurementsFetcher] Error fetching measurements:",
        error
      );
    } finally {
      isCurrentlyFetchingRef.current = false;
    }
  };

  return { fetchMeasurementsIfNeeded };
};
