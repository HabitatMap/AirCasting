import HighchartsReact from "highcharts-react-official";
import { useRef } from "react";
import { selectFetchedTimeRanges } from "../../../store/fixedStreamSelectors";
import {
  fetchMeasurements,
  updateFetchedTimeRanges,
} from "../../../store/fixedStreamSlice";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  MILLISECONDS_IN_A_DAY,
  MILLISECONDS_IN_A_MINUTE,
  MILLISECONDS_IN_A_MONTH,
} from "../../../utils/timeRanges";
import { updateRangeDisplay } from "./updateRangeDisplay";

const INITIAL_EDGE_FETCH_MONTHS = 1;

export const useMeasurementsFetcher = (
  streamId: number | null,
  sessionStartTime: number,
  sessionEndTime: number,
  chartComponentRef: React.RefObject<HighchartsReact.RefObject>,
  fixedSessionTypeSelected: boolean,
  rangeDisplayRef?: React.RefObject<HTMLDivElement>
) => {
  const isCurrentlyFetchingRef = useRef(false);
  const dispatch = useAppDispatch();
  const isFirstRender = useRef(true);
  const fetchAttemptsRef = useRef(0);
  // This ref will store the intended trigger (e.g. "mousewheel")
  const lastFetchTriggerRef = useRef<string | null>(null);
  const pendingSetExtremesRef = useRef<{ start: number; end: number } | null>(
    null
  );

  const fetchedTimeRanges = useAppSelector((state) =>
    streamId ? selectFetchedTimeRanges(state, streamId) : []
  );

  const findMissingRanges = (start: number, end: number) => {
    if (!fetchedTimeRanges.length) {
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

    const sortedRanges = [...fetchedTimeRanges].sort(
      (a, b) => a.start - b.start
    );
    const gaps: { start: number; end: number }[] = [];
    let currentStart = start;

    for (const range of sortedRanges) {
      if (currentStart < range.start) {
        const gapEnd = Math.min(range.start, end);
        if (gapEnd - currentStart > MILLISECONDS_IN_A_MINUTE) {
          gaps.push({
            start: currentStart,
            end: gapEnd,
          });
        }
      }
      currentStart = Math.max(currentStart, range.end);
    }

    if (currentStart < end) {
      if (end - currentStart > MILLISECONDS_IN_A_MINUTE) {
        gaps.push({
          start: currentStart,
          end,
        });
      }
    }

    return gaps.reduce<{ start: number; end: number }[]>((acc, gap) => {
      if (gap.end - gap.start > MILLISECONDS_IN_A_MONTH) {
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

  // UPDATED: Use an effective trigger when setting extremes.
  const updateExtremesAndDisplay = (
    start: number,
    end: number,
    trigger: string | undefined
  ) => {
    if (chartComponentRef?.current?.chart) {
      const chart = chartComponentRef.current.chart;
      // If trigger is "none", fall back to the last stored trigger.
      const effectiveTrigger =
        trigger && trigger !== "none"
          ? trigger
          : lastFetchTriggerRef.current || "none";
      chart.xAxis[0].setExtremes(start, end, true, false, {
        trigger: effectiveTrigger,
      });
      updateRangeDisplay(
        rangeDisplayRef,
        start,
        end,
        effectiveTrigger === "calendarDay"
      );
    }
  };

  const fetchMeasurementsIfNeeded = async (
    start: number,
    end: number,
    isEdgeFetch: boolean = false,
    isDaySelection: boolean = false,
    trigger?: string
  ) => {
    if (!streamId || isCurrentlyFetchingRef.current) {
      return;
    }

    // Store the intended trigger and pending extremes.
    if (trigger) {
      lastFetchTriggerRef.current = trigger;
      pendingSetExtremesRef.current = { start, end };
    }

    const boundedStart = Math.max(start, sessionStartTime);
    const boundedEnd = Math.min(end, sessionEndTime);

    if (boundedStart >= boundedEnd) {
      return;
    }

    try {
      isCurrentlyFetchingRef.current = true;

      // For initial mobile session fetch, skip the missing ranges check and fetch all data
      if (trigger === "initial" && !fixedSessionTypeSelected) {
        const result = await dispatch(
          fetchMeasurements({
            streamId: Number(streamId),
            startTime: Math.floor(boundedStart).toString(),
            endTime: Math.floor(boundedEnd).toString(),
          })
        ).unwrap();

        if (result && result.length > 0) {
          dispatch(
            updateFetchedTimeRanges({
              streamId,
              start: boundedStart,
              end: boundedEnd,
            })
          );
        }
      } else {
        // Existing logic for fixed sessions and other cases
        const missingRanges = findMissingRanges(boundedStart, boundedEnd);

        if (missingRanges.length === 0) {
          if (pendingSetExtremesRef.current) {
            const { start, end } = pendingSetExtremesRef.current;
            updateExtremesAndDisplay(
              start,
              end,
              lastFetchTriggerRef.current || undefined
            );
          }
          return;
        }

        for (const range of missingRanges) {
          let fetchStart = range.start;
          let fetchEnd = range.end;

          if (isDaySelection) {
            const paddedStart = Math.max(
              sessionStartTime,
              fetchStart - MILLISECONDS_IN_A_DAY * 2
            );
            const paddedEnd = Math.min(
              sessionEndTime,
              fetchEnd + MILLISECONDS_IN_A_DAY - 1000 * 2
            );

            if (paddedEnd - paddedStart > MILLISECONDS_IN_A_MONTH) {
              fetchStart = paddedEnd - MILLISECONDS_IN_A_MONTH;
              fetchEnd = paddedEnd;
            } else {
              fetchStart = paddedStart;
              fetchEnd = paddedEnd;
            }
          } else if (isEdgeFetch) {
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

            fetchStart = Math.max(
              sessionStartTime,
              fetchStart - totalRange / 2
            );
            fetchEnd = Math.min(sessionEndTime, fetchEnd + totalRange / 2);
          }
          if (fetchEnd - fetchStart > MILLISECONDS_IN_A_MONTH) {
            fetchStart = fetchEnd - MILLISECONDS_IN_A_MONTH;
          }

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

        if (pendingSetExtremesRef.current) {
          const { start, end } = pendingSetExtremesRef.current;
          requestAnimationFrame(() => {
            updateExtremesAndDisplay(
              start,
              end,
              lastFetchTriggerRef.current || undefined
            );
          });
        }

        if (isFirstRender.current) {
          isFirstRender.current = false;
        }
      }
    } catch (error) {
      console.error("[Fetch Error]", {
        error,
        streamId,
        range: {
          start: new Date(boundedStart).toISOString(),
          end: new Date(boundedEnd).toISOString(),
        },
      });
    } finally {
      isCurrentlyFetchingRef.current = false;
      pendingSetExtremesRef.current = null;
    }
  };

  return { fetchMeasurementsIfNeeded };
};
