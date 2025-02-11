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
  MILLISECONDS_IN_A_WEEK,
} from "../../../utils/timeRanges";

const MAX_FETCH_ATTEMPTS = 5;
const INITIAL_EDGE_FETCH_MONTHS = 6; // Increased to 6 months for initial fetch

export const useMeasurementsFetcher = (
  streamId: number | null,
  sessionStartTime: number,
  sessionEndTime: number
) => {
  const isCurrentlyFetchingRef = useRef(false);
  const dispatch = useAppDispatch();
  const isFirstRender = useRef(true);
  const fetchAttemptsRef = useRef(0);
  const lastSuccessfulFetchRef = useRef<{
    start: number;
    end: number;
    hasDataBefore: boolean;
    hasDataAfter: boolean;
  } | null>(null);

  useEffect(() => {
    isFirstRender.current = true;
    return () => {
      isCurrentlyFetchingRef.current = false;
    };
  }, []);

  const fetchMeasurementsIfNeeded = async (
    start: number,
    end: number,
    isEdgeFetch: boolean = false
  ) => {
    if (!streamId || isCurrentlyFetchingRef.current) {
      console.log("[fetchMeasurementsIfNeeded] Skipping fetch:", {
        reason: !streamId ? "no streamId" : "already fetching",
        streamId,
        isCurrentlyFetching: isCurrentlyFetchingRef.current,
      });
      return;
    }

    // Respect session boundaries
    const boundedStart = Math.max(start, sessionStartTime);
    const boundedEnd = Math.min(end, sessionEndTime);

    // If we're outside session boundaries, skip the fetch
    if (boundedStart >= boundedEnd) {
      console.log(
        "[fetchMeasurementsIfNeeded] Outside session boundaries, skipping fetch"
      );
      return;
    }

    try {
      isCurrentlyFetchingRef.current = true;
      const hasData = await dispatch(
        checkDataAvailability({
          streamId,
          start: boundedStart,
          end: boundedEnd,
        })
      ).unwrap();

      console.log("[fetchMeasurementsIfNeeded] Data availability check:", {
        hasData,
        start: new Date(boundedStart).toISOString(),
        end: new Date(boundedEnd).toISOString(),
        isEdgeFetch,
        attempt: fetchAttemptsRef.current,
      });

      if (!hasData) {
        let fetchStart: number;
        let fetchEnd: number;

        if (isEdgeFetch) {
          // Exponential expansion based on attempts, starting with a larger base
          const baseRange = MILLISECONDS_IN_A_MONTH * INITIAL_EDGE_FETCH_MONTHS;
          const expansionFactor = Math.pow(2, fetchAttemptsRef.current);
          const totalRange = baseRange * expansionFactor;

          // When hitting a gap, try to fetch a large chunk in both directions
          fetchStart = Math.max(sessionStartTime, boundedStart - totalRange);
          fetchEnd = Math.min(sessionEndTime, boundedEnd + totalRange);

          console.log("[fetchMeasurementsIfNeeded] Edge fetch calculation:", {
            baseRange,
            expansionFactor,
            totalRange,
            fetchStart: new Date(fetchStart).toISOString(),
            fetchEnd: new Date(fetchEnd).toISOString(),
          });
        } else {
          // Normal fetch behavior
          fetchStart = isFirstRender.current
            ? boundedStart - MILLISECONDS_IN_A_DAY
            : boundedStart - MILLISECONDS_IN_A_WEEK * 2;
          fetchEnd = isFirstRender.current
            ? boundedEnd + MILLISECONDS_IN_A_DAY
            : boundedEnd + MILLISECONDS_IN_A_WEEK * 2;
        }

        console.log("[fetchMeasurementsIfNeeded] Fetching data:", {
          isFirstRender: isFirstRender.current,
          isEdgeFetch,
          attempt: fetchAttemptsRef.current,
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

        if (result && result.length > 0) {
          console.log("[fetchMeasurementsIfNeeded] Found data:", {
            points: result.length,
            firstPoint: new Date(result[0].time).toISOString(),
            lastPoint: new Date(result[result.length - 1].time).toISOString(),
          });

          dispatch(
            updateFetchedTimeRanges({
              streamId,
              start: fetchStart,
              end: fetchEnd,
            })
          );

          // Reset fetch attempts on successful data fetch
          fetchAttemptsRef.current = 0;
        } else if (
          isEdgeFetch &&
          fetchAttemptsRef.current < MAX_FETCH_ATTEMPTS
        ) {
          // If no data found, try again with a larger range
          fetchAttemptsRef.current++;
          setTimeout(() => {
            fetchMeasurementsIfNeeded(boundedStart, boundedEnd, true);
          }, 100);
        } else {
          // Reset attempts if we've hit the maximum
          fetchAttemptsRef.current = 0;
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
