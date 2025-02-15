import Highcharts from "highcharts";
import { useCallback, useEffect, useRef } from "react";
import {
  resetFixedMeasurementExtremes,
  resetTimeRange,
  updateFixedMeasurementExtremes,
} from "../../../store/fixedStreamSlice";
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

export const updateRangeDisplayDOM = (
  element: HTMLDivElement,
  htmlContent: string,
  clearPrevious: boolean = false
) => {
  if (clearPrevious) {
    element.innerHTML = "";
  }

  requestAnimationFrame(() => {
    element.innerHTML = htmlContent;
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
      if (chart.rangeSelector) {
        const selectedButton = chart.options.rangeSelector?.selected;
        if (selectedButton !== undefined) {
          lastRangeRef.current = selectedButton;
        }
      }

      chart.series[0].setData(data, true, false, false);

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

      if (chart.rangeSelector && lastRangeRef.current !== null) {
        chart.rangeSelector.clickButton(lastRangeRef.current, true);
      }
    },
    [fixedSessionTypeSelected, streamId]
  );

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
        updateTimeRangeDisplay(min, max);
      }
    }
  }, [
    lastSelectedTimeRange,
    fixedSessionTypeSelected,
    streamId,
    updateTimeRangeDisplay,
  ]);

  useEffect(() => {
    if (!seriesData || isLoading || !chartComponentRef.current?.chart) return;

    const chart = chartComponentRef.current.chart;
    const { min, max } = chart.xAxis[0].getExtremes();
    if (min !== undefined && max !== undefined) {
      updateTimeRangeDisplay(min, max);
    }
  }, [seriesData, isLoading, updateTimeRangeDisplay]);

  useEffect(() => {
    return () => {
      dispatch(resetTimeRange());
      if (fixedSessionTypeSelected && streamId) {
        dispatch(resetFixedMeasurementExtremes());
      }
    };
  }, [fixedSessionTypeSelected, streamId]);

  useEffect(() => {
    if (!chartComponentRef.current?.chart) return;

    const chart = chartComponentRef.current.chart;

    // Reset to 24-hour range on initial load
    dispatch(resetTimeRange());

    if (chart.rangeSelector) {
      const dayIndex = getSelectedRangeIndex(
        FixedTimeRange.Day,
        fixedSessionTypeSelected
      );
      chart.rangeSelector.clickButton(dayIndex, true);
    }

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
        updateTimeRangeDisplay(min, max);
      }
    }
  }, [
    chartComponentRef,
    dispatch,
    fixedSessionTypeSelected,
    streamId,
    updateTimeRangeDisplay,
  ]);

  return {
    updateChartData,
  };
};
