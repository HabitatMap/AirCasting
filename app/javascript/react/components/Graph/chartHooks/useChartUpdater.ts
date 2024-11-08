import Highcharts from "highcharts";
import { useCallback, useEffect, useRef } from "react";
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
}

interface ChartOperations {
  updateData: (
    chart: Highcharts.Chart & {
      rangeSelector?: {
        clickButton: (index: number, redraw?: boolean) => void;
      };
    },
    data: Highcharts.PointOptionsType[]
  ) => void;
  applyRange: (
    chart: Highcharts.Chart & {
      rangeSelector?: {
        clickButton: (index: number, redraw?: boolean) => void;
      };
    }
  ) => void;
}

export const useChartUpdater = ({
  chartComponentRef,
  seriesData,
  isLoading,
  lastSelectedTimeRange,
  fixedSessionTypeSelected,
}: UseChartUpdaterProps) => {
  const isFirstRender = useRef(true);

  const updateChartData: ChartOperations["updateData"] = useCallback(
    (chart, data) => {
      chart.series[0].setData(data, true, false, false);
    },
    []
  );

  const applySelectedRange: ChartOperations["applyRange"] = useCallback(
    (chart) => {
      if (!lastSelectedTimeRange || !chart.rangeSelector) return;

      const selectedIndex = getSelectedRangeIndex(
        lastSelectedTimeRange,
        fixedSessionTypeSelected
      );
      chart.rangeSelector.clickButton(selectedIndex, true);
    },
    [lastSelectedTimeRange, fixedSessionTypeSelected]
  );

  useEffect(() => {
    if (!seriesData || isLoading || !chartComponentRef.current?.chart) return;

    const chart = chartComponentRef.current.chart;

    if (isFirstRender.current) {
      updateChartData(chart, seriesData);
      isFirstRender.current = false;
    }

    applySelectedRange(chart);
  }, [seriesData, isLoading, updateChartData, applySelectedRange]);

  return {
    updateChartData,
    applySelectedRange,
  };
};
