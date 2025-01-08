import Highcharts from "highcharts";
import { useCallback, useEffect, useRef } from "react";
import { updateFixedMeasurementExtremes } from "../../../store/fixedStreamSlice";
import { useAppDispatch } from "../../../store/hooks";
import { FixedTimeRange, MobileTimeRange } from "../../../types/timeRange";

import { getSelectedRangeIndex } from "../../../utils/getTimeRange";
import { formatTimeExtremes } from "../../../utils/measurementsCalc";

interface UseChartUpdaterProps {
  chartComponentRef: React.RefObject<{
    chart: Highcharts.Chart & {
      rangeSelector?: {
        clickButton: (index: number, redraw?: boolean) => void;
      };
    };
  }>;
  seriesData: Highcharts.PointOptionsType[] | undefined;
  isLoading: boolean;
  lastSelectedTimeRange: FixedTimeRange | MobileTimeRange | null;
  fixedSessionTypeSelected: boolean;
  streamId: number | null;
  rangeDisplayRef?: React.RefObject<HTMLDivElement>;
}

// Create a utility function to generate HTML content
export const generateTimeRangeHTML = (min: number, max: number) => {
  const { formattedMinTime, formattedMaxTime } = formatTimeExtremes(min, max);
  return `
    <div class="time-container">
      <span class="date">${formattedMinTime.date || ""}</span>
      <span class="time">${formattedMinTime.time || ""}</span>
    </div>
    <span>-</span>
    <div class="time-container">
      <span class="date">${formattedMaxTime.date || ""}</span>
      <span class="time">${formattedMaxTime.time || ""}</span>
    </div>
  `.trim();
};

// Create a utility function to safely update the DOM
export const updateRangeDisplayDOM = (
  element: HTMLDivElement,
  htmlContent: string,
  clearPrevious: boolean = false
) => {
  if (clearPrevious) {
    element.innerHTML = "";
  }

  // Use requestAnimationFrame to ensure proper timing
  requestAnimationFrame(() => {
    element.innerHTML = htmlContent;
    // Force reflow
    void element.offsetHeight;
    void element.getBoundingClientRect();
  });
};

export const useChartUpdater = ({
  chartComponentRef,
  seriesData,
  isLoading,
  lastSelectedTimeRange,
  fixedSessionTypeSelected,
  streamId,
  rangeDisplayRef,
}: UseChartUpdaterProps) => {
  const isFirstRender = useRef(true);
  const lastRangeRef = useRef<number | null>(null);
  const dispatch = useAppDispatch();

  const updateChartData = useCallback(
    (
      chart: Highcharts.Chart & {
        rangeSelector?: {
          clickButton: (index: number, redraw?: boolean) => void;
        };
      },
      data: Highcharts.PointOptionsType[]
    ) => {
      // Store current range selection before updating data
      if (chart.rangeSelector) {
        const selectedButton = chart.options.rangeSelector?.selected;
        if (selectedButton !== undefined) {
          lastRangeRef.current = selectedButton;
        }
      }

      // Update the data
      chart.series[0].setData(data, true, false, false);

      // Update extremes based on visible range
      if (fixedSessionTypeSelected && streamId && chart.xAxis[0]) {
        const { min, max } = chart.xAxis[0].getExtremes();
        if (min !== undefined && max !== undefined) {
          dispatch(
            updateFixedMeasurementExtremes({
              streamId,
              min,
              max,
            })
          );
        }
      }

      // Reapply the range selection after data update
      if (chart.rangeSelector && lastRangeRef.current !== null) {
        chart.rangeSelector.clickButton(lastRangeRef.current, true);
      }
    },
    [dispatch, fixedSessionTypeSelected, streamId]
  );

  // Update time range display
  const updateTimeRangeDisplay = useCallback(
    (min: number, max: number) => {
      if (!rangeDisplayRef?.current) return;

      const htmlContent = generateTimeRangeHTML(min, max);
      updateRangeDisplayDOM(rangeDisplayRef.current, htmlContent, true);
    },
    [rangeDisplayRef]
  );

  useEffect(() => {
    if (!seriesData || isLoading || !chartComponentRef.current?.chart) return;

    const chart = chartComponentRef.current.chart;

    if (isFirstRender.current) {
      updateChartData(chart, seriesData);
      isFirstRender.current = false;
    } else {
      updateChartData(chart, seriesData);
    }

    // If we have a lastSelectedTimeRange, apply it
    if (lastSelectedTimeRange && chart.rangeSelector) {
      const selectedIndex = getSelectedRangeIndex(
        lastSelectedTimeRange,
        fixedSessionTypeSelected
      );
      chart.rangeSelector.clickButton(selectedIndex, true);
    }
  }, [
    seriesData,
    isLoading,
    updateChartData,
    lastSelectedTimeRange,
    fixedSessionTypeSelected,
  ]);

  // Add effect to handle time range changes for fixed streams only
  useEffect(() => {
    if (
      !chartComponentRef.current?.chart ||
      !lastSelectedTimeRange ||
      !fixedSessionTypeSelected
    )
      return;

    const chart = chartComponentRef.current.chart;
    const selectedIndex = getSelectedRangeIndex(
      lastSelectedTimeRange,
      fixedSessionTypeSelected
    );

    if (chart.rangeSelector) {
      chart.rangeSelector.clickButton(selectedIndex, true);
    }

    // Update extremes based on new range for fixed streams only
    if (chart.xAxis[0] && streamId) {
      const { min, max } = chart.xAxis[0].getExtremes();
      if (min !== undefined && max !== undefined) {
        dispatch(
          updateFixedMeasurementExtremes({
            streamId,
            min,
            max,
          })
        );
        // Update time range display
        updateTimeRangeDisplay(min, max);
      }
    }
  }, [
    lastSelectedTimeRange,
    fixedSessionTypeSelected,
    streamId,
    dispatch,
    updateTimeRangeDisplay,
  ]);

  // Also update time range display when data changes
  useEffect(() => {
    if (!seriesData || isLoading || !chartComponentRef.current?.chart) return;

    const chart = chartComponentRef.current.chart;
    const { min, max } = chart.xAxis[0].getExtremes();
    if (min !== undefined && max !== undefined) {
      updateTimeRangeDisplay(min, max);
    }
  }, [seriesData, isLoading, updateTimeRangeDisplay]);

  return {
    updateChartData,
  };
};
