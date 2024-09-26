// chartEvents.ts

import Highcharts from "highcharts/highstock";
import chevronLeft from "../../assets/icons/chevronLeftCircle.svg";
import chevronRight from "../../assets/icons/chevronRightCircle.svg";
import graphChevronLeft from "../../assets/icons/graphChevronLeft.svg";
import graphChevronRight from "../../assets/icons/graphChevronRight.svg";
import mobileChevronLeft from "../../assets/icons/mobileChevronLeft.svg";
import mobileChevronRight from "../../assets/icons/mobileChevronRight.svg";

const DIRECTION_LEFT = "left";
const DIRECTION_RIGHT = "right";

const addNavigationArrows = (
  chart: Highcharts.Chart,
  isCalendarPage: boolean,
  isMobile: boolean
) => {
  // Remove existing arrows to prevent duplicates
  chart.renderer.boxWrapper.element
    .querySelectorAll(".custom-arrow")
    .forEach((el) => el.remove());

  // Define arrow icons based on device and page type
  const leftIcon = isMobile
    ? mobileChevronLeft
    : isCalendarPage
    ? chevronLeft
    : graphChevronLeft;
  const rightIcon = isMobile
    ? mobileChevronRight
    : isCalendarPage
    ? chevronRight
    : graphChevronRight;

  // Define arrow dimensions and positions
  let iconSize = isMobile && isCalendarPage ? 40 : 48;
  let leftArrowX = isMobile && isCalendarPage ? 0 : 15;
  let rightArrowX =
    isMobile && isCalendarPage ? chart.chartWidth - 50 : chart.chartWidth - 118;
  let arrowY = isMobile && isCalendarPage ? -29 : chart.chartHeight / 2 - 24;

  // Create left arrow
  const leftArrow = chart.renderer
    .image(leftIcon, leftArrowX, arrowY, iconSize, iconSize)
    .attr({ zIndex: 10, class: "custom-arrow" })
    .css({ cursor: "pointer" })
    .add();

  // Create right arrow
  const rightArrow = chart.renderer
    .image(rightIcon, rightArrowX, arrowY, iconSize, iconSize)
    .attr({ zIndex: 10, class: "custom-arrow" })
    .css({ cursor: "pointer" })
    .add();

  // Define move functionality
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

  // Update arrow states based on axis extremes
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

  // Toggle visibility of chart elements when hovering over arrows
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

  // Event listeners for arrows
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

  // Initial state update
  updateArrowStates();

  // Update arrows on chart redraw
  Highcharts.addEvent(chart, "redraw", () => {
    updateArrowStates();
    leftArrow.attr({ x: leftArrowX, y: arrowY });
    rightArrow.attr({ x: rightArrowX, y: arrowY });
  });

  // Update arrows on chart resize
  Highcharts.addEvent(chart, "resize", () => {
    const newChartWidth = chart.chartWidth;
    const newChartHeight = chart.chartHeight;

    // Recalculate positions based on new dimensions
    const updatedLeftArrowX = isMobile && isCalendarPage ? 0 : 15;
    const updatedRightArrowX =
      isMobile && isCalendarPage ? newChartWidth - 50 : newChartWidth - 118;
    const updatedArrowY =
      isMobile && isCalendarPage ? -29 : newChartHeight / 2 - 24;

    leftArrow.attr({ x: updatedLeftArrowX, y: updatedArrowY });
    rightArrow.attr({ x: updatedRightArrowX, y: updatedArrowY });
  });
};

const handleLoad = function (
  this: Highcharts.Chart,
  isCalendarPage: boolean,
  isMobile: boolean
) {
  addNavigationArrows(this, isCalendarPage, isMobile);
};

export { handleLoad };
