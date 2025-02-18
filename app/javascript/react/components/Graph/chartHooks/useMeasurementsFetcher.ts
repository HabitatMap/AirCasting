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
  rangeDisplayRef?: React.RefObject<HTMLDivElement>
) => {
  const isCurrentlyFetchingRef = useRef(false);
  const dispatch = useAppDispatch();
  const isFirstRender = useRef(true);
  const fetchAttemptsRef = useRef(0);
  const lastFetchTriggerRef = useRef<string | null>(null);
  const pendingSetExtremesRef = useRef<{ start: number; end: number } | null>(
    null
  );
  const lastFetchTimeRef = useRef<number>(0);
  const DEBOUNCE_TIME = 300; // 300ms debounce

  const fetchedTimeRanges = useAppSelector((state) =>
    streamId ? selectFetchedTimeRanges(state, streamId) : []
  );

  const findMissingRanges = (start: number, end: number) => {
    if (!fetchedTimeRanges.length) {
      if (end - start > MILLISECONDS_IN_A_MONTH) {
        return [{ start: end - MILLISECONDS_IN_A_MONTH, end }];
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
          gaps.push({ start: currentStart, end: gapEnd });
        }
      }
      currentStart = Math.max(currentStart, range.end);
    }

    if (currentStart < end && end - currentStart > MILLISECONDS_IN_A_MINUTE) {
      gaps.push({ start: currentStart, end });
    }

    return gaps.reduce<{ start: number; end: number }[]>((acc, gap) => {
      if (gap.end - gap.start > MILLISECONDS_IN_A_MONTH) {
        let chunkEnd = gap.end;
        while (chunkEnd > gap.start) {
          const chunkStart = Math.max(
            gap.start,
            chunkEnd - MILLISECONDS_IN_A_MONTH
          );
          acc.push({ start: chunkStart, end: chunkEnd });
          chunkEnd = chunkStart;
        }
      } else {
        acc.push(gap);
      }
      return acc;
    }, []);
  };

  const updateExtremesAndDisplay = (
    start: number,
    end: number,
    trigger: string | undefined
  ) => {
    if (chartComponentRef?.current?.chart) {
      const chart = chartComponentRef.current.chart;

      chart.xAxis[0].setExtremes(start, end, true, false, { trigger });
      updateRangeDisplay(
        rangeDisplayRef,
        start,
        end,
        trigger === "calendarDay"
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
    // Add debouncing
    const now = Date.now();
    if (now - lastFetchTimeRef.current < DEBOUNCE_TIME) {
    }
    lastFetchTimeRef.current = now;

    if (!streamId || isCurrentlyFetchingRef.current) {
      return;
    }

    try {
      isCurrentlyFetchingRef.current = true;

      // If this fetch is due to a day selection, force the trigger
      if (trigger) {
        lastFetchTriggerRef.current = isDaySelection ? "calendarDay" : trigger;
        pendingSetExtremesRef.current = { start, end };
      }

      const boundedStart = Math.max(start, sessionStartTime);
      const boundedEnd = Math.min(end, sessionEndTime);

      if (boundedStart >= boundedEnd) {
        return;
      }

      const missingRanges = findMissingRanges(boundedStart, boundedEnd);

      if (missingRanges.length === 0) {
        if (pendingSetExtremesRef.current) {
          requestAnimationFrame(() => {
            updateExtremesAndDisplay(
              start,
              end,
              lastFetchTriggerRef.current || undefined
            );
          });
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
            fetchEnd + MILLISECONDS_IN_A_DAY - 2000
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
          fetchStart = Math.max(sessionStartTime, fetchStart - totalRange / 2);
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
          const triggerToUse =
            lastFetchTriggerRef.current === "calendarDay"
              ? "calendarDay"
              : lastFetchTriggerRef.current || undefined;

          updateExtremesAndDisplay(start, end, triggerToUse);
        });
      }

      if (isFirstRender.current) {
        isFirstRender.current = false;
      }
    } catch (error) {
      console.error("[useMeasurementsFetcher] Error:", error);
    } finally {
      // Use setTimeout to ensure we don't clear the flag too early
      setTimeout(() => {
        isCurrentlyFetchingRef.current = false;
        pendingSetExtremesRef.current = null;
      }, 100);
    }
  };

  return { fetchMeasurementsIfNeeded };
};
