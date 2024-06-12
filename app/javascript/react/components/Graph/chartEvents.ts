import Highcharts from "highcharts/highstock";
import graphChevronLeft from "../../assets/icons/graphChevronLeft.svg";
import graphChevronRight from "../../assets/icons/graphChevronRight.svg";

const addNavigationArrows = (chart: Highcharts.Chart) => {
  // Remove existing arrows if any
  chart.renderer.boxWrapper.element.querySelectorAll('.custom-arrow').forEach(el => el.remove());

  const chartWidth = chart.chartWidth;
  const chartHeight = chart.chartHeight;

  const leftArrow = chart.renderer
    .image(graphChevronLeft, 20, chartHeight / 2, 30, 30)
    .attr({ zIndex: 10, class: 'custom-arrow' })
    .add();
  const rightArrow = chart.renderer
    .image(graphChevronRight, chartWidth - 80, chartHeight / 2, 30, 30)
    .attr({ zIndex: 10, class: 'custom-arrow' })
    .add();

  const moveLeft = () => {
    const axis = chart.xAxis[0];
    const { min, max, dataMin, dataMax } = axis.getExtremes();
    const range = max - min;
    const newMin = Math.max(dataMin, min - range * 0.1);
    const newMax = Math.max(dataMin + range, max - range * 0.1);
    axis.setExtremes(newMin, newMax);
    updateArrowState();
  };

  const moveRight = () => {
    const axis = chart.xAxis[0];
    const { min, max, dataMin, dataMax } = axis.getExtremes();
    const range = max - min;
    const newMin = Math.min(dataMax - range, min + range * 0.1);
    const newMax = Math.min(dataMax, max + range * 0.1);
    axis.setExtremes(newMin, newMax);
    updateArrowState();
  };

  const updateArrowState = () => {
    const axis = chart.xAxis[0];
    const { min, max, dataMin, dataMax } = axis.getExtremes();

    if (min <= dataMin) {
      leftArrow.attr({ opacity: 0.3 }).css({ cursor: 'not-allowed' });
      leftArrow.element.onclick = null; // Remove click event
    } else {
      leftArrow.attr({ opacity: 1 }).css({ cursor: 'pointer' });
      leftArrow.element.onclick = moveLeft; // Add click event
    }

    if (max >= dataMax) {
      rightArrow.attr({ opacity: 0.3 }).css({ cursor: 'not-allowed' });
      rightArrow.element.onclick = null; // Remove click event
    } else {
      rightArrow.attr({ opacity: 1 }).css({ cursor: 'pointer' });
      rightArrow.element.onclick = moveRight; // Add click event
    }
  };

  leftArrow.element.onclick = moveLeft;
  rightArrow.element.onclick = moveRight;

  updateArrowState();
};

export const handleLoad = function (this: Highcharts.Chart) {
  const chart = this;
  addNavigationArrows(chart);
};

export const handleRedraw = function (this: Highcharts.Chart) {
  const chart = this;
  addNavigationArrows(chart);
};
