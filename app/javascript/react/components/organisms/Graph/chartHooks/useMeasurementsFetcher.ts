import HighchartsReact from "highcharts-react-official";
import { useRef } from "react";
import { selectFetchedTimeRanges } from "../../../../store/fixedStreamSelectors";
import {
  fetchMeasurements,
  updateFetchedTimeRanges,
  updateFixedMeasurementExtremes,
} from "../../../../store/fixedStreamSlice";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import { updateMobileMeasurementExtremes } from "../../../../store/mobileStreamSlice";
import {
  MILLISECONDS_IN_A_DAY,
  MILLISECONDS_IN_A_MINUTE,
  MILLISECONDS_IN_A_MONTH,
  MILLISECONDS_IN_A_SECOND,
} from "../../../../utils/timeRanges";
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
  const lastFetchTriggerRef = useRef<string | null>(null);
  const pendingSetExtremesRef = useRef<{ start: number; end: number } | null>(
    null
  );
  const activeFetchesRef = useRef<number>(0);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchedRangeRef = useRef<{ start: number; end: number } | null>(
    null
  );
  const lastUpdateTimeRef = useRef<number>(0);

  const fetchedTimeRanges = useAppSelector((state) =>
    streamId ? selectFetchedTimeRanges(state, streamId) : []
  );

  const findMissingRanges = (start: number, end: number) => {
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

        return chunks;
      }
      return [{ start, end }];
    }

    const sortedRanges = [...fetchedTimeRanges].sort(
      (a, b) => a.start - b.start
    );

    const mergedRanges: { start: number; end: number }[] = [];

    if (sortedRanges.length > 0) {
      let currentRange = { ...sortedRanges[0] };

      for (let i = 1; i < sortedRanges.length; i++) {
        const nextRange = sortedRanges[i];
        if (nextRange.start <= currentRange.end + MILLISECONDS_IN_A_MINUTE) {
          currentRange.end = Math.max(currentRange.end, nextRange.end);
        } else {
          mergedRanges.push(currentRange);
          currentRange = { ...nextRange };
        }
      }

      mergedRanges.push(currentRange);
    }

    const gaps: { start: number; end: number }[] = [];
    let currentStart = start;

    for (const range of mergedRanges) {
      if (currentStart < range.start) {
        const gapEnd = Math.min(range.start, end);
        if (gapEnd - currentStart > MILLISECONDS_IN_A_MINUTE * 5) {
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

  const updateLoadingState = (increment: boolean) => {
    if (increment) {
      activeFetchesRef.current++;

      if (chartComponentRef?.current?.chart) {
        chartComponentRef.current.chart.showLoading(
          "Loading data from server..."
        );
      }
    } else {
      activeFetchesRef.current = Math.max(0, activeFetchesRef.current - 1);

      if (activeFetchesRef.current === 0) {
        // Clear any existing timeout
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }

        // Set a new timeout to hide loading indicator after a delay
        loadingTimeoutRef.current = setTimeout(() => {
          if (chartComponentRef?.current?.chart) {
            chartComponentRef.current.chart.hideLoading();
          }
          loadingTimeoutRef.current = null;
        }, 500);
      }
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

    // Guard against invalid time ranges
    if (start >= end || end - start < 1000) {
      return;
    }

    // Check if this exact range was just fetched recently
    const now = Date.now();
    if (
      lastFetchedRangeRef.current &&
      lastFetchedRangeRef.current.start === start &&
      lastFetchedRangeRef.current.end === end &&
      now - lastUpdateTimeRef.current < 500 &&
      trigger !== "initial"
    ) {
      return;
    }

    const boundedStart = Math.max(start, sessionStartTime);
    const boundedEnd = Math.min(end, sessionEndTime);

    // Additional guard for bounded range
    if (boundedStart >= boundedEnd) {
      return;
    }

    // Store this range as the last fetched range
    lastFetchedRangeRef.current = { start, end };
    lastUpdateTimeRef.current = now;

    // Add this specific check for the "allButtonClicked" trigger
    const isAllButtonClick = trigger === "allButtonClicked";

    // Special handling for "all" data request
    const totalSessionDuration = sessionEndTime - sessionStartTime;
    const isAllDataRequest =
      isAllButtonClick ||
      (trigger === "rangeSelectorButton" &&
        ((boundedEnd - boundedStart > MILLISECONDS_IN_A_MONTH / 2 &&
          boundedStart <= sessionStartTime + MILLISECONDS_IN_A_DAY &&
          boundedEnd >= sessionEndTime - MILLISECONDS_IN_A_DAY) ||
          boundedEnd - boundedStart > totalSessionDuration * 0.9)) ||
      (trigger === "navigator" &&
        boundedEnd - boundedStart > totalSessionDuration * 0.9);

    // Force fetch for initial loads and "all" data requests
    const shouldForceFetch =
      trigger === "initial" || isAllDataRequest || isAllButtonClick;

    // Find missing ranges first
    const missingRanges = findMissingRanges(boundedStart, boundedEnd);

    // Only show loading indicator if we have missing ranges to fetch or it's a forced fetch
    const shouldShowLoading = missingRanges.length > 0 || shouldForceFetch;

    if (!shouldShowLoading && !shouldForceFetch) {
      return;
    }

    try {
      isCurrentlyFetchingRef.current = true;

      if (shouldShowLoading) {
        updateLoadingState(true);
      }

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

          if (fixedSessionTypeSelected) {
            dispatch(
              updateFixedMeasurementExtremes({
                streamId,
                min: boundedStart,
                max: boundedEnd,
              })
            );
          } else {
            dispatch(
              updateMobileMeasurementExtremes({
                min: boundedStart,
                max: boundedEnd,
              })
            );
          }
        }
      } else {
        // Special handling for "all" data request - fetch entire session in chunks
        if (isAllDataRequest || isAllButtonClick) {
          if (isAllButtonClick) {
            try {
              // Show a clear loading state
              if (chartComponentRef?.current?.chart) {
                chartComponentRef.current.chart.showLoading(
                  "Loading all data..."
                );
              }

              // First, clear any existing tracked ranges for this stream
              // This ensures we'll fetch everything fresh
              if (streamId) {
                dispatch({
                  type: "fixedStream/clearFetchedTimeRanges",
                  payload: streamId,
                });
              }

              // Then fetch all data in chunks to ensure complete coverage
              const allRanges = [];
              let chunkStart = sessionStartTime;

              // Create chunks of reasonable size
              while (chunkStart < sessionEndTime) {
                const chunkEnd = Math.min(
                  chunkStart + MILLISECONDS_IN_A_MONTH,
                  sessionEndTime
                );

                allRanges.push({
                  start: chunkStart,
                  end: chunkEnd,
                });

                chunkStart = chunkEnd;
              }

              // Fetch all data sequentially to ensure order
              for (let i = 0; i < allRanges.length; i++) {
                const range = allRanges[i];

                const result = await dispatch(
                  fetchMeasurements({
                    streamId: Number(streamId),
                    startTime: Math.floor(range.start).toString(),
                    endTime: Math.floor(range.end).toString(),
                  })
                ).unwrap();

                if (result && result.length > 0) {
                  dispatch(
                    updateFetchedTimeRanges({
                      streamId,
                      start: range.start,
                      end: range.end,
                    })
                  );
                }
              }

              // After fetching all data, update measurement extremes for the entire session
              if (fixedSessionTypeSelected) {
                dispatch(
                  updateFixedMeasurementExtremes({
                    streamId,
                    min: sessionStartTime,
                    max: sessionEndTime,
                  })
                );
              } else {
                dispatch(
                  updateMobileMeasurementExtremes({
                    min: sessionStartTime,
                    max: sessionEndTime,
                  })
                );
              }

              // After fetching all data, force extremes update to show everything
              if (chartComponentRef?.current?.chart) {
                chartComponentRef.current.chart.xAxis[0].setExtremes(
                  sessionStartTime,
                  sessionEndTime,
                  true,
                  false
                );
              }

              // Skip the regular fetch logic since we've handled everything
              return;
            } catch (error) {}
          }
        }

        const visibleRange = boundedEnd - boundedStart;

        const fetchPadding = Math.min(
          visibleRange * 0.25, // 25% of the visible range
          MILLISECONDS_IN_A_DAY
        );

        const paddedStart = Math.max(
          sessionStartTime,
          boundedStart - fetchPadding
        );
        const paddedEnd = Math.min(sessionEndTime, boundedEnd + fetchPadding);

        const missingRanges = findMissingRanges(paddedStart, paddedEnd);

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

        // Process all ranges in parallel for efficiency
        const fetchPromises = missingRanges.map(async (range, index) => {
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

          return { fetchStart, fetchEnd, resultLength: result?.length || 0 };
        });

        // Wait for all fetches to complete before updating loading state
        if (fetchPromises.length > 0) {
          try {
            await Promise.all(fetchPromises);

            // Update measurement extremes after fetches complete
            if (streamId) {
              if (fixedSessionTypeSelected) {
                dispatch(
                  updateFixedMeasurementExtremes({
                    streamId,
                    min: boundedStart,
                    max: boundedEnd,
                  })
                );
              } else {
                dispatch(
                  updateMobileMeasurementExtremes({
                    min: boundedStart,
                    max: boundedEnd,
                  })
                );
              }
            }
          } catch (error) {}
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
      console.error("Error in fetchMeasurementsIfNeeded", error);
    } finally {
      isCurrentlyFetchingRef.current = false;
      pendingSetExtremesRef.current = null;

      if (shouldShowLoading) {
        updateLoadingState(false);
      }
    }
  };

  return { fetchMeasurementsIfNeeded };
};
