import Highcharts from "highcharts";
import { useCallback, useEffect, useRef } from "react";
import {
  resetFixedMeasurementExtremes,
  resetTimeRange,
  updateFixedMeasurementExtremes,
} from "../../../../store/fixedStreamSlice";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import { updateMobileMeasurementExtremes } from "../../../../store/mobileStreamSlice";

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
  fixedSessionTypeSelected: boolean;
  streamId: number | null;
}

export const useChartUpdater = ({
  chartComponentRef,
  seriesData,
  isLoading,
  fixedSessionTypeSelected,
  streamId,
}: UseChartUpdaterProps) => {
  const dispatch = useAppDispatch();
  const lastSelectedTimeRange = useAppSelector((state) =>
    fixedSessionTypeSelected
      ? state.fixedStream.lastSelectedTimeRange
      : state.mobileStream.lastSelectedTimeRange
  );
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTriggerRef = useRef<string | null>(null);
  const hasInitializedRef = useRef<boolean>(false);

  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (
      chartComponentRef.current?.chart &&
      seriesData &&
      seriesData.length > 0 &&
      streamId
    ) {
      const chart = chartComponentRef.current.chart;
      if (chart.xAxis[0]) {
        const { min, max } = chart.xAxis[0].getExtremes();
        if (min !== undefined && max !== undefined) {
          setTimeout(() => {
            if (fixedSessionTypeSelected) {
              dispatch(
                updateFixedMeasurementExtremes({
                  streamId,
                  min,
                  max,
                })
              );
            } else {
              dispatch(
                updateMobileMeasurementExtremes({
                  min,
                  max,
                })
              );
            }
            hasInitializedRef.current = true;
          }, 100);
        }
      }
    }
  }, [seriesData, isLoading, fixedSessionTypeSelected, streamId, dispatch]);

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

      if (chart.xAxis[0]) {
        const { min, max } = chart.xAxis[0].getExtremes();
        if (min !== undefined && max !== undefined) {
          if (fixedSessionTypeSelected && streamId) {
            dispatch(
              updateFixedMeasurementExtremes({
                streamId,
                min,
                max,
              })
            );
          } else {
            dispatch(
              updateMobileMeasurementExtremes({
                min,
                max,
              })
            );
          }
          hasInitializedRef.current = true;
        }
      }
    },
    [fixedSessionTypeSelected, streamId, dispatch]
  );

  useEffect(() => {
    return () => {
      dispatch(resetTimeRange());
      if (fixedSessionTypeSelected && streamId) {
        dispatch(resetFixedMeasurementExtremes());
      }
    };
  }, [fixedSessionTypeSelected, streamId, dispatch]);

  return {
    updateChartData,
    lastTriggerRef,
  };
};
