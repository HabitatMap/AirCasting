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
    console.log(
      "[useMeasurementsFetcher] Mounted: isFirstRender reset to true"
    );
  }, []);

  const fetchMeasurementsIfNeeded = async (start: number, end: number) => {
    console.log(
      "[useMeasurementsFetcher] Called fetchMeasurementsIfNeeded with start:",
      start,
      "end:",
      end
    );
    if (!streamId || isCurrentlyFetchingRef.current) {
      console.log(
        "[useMeasurementsFetcher] Early return: streamId:",
        streamId,
        "isCurrentlyFetching:",
        isCurrentlyFetchingRef.current
      );
      return;
    }

    try {
      isCurrentlyFetchingRef.current = true;
      const hasData = await dispatch(
        checkDataAvailability({ streamId, start, end })
      ).unwrap();
      console.log(
        "[useMeasurementsFetcher] checkDataAvailability result:",
        hasData,
        "for range:",
        start,
        end
      );
      if (!hasData) {
        let fetchStart: number, fetchEnd: number;
        if (isFirstRender.current) {
          fetchStart = start - 2 * MILLISECONDS_IN_A_DAY;
          fetchEnd = end + 2 * MILLISECONDS_IN_A_DAY;
          console.log(
            "[useMeasurementsFetcher] First render: computed fetchStart:",
            fetchStart,
            "fetchEnd:",
            fetchEnd
          );
        } else {
          fetchStart = start - MILLISECONDS_IN_A_WEEK * 2;
          fetchEnd = end + MILLISECONDS_IN_A_WEEK * 2;
          console.log(
            "[useMeasurementsFetcher] Subsequent render: computed fetchStart:",
            fetchStart,
            "fetchEnd:",
            fetchEnd
          );
        }
        await dispatch(
          fetchMeasurements({
            streamId: Number(streamId),
            startTime: Math.floor(fetchStart).toString(),
            endTime: Math.floor(fetchEnd).toString(),
          })
        ).unwrap();
        console.log(
          "[useMeasurementsFetcher] Fetched measurements for range:",
          fetchStart,
          fetchEnd
        );
        dispatch(
          updateFetchedTimeRanges({
            streamId,
            start: fetchStart,
            end: fetchEnd,
          })
        );
        if (isFirstRender.current) {
          isFirstRender.current = false;
          console.log(
            "[useMeasurementsFetcher] Setting isFirstRender to false"
          );
        }
      } else {
        console.log(
          "[useMeasurementsFetcher] Data already available for range:",
          start,
          end
        );
      }
    } catch (error) {
      console.error(
        "[useMeasurementsFetcher] Error fetching measurements:",
        error
      );
    } finally {
      isCurrentlyFetchingRef.current = false;
      console.log("[useMeasurementsFetcher] isCurrentlyFetching set to false");
    }
  };

  return { fetchMeasurementsIfNeeded };
};
