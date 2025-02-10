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
    return () => {
      isCurrentlyFetchingRef.current = false;
    };
  }, []);

  const fetchMeasurementsIfNeeded = async (start: number, end: number) => {
    if (!streamId || isCurrentlyFetchingRef.current) {
      console.log("[fetchMeasurementsIfNeeded] Skipping fetch:", {
        reason: !streamId ? "no streamId" : "already fetching",
        streamId,
        isCurrentlyFetching: isCurrentlyFetchingRef.current,
      });
      return;
    }

    try {
      isCurrentlyFetchingRef.current = true;
      const hasData = await dispatch(
        checkDataAvailability({ streamId, start, end })
      ).unwrap();

      console.log("[fetchMeasurementsIfNeeded] Data availability check:", {
        hasData,
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
      });

      if (!hasData) {
        const fetchStart = isFirstRender.current
          ? start - MILLISECONDS_IN_A_DAY
          : start - MILLISECONDS_IN_A_WEEK * 2;
        const fetchEnd = isFirstRender.current
          ? end + MILLISECONDS_IN_A_DAY
          : end + MILLISECONDS_IN_A_WEEK * 2;

        console.log("[fetchMeasurementsIfNeeded] Fetching data:", {
          isFirstRender: isFirstRender.current,
          fetchStart: new Date(fetchStart).toISOString(),
          fetchEnd: new Date(fetchEnd).toISOString(),
        });

        const result = await dispatch(
          fetchMeasurements({
            streamId: Number(streamId),
            startTime: Math.floor(fetchStart).toString(),
            endTime: Math.floor(fetchEnd).toString(),
          })
        ).unwrap();

        console.log("[fetchMeasurementsIfNeeded] Fetch result:", {
          success: !!result,
          dataPoints: result?.length,
        });

        // Only update fetched ranges if we got data successfully
        if (result) {
          dispatch(
            updateFetchedTimeRanges({
              streamId,
              start: fetchStart,
              end: fetchEnd,
            })
          );
        }

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
