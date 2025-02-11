import { useRef } from "react";
import { selectFetchedTimeRanges } from "../../../store/fixedStreamSelectors";
import {
  fetchMeasurements,
  updateFetchedTimeRanges,
} from "../../../store/fixedStreamSlice";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  MILLISECONDS_IN_A_DAY,
  MILLISECONDS_IN_A_MONTH,
} from "../../../utils/timeRanges";

const MAX_FETCH_ATTEMPTS = 5;
const INITIAL_EDGE_FETCH_MONTHS = 1;

export const useMeasurementsFetcher = (
  streamId: number | null,
  sessionStartTime: number,
  sessionEndTime: number
) => {
  const isCurrentlyFetchingRef = useRef(false);
  const dispatch = useAppDispatch();
  const isFirstRender = useRef(true);
  const fetchAttemptsRef = useRef(0);

  // Get already fetched time ranges from Redux
  const fetchedTimeRanges = useAppSelector((state) =>
    streamId ? selectFetchedTimeRanges(state, streamId) : []
  );

  // Helper function to find gaps in fetched ranges with size limit
  const findMissingRanges = (start: number, end: number) => {
    if (!fetchedTimeRanges.length) {
      // If requesting more than a month, return only the last month
      if (end - start > MILLISECONDS_IN_A_MONTH) {
        return [
          {
            start: end - MILLISECONDS_IN_A_MONTH,
            end,
          },
        ];
      }
      return [{ start, end }];
    }

    // Sort ranges by start time
    const sortedRanges = [...fetchedTimeRanges].sort(
      (a, b) => a.start - b.start
    );
    const gaps: { start: number; end: number }[] = [];
    let currentStart = start;

    for (const range of sortedRanges) {
      // If there's a gap before this range
      if (currentStart < range.start) {
        const gapEnd = Math.min(range.start, end);
        // Only add gap if it's not too small (more than 1 minute)
        if (gapEnd - currentStart > 60000) {
          gaps.push({
            start: currentStart,
            end: gapEnd,
          });
        }
      }
      // Update currentStart to the end of this range
      currentStart = Math.max(currentStart, range.end);
    }

    // Check if there's a gap after the last range
    if (currentStart < end) {
      // Only add gap if it's not too small
      if (end - currentStart > 60000) {
        gaps.push({
          start: currentStart,
          end,
        });
      }
    }

    // Process gaps to ensure none are larger than one month
    return gaps.reduce<{ start: number; end: number }[]>((acc, gap) => {
      if (gap.end - gap.start > MILLISECONDS_IN_A_MONTH) {
        // Split into month-sized chunks, starting from the end
        let chunkEnd = gap.end;
        while (chunkEnd > gap.start) {
          const chunkStart = Math.max(
            gap.start,
            chunkEnd - MILLISECONDS_IN_A_MONTH
          );
          acc.push({
            start: chunkStart,
            end: chunkEnd,
          });
          chunkEnd = chunkStart;
        }
      } else {
        acc.push(gap);
      }
      return acc;
    }, []);
  };

  const fetchMeasurementsIfNeeded = async (
    start: number,
    end: number,
    isEdgeFetch: boolean = false,
    isDaySelection: boolean = false
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

    if (boundedStart >= boundedEnd) {
      console.log(
        "[fetchMeasurementsIfNeeded] Outside session boundaries, skipping fetch"
      );
      return;
    }

    try {
      isCurrentlyFetchingRef.current = true;

      // Find missing ranges in the requested time window
      const missingRanges = findMissingRanges(boundedStart, boundedEnd);

      console.log(
        "[fetchMeasurementsIfNeeded] Missing ranges:",
        missingRanges.map((range) => ({
          start: new Date(range.start).toISOString(),
          end: new Date(range.end).toISOString(),
          duration: (range.end - range.start) / (1000 * 60 * 60 * 24), // days
        }))
      );

      if (missingRanges.length === 0) {
        console.log("[fetchMeasurementsIfNeeded] All data already fetched");
        return;
      }

      // Fetch each missing range
      for (const range of missingRanges) {
        let fetchStart = range.start;
        let fetchEnd = range.end;

        if (isDaySelection) {
          // For day selection, add padding but still respect one month limit
          const paddedStart = Math.max(
            sessionStartTime,
            fetchStart - MILLISECONDS_IN_A_DAY * 2
          );
          const paddedEnd = Math.min(
            sessionEndTime,
            fetchEnd + MILLISECONDS_IN_A_DAY * 2
          );

          // Ensure padding doesn't exceed one month
          if (paddedEnd - paddedStart > MILLISECONDS_IN_A_MONTH) {
            fetchStart = paddedEnd - MILLISECONDS_IN_A_MONTH;
            fetchEnd = paddedEnd;
          } else {
            fetchStart = paddedStart;
            fetchEnd = paddedEnd;
          }
        } else if (isEdgeFetch) {
          // Edge fetch logic with one month limit
          const baseRange = Math.min(
            MILLISECONDS_IN_A_MONTH * INITIAL_EDGE_FETCH_MONTHS,
            MILLISECONDS_IN_A_MONTH
          );
          const expansionFactor = Math.min(
            Math.pow(2, fetchAttemptsRef.current),
            MILLISECONDS_IN_A_MONTH / baseRange
          );
          const totalRange = Math.min(
            baseRange * expansionFactor,
            MILLISECONDS_IN_A_MONTH
          );

          fetchStart = Math.max(sessionStartTime, fetchStart - totalRange / 2);
          fetchEnd = Math.min(sessionEndTime, fetchEnd + totalRange / 2);
        }

        // Final check to ensure we never exceed one month
        if (fetchEnd - fetchStart > MILLISECONDS_IN_A_MONTH) {
          fetchStart = fetchEnd - MILLISECONDS_IN_A_MONTH;
        }

        console.log("[fetchMeasurementsIfNeeded] Fetching range:", {
          start: new Date(fetchStart).toISOString(),
          end: new Date(fetchEnd).toISOString(),
          duration: (fetchEnd - fetchStart) / (1000 * 60 * 60 * 24), // days
        });

        const result = await dispatch(
          fetchMeasurements({
            streamId: Number(streamId),
            startTime: Math.floor(fetchStart).toString(),
            endTime: Math.floor(fetchEnd).toString(),
          })
        ).unwrap();

        if (result && result.length > 0) {
          dispatch(
            updateFetchedTimeRanges({
              streamId,
              start: fetchStart,
              end: fetchEnd,
            })
          );
        }
      }

      if (isFirstRender.current) {
        isFirstRender.current = false;
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
