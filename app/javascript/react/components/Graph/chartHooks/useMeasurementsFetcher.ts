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
  MILLISECONDS_IN_A_SECOND,
} from "../../../utils/timeRanges";
import { updateRangeDisplay } from "./updateRangeDisplay";

const INITIAL_EDGE_FETCH_MONTHS = 1;
const MILLISECONDS_IN_TWO_SECONDS = 2 * MILLISECONDS_IN_A_SECOND;

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
    console.log("[DEBUG] Finding missing ranges:", {
      requestedRange: {
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        durationMs: end - start,
      },
      fetchedRanges: fetchedTimeRanges.map((range) => ({
        start: new Date(range.start).toISOString(),
        end: new Date(range.end).toISOString(),
        durationMs: range.end - range.start,
      })),
    });

    if (!fetchedTimeRanges.length) {
      if (end - start > MILLISECONDS_IN_A_MONTH) {
        const chunks = [];
        let chunkEnd = end;

        while (chunkEnd > start) {
          const chunkStart = Math.max(
            start,
            chunkEnd - MILLISECONDS_IN_A_MONTH
          );
          chunks.push({
            start: chunkStart,
            end: chunkEnd,
          });
          chunkEnd = chunkStart;
        }

        console.log(
          "[DEBUG] Created initial chunks:",
          chunks.map((chunk) => ({
            start: new Date(chunk.start).toISOString(),
            end: new Date(chunk.end).toISOString(),
            durationMs: chunk.end - chunk.start,
          }))
        );

        return chunks;
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

  const updateExtremesAndDisplay = (
    start: number,
    end: number,
    trigger: string | undefined
  ) => {
    if (chartComponentRef?.current?.chart) {
      const chart = chartComponentRef.current.chart;
      const effectiveTrigger =
        trigger && trigger !== "none"
          ? trigger
          : lastFetchTriggerRef.current || "none";

      console.log("[DEBUG] Updating chart extremes:", {
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        durationMs: end - start,
        trigger: effectiveTrigger,
      });

      chart.xAxis[0].setExtremes(start, end, true, false, {
        trigger: effectiveTrigger,
      });
      updateRangeDisplay(
        rangeDisplayRef,
        start,
        end,
        effectiveTrigger === "calendarDay"
      );

      // Log actual chart extremes after update
      const actualExtremes = chart.xAxis[0].getExtremes();
      console.log("[DEBUG] Actual chart extremes after update:", {
        min: new Date(actualExtremes.min).toISOString(),
        max: new Date(actualExtremes.max).toISOString(),
        durationMs: actualExtremes.max - actualExtremes.min,
      });
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

    if (trigger) {
      lastFetchTriggerRef.current = trigger;
      pendingSetExtremesRef.current = { start, end };
    }

    const boundedStart = Math.max(start, sessionStartTime);
    const boundedEnd = Math.min(end, sessionEndTime);

    console.log("[DEBUG] fetchMeasurementsIfNeeded called:", {
      requestedRange: {
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
      },
      boundedRange: {
        start: new Date(boundedStart).toISOString(),
        end: new Date(boundedEnd).toISOString(),
      },
      isEdgeFetch,
      isDaySelection,
      trigger,
    });

    if (boundedStart >= boundedEnd) {
      console.log("[DEBUG] Skipping fetch: boundedStart >= boundedEnd");
      return;
    }

    try {
      isCurrentlyFetchingRef.current = true;

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
        const missingRanges = findMissingRanges(boundedStart, boundedEnd);

        console.log(
          "[DEBUG] Missing ranges to fetch:",
          missingRanges.map((range) => ({
            start: new Date(range.start).toISOString(),
            end: new Date(range.end).toISOString(),
            durationMs: range.end - range.start,
          }))
        );

        if (missingRanges.length === 0) {
          console.log("[DEBUG] No missing ranges to fetch");
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

        // Process all ranges in parallel for efficiency
        const fetchPromises = missingRanges.map(async (range) => {
          let fetchStart = range.start;
          let fetchEnd = range.end;

          if (isDaySelection) {
            const paddedStart = Math.max(
              sessionStartTime,
              fetchStart - MILLISECONDS_IN_A_DAY * 2
            );
            const paddedEnd = Math.min(
              sessionEndTime,
              fetchEnd + MILLISECONDS_IN_A_DAY - MILLISECONDS_IN_TWO_SECONDS
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

          console.log("[DEBUG] Fetching range:", {
            original: {
              start: new Date(range.start).toISOString(),
              end: new Date(range.end).toISOString(),
            },
            adjusted: {
              start: new Date(fetchStart).toISOString(),
              end: new Date(fetchEnd).toISOString(),
              durationMs: fetchEnd - fetchStart,
            },
          });

          const result = await dispatch(
            fetchMeasurements({
              streamId: Number(streamId),
              startTime: Math.floor(fetchStart).toString(),
              endTime: Math.floor(fetchEnd).toString(),
            })
          ).unwrap();

          console.log("[DEBUG] Fetch result:", {
            dataPoints: result?.length || 0,
            fetchRange: {
              start: new Date(fetchStart).toISOString(),
              end: new Date(fetchEnd).toISOString(),
            },
          });

          if (result && result.length > 0) {
            dispatch(
              updateFetchedTimeRanges({
                streamId,
                start: fetchStart,
                end: fetchEnd,
              })
            );

            // Log updated fetchedTimeRanges
            console.log("[DEBUG] Updated fetched time ranges for chunk:", {
              added: {
                start: new Date(fetchStart).toISOString(),
                end: new Date(fetchEnd).toISOString(),
              },
            });
          }

          return { fetchStart, fetchEnd, resultLength: result?.length || 0 };
        });

        // Wait for all fetches to complete
        const results = await Promise.all(fetchPromises);

        console.log(
          "[DEBUG] All chunks fetched:",
          results.map((r) => ({
            start: new Date(r.fetchStart).toISOString(),
            end: new Date(r.fetchEnd).toISOString(),
            dataPoints: r.resultLength,
          }))
        );

        if (pendingSetExtremesRef.current) {
          const { start, end } = pendingSetExtremesRef.current;
          console.log("[DEBUG] Setting pending extremes:", {
            start: new Date(start).toISOString(),
            end: new Date(end).toISOString(),
          });

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
