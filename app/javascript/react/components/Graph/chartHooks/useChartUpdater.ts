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
import { updateRangeDisplay } from "./updateRangeDisplay";

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

export const useChartUpdater = ({
  chartComponentRef,
  seriesData,
  isLoading,
  lastSelectedTimeRange,
  fixedSessionTypeSelected,
  streamId,
  rangeDisplayRef,
}: UseChartUpdaterProps) => {
  const dispatch = useAppDispatch();
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function without manual DOM manipulation
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      // Removed manual innerHTML clearing to let React handle DOM updates.
    };
  }, []);

  const updateChartData = useCallback(
    (
      chart: Highcharts.Chart & {
        rangeSelector?: {
          clickButton: (index: number, redraw?: boolean) => void;
        };
      },
      data: Highcharts.PointOptionsType[]
    ) => {
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
    },
    [fixedSessionTypeSelected, streamId]
  );

  const updateTimeRangeDisplay = useCallback(
    (min: number, max: number) => {
      if (!rangeDisplayRef?.current) return;

      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      updateTimeoutRef.current = setTimeout(() => {
        updateRangeDisplay(rangeDisplayRef, min, max);
      }, 0);
    },
    [rangeDisplayRef]
  );

  useEffect(() => {
    if (!chartComponentRef.current?.chart || isLoading) return;

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [chartComponentRef, isLoading]);

  useEffect(() => {
    if (!seriesData || isLoading || !chartComponentRef.current?.chart) return;

    const chart = chartComponentRef.current.chart;
    updateChartData(chart, seriesData);

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
      }
    }
  }, [lastSelectedTimeRange, fixedSessionTypeSelected, streamId]);

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
      }
    }
  }, [chartComponentRef, dispatch, fixedSessionTypeSelected, streamId]);

  return {
    updateChartData,
  };
};
