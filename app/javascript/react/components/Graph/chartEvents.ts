import Highcharts from "highcharts/highstock";
import graphChevronLeft from "../../assets/icons/graphChevronLeft.svg";
import graphChevronRight from "../../assets/icons/graphChevronRight.svg";

const DIRECTION_LEFT = "left";
const DIRECTION_RIGHT = "right";

const addNavigationArrows = (chart: Highcharts.Chart) => {
  const chartWidth = chart.chartWidth;
  const chartHeight = chart.chartHeight;

  const chevronHeight =
    window.innerWidth < 1025 ? chartHeight / 2 : chartHeight / 2 - 24;

  // Remove existing arrows if any
  chart.renderer.boxWrapper.element
    .querySelectorAll(".custom-arrow")
    .forEach((el) => el.remove());

  const leftArrow = chart.renderer
    .image(graphChevronLeft, 15, chevronHeight, 48, 48)
    .attr({ zIndex: 10, class: "custom-arrow" })
    .css({ cursor: "pointer" })
    .add();

  const rightArrow = chart.renderer
    .image(graphChevronRight, chartWidth - 118, chevronHeight, 48, 48)
    .attr({ zIndex: 10, class: "custom-arrow" })
    .css({ cursor: "pointer" })
    .add();

  const updateArrowStates = () => {
    const axis = chart.xAxis[0];
    const { min, max, dataMin, dataMax } = axis.getExtremes();

    if (min <= dataMin) {
      leftArrow.css({ cursor: "not-allowed", opacity: 0.5 });
    } else {
      leftArrow.css({ cursor: "pointer", opacity: 1 });
    }

    if (max >= dataMax) {
      rightArrow.css({ cursor: "not-allowed", opacity: 0.5 });
    } else {
      rightArrow.css({ cursor: "pointer", opacity: 1 });
    }
  };

  const move = (direction: typeof DIRECTION_LEFT | typeof DIRECTION_RIGHT) => {
    const axis = chart.xAxis[0];
    const { min, max, dataMin, dataMax } = axis.getExtremes();
    const range = max - min;
    let newMin, newMax;

    if (direction === DIRECTION_LEFT) {
      newMin = Math.max(dataMin, min - range * 0.1);
      newMax = Math.max(dataMin + range, max - range * 0.1);
    } else {
      newMin = Math.min(dataMax - range, min + range * 0.1);
      newMax = Math.min(dataMax, max + range * 0.1);
    }

    axis.setExtremes(newMin, newMax, true, false, {
      trigger: "syncExtremes",
    });

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

  leftArrow.on("click", () => {
    const cursorStyle = leftArrow.element.style.cursor;
    if (cursorStyle !== "not-allowed") {
      move(DIRECTION_LEFT);
    }
  });

  rightArrow.on("click", () => {
    const cursorStyle = rightArrow.element.style.cursor;
    if (cursorStyle !== "not-allowed") {
      move(DIRECTION_RIGHT);
    }
  });

  leftArrow.on("mouseover", () => toggleElements("none"));
  leftArrow.on("mouseout", () => toggleElements("block"));
  rightArrow.on("mouseover", () => toggleElements("none"));
  rightArrow.on("mouseout", () => toggleElements("block"));

  updateArrowStates();
};

const handleLoad = function (this: Highcharts.Chart) {
  addNavigationArrows(this);
};

export { handleLoad };
