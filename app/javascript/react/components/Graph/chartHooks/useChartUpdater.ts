import Highcharts from "highcharts";
import { useCallback, useEffect, useRef } from "react";
import { updateFixedMeasurementExtremes } from "../../../store/fixedStreamSlice";
import { useAppDispatch } from "../../../store/hooks";
import { FixedTimeRange, MobileTimeRange } from "../../../types/timeRange";
import { getSelectedRangeIndex } from "../../../utils/getTimeRange";

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
}

export const useChartUpdater = ({
  chartComponentRef,
  seriesData,
  isLoading,
  lastSelectedTimeRange,
  fixedSessionTypeSelected,
  streamId,
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

  return {
    updateChartData,
  };
};
