import {
  AlignValue,
  ChartOptions,
  ChartZoomingOptions,
  NavigatorOptions,
  PlotOptions,
  RangeSelectorOptions,
  ResponsiveOptions,
  YAxisOptions,
} from "highcharts";
import { debounce } from "lodash";

import Highcharts from "highcharts/highstock";
import { TFunction } from "i18next";
import {
  blue,
  disabledGraphButton,
  gray100,
  gray200,
  gray300,
  gray400,
  green100,
  orange100,
  red100,
  white,
  yellow100,
} from "../../assets/styles/colors";
import { AppDispatch } from "../../store";
import { updateFixedMeasurementExtremes } from "../../store/fixedStreamSlice";
import { setHoverPosition, setHoverStreamId } from "../../store/mapSlice";
import { updateMobileMeasurementExtremes } from "../../store/mobileStreamSlice";
import { LatLngLiteral } from "../../types/googleMaps";
import { GraphData, GraphPoint } from "../../types/graph";
import { Thresholds } from "../../types/thresholds";
import {
  MILLISECONDS_IN_A_5_MINUTES,
  MILLISECONDS_IN_A_DAY,
  MILLISECONDS_IN_A_MONTH,
  MILLISECONDS_IN_A_SECOND,
  MILLISECONDS_IN_A_WEEK,
  MILLISECONDS_IN_AN_HOUR,
} from "../../utils/timeRanges";
import {
  generateTimeRangeHTML,
  updateRangeDisplayDOM,
} from "./chartHooks/useChartUpdater";

const getScrollbarOptions = (isCalendarPage: boolean, isMobile: boolean) => {
  return {
    barBackgroundColor: gray200,
    barBorderWidth: 0,
    button: {
      enabled: false,
    },
    height: isMobile ? 16 : 8,
    trackBackgroundColor: gray100,
    trackBorderWidth: 0,
    autoHide: false,
    showFull: true,
    enabled: isMobile && isCalendarPage ? true : !isMobile,
    liveRedraw: true,
    minWidth: isMobile ? 30 : 8,
    rifleColor: gray200,
    zIndex: 3,
    margin: 0,
    minimumRange: MILLISECONDS_IN_A_SECOND,
  };
};

const getXAxisOptions = (
  isMobile: boolean,
  rangeDisplayRef: React.RefObject<HTMLDivElement> | undefined,
  fixedSessionTypeSelected: boolean,
  dispatch: AppDispatch,
  isLoading: boolean,
  fetchMeasurementsIfNeeded: (start: number, end: number) => Promise<void>,
  streamId: number | null,
  onDayClick?: (date: Date | null) => void
): Highcharts.XAxisOptions => {
  let isFetchingData = false;
  let initialDataMin: number | null = null;
  let fetchTimeout: NodeJS.Timeout | null = null;

  const shouldFetchData = (
    min: number,
    max: number,
    dataMin: number,
    dataMax: number,
    chart: Highcharts.Chart
  ) => {
    const buffer = (max - min) * 0.02;
    const isAtDataMin = min <= dataMin + buffer;
    const isRangeTooBig = max - min > MILLISECONDS_IN_A_MONTH;

    // Check if there are points in the current view range
    const series = chart.series[0];
    const points = series.points || [];
    const visiblePoints = points.filter(
      (point) => point.x >= min && point.x <= max
    );

    const hasMissingData =
      visiblePoints.length === 0 ||
      (visiblePoints.length > 0 &&
        (min < visiblePoints[0].x ||
          max > visiblePoints[visiblePoints.length - 1].x));

    console.log("Data fetch check:", {
      isAtDataMin,
      isRangeTooBig,
      pointsInRange: visiblePoints.length,
      hasMissingData,
      currentRange: {
        start: new Date(min).toISOString(),
        end: new Date(max).toISOString(),
      },
      dataRange: {
        start: new Date(dataMin).toISOString(),
        end: new Date(dataMax).toISOString(),
      },
      firstPoint: visiblePoints[0]?.x
        ? new Date(visiblePoints[0].x).toISOString()
        : null,
      lastPoint: visiblePoints[visiblePoints.length - 1]?.x
        ? new Date(visiblePoints[visiblePoints.length - 1].x).toISOString()
        : null,
    });

    return (isAtDataMin || hasMissingData) && !isRangeTooBig;
  };

  const handleSetExtremes = debounce(
    (e: Highcharts.AxisSetExtremesEventObject) => {
      if (!isLoading && e.min !== undefined && e.max !== undefined) {
        if (fixedSessionTypeSelected && streamId !== null) {
          dispatch(
            updateFixedMeasurementExtremes({
              streamId,
              min: e.min,
              max: e.max,
            })
          );
        } else {
          dispatch(
            updateMobileMeasurementExtremes({
              min: e.min,
              max: e.max,
            })
          );
        }

        if (rangeDisplayRef?.current) {
          const htmlContent = generateTimeRangeHTML(e.min, e.max);
          updateRangeDisplayDOM(rangeDisplayRef.current, htmlContent, true);
        }
      }
    },
    300
  );

  return {
    title: {
      text: undefined,
    },
    showEmpty: false,
    showLastLabel: !isMobile,
    tickColor: gray200,
    lineColor: white,
    type: "datetime",
    labels: {
      enabled: true,
      overflow: "justify",
      step: 1,
      style: {
        fontSize: "1.2rem",
        fontFamily: "Roboto",
      },
    },
    crosshair: {
      color: white,
      width: 2,
    },
    visible: true,
    minRange: MILLISECONDS_IN_A_SECOND,
    ordinal: false,
    events: {
      afterSetExtremes: async function (
        e: Highcharts.AxisSetExtremesEventObject
      ) {
        const axis = this;
        const chart = axis.chart;
        handleSetExtremes(e);

        console.log("afterSetExtremes:", {
          trigger: e.trigger,
          min: new Date(e.min).toISOString(),
          max: new Date(e.max).toISOString(),
          minTimestamp: e.min,
          maxTimestamp: e.max,
          dataMin: e.dataMin ? new Date(e.dataMin).toISOString() : null,
          dataMax: e.dataMax ? new Date(e.dataMax).toISOString() : null,
        });

        if (
          e.trigger &&
          ["pan", "navigator", "scrollbar"].includes(e.trigger)
        ) {
          onDayClick?.(null);
        }

        if (!fixedSessionTypeSelected || streamId == null) return;
        if (isFetchingData || isLoading) return;
        if (e.dataMin === undefined || e.dataMax === undefined) return;

        if (initialDataMin === null) {
          initialDataMin = e.dataMin - MILLISECONDS_IN_A_MONTH;
          console.log("Setting initialDataMin:", {
            value: new Date(initialDataMin).toISOString(),
            timestamp: initialDataMin,
          });
        }

        if (e.trigger === "scrollbar" || e.trigger === "navigator") {
          if (fetchTimeout) clearTimeout(fetchTimeout);
          fetchTimeout = setTimeout(async () => {
            const { min, max, dataMin, dataMax } = axis.getExtremes();

            console.log("Scrollbar movement:", {
              min: new Date(min).toISOString(),
              max: new Date(max).toISOString(),
              dataMin: new Date(dataMin).toISOString(),
              dataMax: new Date(dataMax).toISOString(),
            });

            if (shouldFetchData(min, max, dataMin, dataMax, chart)) {
              isFetchingData = true;
              try {
                const newStart = min - MILLISECONDS_IN_A_MONTH;
                console.log("Fetching new data:", {
                  start: new Date(newStart).toISOString(),
                  end: new Date(min).toISOString(),
                });
                await fetchMeasurementsIfNeeded(newStart, min);
              } finally {
                isFetchingData = false;
                fetchTimeout = null;
              }
            } else {
              console.log("No need to fetch data");
            }
          }, 300);
        }
      },
    },
  };
};

const getYAxisOptions = (
  thresholdsState: Thresholds,
  isMobile: boolean = false
): YAxisOptions => {
  const min = Number(thresholdsState.min);
  const max = Number(thresholdsState.max);
  const low = Number(thresholdsState.low);
  const middle = Number(thresholdsState.middle);
  const high = Number(thresholdsState.high);

  const tickInterval = (max - min) / 4;

  return {
    title: {
      text: undefined,
    },
    endOnTick: false,
    startOnTick: true,
    tickColor: gray200,
    lineColor: white,
    opposite: true,
    tickWidth: 1,
    tickLength: isMobile ? 0 : 25,
    minorGridLineWidth: 0,
    showLastLabel: true,
    tickInterval: tickInterval,
    tickPosition: "inside",
    offset: isMobile ? 0 : 25,
    labels: {
      enabled: true,
      style: {
        fontFamily: "Roboto",
        fontSize: "1.2rem",
        align: "right",
      },
    },
    gridLineWidth: 0,
    minPadding: 0,
    min: min,
    max: max,
    plotBands: [
      {
        from: min,
        to: low,
        color: green100,
      },
      {
        from: low,
        to: middle,
        color: yellow100,
      },
      {
        from: middle,
        to: high,
        color: orange100,
      },
      {
        from: high,
        to: max,
        color: red100,
      },
    ],
  };
};

const getPlotOptions = (
  fixedSessionTypeSelected: boolean,
  streamId: number | null,
  dispatch: any,
  isIndoorParameterInUrl: boolean
): PlotOptions => {
  const handleMouseOver = function (this: Highcharts.Point) {
    if (!isIndoorParameterInUrl) {
      const position: LatLngLiteral = (this as GraphPoint).position;
      if (fixedSessionTypeSelected) {
        dispatch(setHoverStreamId(streamId));
      } else {
        dispatch(setHoverPosition(position));
      }
    }
  };

  const handleMouseOut = () => {
    if (!isIndoorParameterInUrl) {
      dispatch(setHoverStreamId(null));
      dispatch(setHoverPosition({ lat: 0, lng: 0 }));
    }
  };

  return {
    series: {
      lineWidth: 2,
      color: blue,
      turboThreshold: 9999999, // above that graph will not display

      marker: {
        fillColor: blue,
        lineWidth: 0,
        lineColor: blue,
        radius: 3,
      },
      states: {
        hover: {
          halo: {
            attributes: {
              fill: blue,
              "stroke-width": 2,
            },
          },
        },
      },
      dataGrouping: {
        enabled: true,
        approximation: "average",
        groupPixelWidth: 5,
        units: [
          ["millisecond", []],
          ["second", [2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 30, 40, 50]],
          ["minute", [1, 2, 3, 4, 5]],
        ],
      },
      dataLabels: {
        allowOverlap: true,
      },
      point: {
        events: {
          mouseOver: handleMouseOver,
          mouseOut: handleMouseOut,
        },
      },
    },
  };
};

const seriesOptions = (data: GraphData) => ({
  type: "spline",
  color: white,
  data: data,
  tooltip: {
    valueDecimals: 2,
  },
});

const legendOption = {
  enabled: false,
};

const getResponsiveOptions = (
  thresholdsState: Thresholds,
  isMobile: boolean
): ResponsiveOptions => {
  return {
    rules: [
      {
        condition: {
          maxWidth: 1024,
        },
        chartOptions: {
          yAxis: getYAxisOptions(thresholdsState, isMobile),
          credits: {
            enabled: false,
          },
        },
      },
    ],
  };
};

const getTooltipOptions = (
  measurementType: string,
  unitSymbol: string
): Highcharts.TooltipOptions => ({
  enabled: true,
  formatter: function (this: Highcharts.TooltipFormatterContextObject): string {
    const date = Highcharts.dateFormat("%m/%d/%Y", Number(this.x));
    const time = Highcharts.dateFormat("%H:%M:%S", Number(this.x));
    const pointData = this.points ? this.points[0] : this.point;
    let s = `<span>${date} `;
    s += Highcharts.dateFormat("%H:%M:%S", this.x as number) + "</span>";
    s +=
      "<br/>" +
      measurementType +
      " = " +
      Math.round(Number(pointData.y)) +
      " " +
      unitSymbol;
    return s;
  },
  borderWidth: 0,
  style: {
    fontSize: "1.2rem",
    fontFamily: "Roboto",
  },
});

const getRangeSelectorOptions = (
  isMobile: boolean,
  fixedSessionTypeSelected: boolean,
  totalDuration: number,
  selectedRange: number,
  isCalendarPage: boolean,
  t: TFunction<"translation", undefined>
): RangeSelectorOptions => {
  const baseMobileCalendarOptions: RangeSelectorOptions = {
    enabled: true,
    buttonPosition: {
      align: "center" as AlignValue,
      y: -85,
    },
    buttonTheme: {
      fill: "none",
      width: 80,
      height: 34,
      r: 20,
      stroke: "none",
      "stroke-width": 1,
      style: {
        fontFamily: "Roboto, sans-serif",
        fontSize: "1.4rem",
        color: gray300,
        fontWeight: "regular",
      },

      states: {
        hover: {
          fill: blue,
          style: {
            color: white,
          },
        },

        select: {
          fill: blue,
          style: {
            color: white,
            fontWeight: "bold",
          },
        },

        disabled: {
          style: {
            color: disabledGraphButton,
            cursor: "default",
          },
        },
      },
    },
    labelStyle: {
      display: "none",
    },
    buttonSpacing: 10,
    inputEnabled: false,
  };
  const baseOptions: RangeSelectorOptions = {
    enabled: isMobile ? false : true,
    buttonPosition: {
      align: "right" as AlignValue,
      x: -32,
      y: 50,
    },
    buttonTheme: {
      fill: "rgba(255, 255, 255, 0.8)",
      width: 90,
      r: 5,
      style: {
        fontFamily: "Roboto, sans-serif",
        fontSize: "1.4rem",
        color: gray300,
        fontWeight: "regular",
      },
      states: {
        hover: {
          fill: white,
          style: {
            color: gray400,
            fontWeight: "regular",
          },
        },
        select: {
          fill: white,
          style: {
            color: gray400,
            fontWeight: "regular",
          },
        },
      },
    },
    labelStyle: {
      display: "none",
    },
    buttonSpacing: 10,
    inputEnabled: false,
  };

  if (isCalendarPage && isMobile) {
    return {
      ...baseMobileCalendarOptions,
      buttons: [
        { type: "hour", count: 24, text: t("graph.24Hours") },
        totalDuration > MILLISECONDS_IN_A_WEEK
          ? { type: "day", count: 7, text: t("graph.oneWeek") }
          : { type: "all", text: t("graph.oneWeek") },
        totalDuration > MILLISECONDS_IN_A_MONTH
          ? { type: "week", count: 4, text: t("graph.oneMonth") }
          : { type: "all", text: t("graph.oneMonth") },
      ],
      allButtonsEnabled: true,
      selected: selectedRange,
    };
  } else {
    if (fixedSessionTypeSelected) {
      return {
        ...baseOptions,
        buttons: [
          totalDuration < MILLISECONDS_IN_A_DAY
            ? { type: "all", text: t("graph.24Hours") }
            : { type: "hour", count: 24, text: t("graph.24Hours") },
          totalDuration > MILLISECONDS_IN_A_WEEK
            ? { type: "day", count: 7, text: t("graph.oneWeek") }
            : { type: "all", text: t("graph.oneWeek") },
          totalDuration > MILLISECONDS_IN_A_MONTH
            ? { type: "week", count: 4, text: t("graph.oneMonth") }
            : { type: "all", text: t("graph.oneMonth") },
        ],
        allButtonsEnabled: true,
        selected: selectedRange,
      };
    } else {
      return {
        ...baseOptions,
        buttons: [
          totalDuration < MILLISECONDS_IN_A_5_MINUTES
            ? { type: "all", text: t("graph.fiveMinutes") }
            : { type: "minute", count: 5, text: t("graph.fiveMinutes") },
          totalDuration < MILLISECONDS_IN_AN_HOUR
            ? { type: "all", text: t("graph.oneHour") }
            : { type: "minute", count: 60, text: t("graph.oneHour") },
          { type: "all", text: t("graph.all") },
        ],
        allButtonsEnabled: true,
        selected: selectedRange,
      };
    }
  }
};

const getChartOptions = (
  isCalendarPage: boolean,
  isMobile: boolean
): ChartOptions => {
  const zoomingConfig: ChartZoomingOptions = {
    type: "x",
    resetButton: { theme: { style: { display: "none" } } },
  };

  const chartHeight = isCalendarPage || !isMobile ? 300 : 150;

  const chartMargin = isMobile
    ? isCalendarPage
      ? [5, 10, 5, 0]
      : [5, 0, 5, 0]
    : isCalendarPage
    ? [0, 30, 5, 0]
    : [0, 60, 5, 0];

  const scrollablePlotAreaConfig = { minWidth: 100, scrollPositionX: 1 };

  return {
    zooming: zoomingConfig,
    height: chartHeight,
    margin: chartMargin,
    animation: false,
    scrollablePlotArea: scrollablePlotAreaConfig,
  };
};

const getNavigatorOptions = (): NavigatorOptions => {
  // The navigator is not visible in the graph component.
  // However it is important to keep it to make sure that scrollbar will not disapear forever while fetching data.
  return {
    enabled: true,
    height: 0,
  };
};

export {
  getChartOptions,
  getNavigatorOptions,
  getPlotOptions,
  getRangeSelectorOptions,
  getResponsiveOptions,
  getScrollbarOptions,
  getTooltipOptions,
  getXAxisOptions,
  getYAxisOptions,
  legendOption,
  seriesOptions,
};
