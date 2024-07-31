import Highcharts from "highcharts/highstock";
import chevronLeft from "../../assets/icons/chevronLeft.svg";
import chevronRight from "../../assets/icons/chevronRight.svg";
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

    const iconSize = isCalendarPage && isMobile ? 32 : 48;

    // Position arrows based on isMobile and isCalendarPage
    const leftArrowY = isCalendarPage && isMobile ? 0 : chevronHeight;
    const rightArrowY = isCalendarPage && isMobile ? 0 : chevronHeight;
    const leftArrowX = isCalendarPage && isMobile ? -80 : 15;
    const rightArrowX =
      isCalendarPage && isMobile ? chartWidth - 80 : chartWidth - 118;

    leftArrow = chart.renderer
      .image(leftIcon, leftArrowX, leftArrowY, iconSize, iconSize)
      .attr({ zIndex: 10, class: "custom-arrow" })
      .css({ cursor: "pointer" })
      .add();

    rightArrow = chart.renderer
      .image(rightIcon, rightArrowX, rightArrowY, iconSize, iconSize)
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
      leftArrow.attr({ x: leftArrowX, y: leftArrowY });
      rightArrow.attr({
        x:
          isCalendarPage && isMobile
            ? chart.chartWidth - 80
            : chart.chartWidth - 118,
        y: rightArrowY,
      });
    });
  };

  createArrows();

  Highcharts.addEvent(chart, "resize", createArrows);
};

const handleLoad = function (
  this: Highcharts.Chart,
  isCalendarPage: boolean,
  isMobile: boolean
) {
  addNavigationArrows(this, isCalendarPage, isMobile);
};

export { handleLoad };
