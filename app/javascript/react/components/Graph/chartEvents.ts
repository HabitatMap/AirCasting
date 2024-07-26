import Highcharts from "highcharts/highstock";
import chevronLeft from "../../assets/icons/chevronLeft.svg";
import chevronRight from "../../assets/icons/chevronRight.svg";
import graphChevronLeft from "../../assets/icons/graphChevronLeft.svg";
import graphChevronRight from "../../assets/icons/graphChevronRight.svg";

const DIRECTION_LEFT = "left";
const DIRECTION_RIGHT = "right";

const addNavigationArrows = (
  chart: Highcharts.Chart,
  isCalendarPage: boolean
) => {
  let leftArrow: Highcharts.SVGElement;
  let rightArrow: Highcharts.SVGElement;

  const updateArrowStates = () => {
    const axis = chart.xAxis[0];
    const { min, max, dataMin, dataMax } = axis.getExtremes();

    leftArrow.css({
      cursor: min <= dataMin ? "not-allowed" : "pointer",
      opacity: min <= dataMin ? 0.5 : 1,
    });
    rightArrow.css({
      cursor: max >= dataMax ? "not-allowed" : "pointer",
      opacity: max >= dataMax ? 0.5 : 1,
    });
  };

  const move = (direction: typeof DIRECTION_LEFT | typeof DIRECTION_RIGHT) => {
    const axis = chart.xAxis[0];
    const { min, max, dataMin, dataMax } = axis.getExtremes();
    const range = max - min;
    const moveAmount = range * 0.1;

    const newMin =
      direction === DIRECTION_LEFT
        ? Math.max(dataMin, min - moveAmount)
        : Math.min(dataMax - range, min + moveAmount);
    const newMax =
      direction === DIRECTION_LEFT
        ? Math.max(dataMin + range, max - moveAmount)
        : Math.min(dataMax, max + moveAmount);

    axis.setExtremes(newMin, newMax, true, false, { trigger: "syncExtremes" });
    updateArrowStates();
  };

  const toggleElements = (display: "none" | "block") => {
    const elements = [
      ".highcharts-tooltip",
      ".highcharts-point",
      ".highcharts-crosshair",
      ".highcharts-halo",
    ];
    elements.forEach((selector) => {
      const element = chart.container.querySelector(selector) as HTMLElement;
      if (element) element.style.display = display;
    });
  };

  const createArrows = () => {
    const chartWidth = chart.chartWidth;
    const chartHeight = chart.chartHeight;
    const chevronHeight =
      window.innerWidth < 1025 ? chartHeight / 2 : chartHeight / 2 - 24;

    // Remove existing arrows if any
    chart.renderer.boxWrapper.element
      .querySelectorAll(".custom-arrow")
      .forEach((el) => el.remove());

    const leftIcon = isCalendarPage ? chevronLeft : graphChevronLeft;
    const rightIcon = isCalendarPage ? chevronRight : graphChevronRight;

    leftArrow = chart.renderer
      .image(leftIcon, isCalendarPage ? -60 : 15, chevronHeight, 48, 48)
      .attr({ zIndex: 10, class: "custom-arrow" })
      .css({ cursor: "pointer" })
      .add();

    rightArrow = chart.renderer
      .image(
        rightIcon,
        isCalendarPage ? chartWidth + 12 : chartWidth - 118,
        chevronHeight,
        48,
        48
      )
      .attr({ zIndex: 10, class: "custom-arrow" })
      .css({ cursor: "pointer" })
      .add();

    leftArrow.on("click", () => {
      if (leftArrow.element.style.cursor !== "not-allowed") {
        move(DIRECTION_LEFT);
      }
    });

    rightArrow.on("click", () => {
      if (rightArrow.element.style.cursor !== "not-allowed") {
        move(DIRECTION_RIGHT);
      }
    });

    leftArrow.on("mouseover", () => toggleElements("none"));
    leftArrow.on("mouseout", () => toggleElements("block"));
    rightArrow.on("mouseover", () => toggleElements("none"));
    rightArrow.on("mouseout", () => toggleElements("block"));

    updateArrowStates();

    Highcharts.addEvent(chart, "redraw", () => {
      updateArrowStates();
      leftArrow.attr({ y: chevronHeight });
      rightArrow.attr({
        x: isCalendarPage ? chart.chartWidth : chart.chartWidth - 118,
        y: chevronHeight,
      });
    });
  };

  createArrows();

  Highcharts.addEvent(chart, "resize", createArrows);
};

const handleLoad = function (this: Highcharts.Chart, isCalendarPage: boolean) {
  addNavigationArrows(this, isCalendarPage);
};

export { handleLoad };
