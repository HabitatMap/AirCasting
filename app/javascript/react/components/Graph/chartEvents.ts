import Highcharts from "highcharts/highstock";

import graphChevronLeft from "../../assets/icons/graphChevronLeft.svg";
import graphChevronRight from "../../assets/icons/graphChevronRight.svg";

const addNavigationArrows = (
  chart: Highcharts.Chart,
  setTooltipVisible: React.Dispatch<React.SetStateAction<boolean>>
) => {
  // Remove existing arrows if any
  chart.renderer.boxWrapper.element
    .querySelectorAll('.custom-arrow')
    .forEach((el) => el.remove());

  const chartWidth = chart.chartWidth;
  const chartHeight = chart.chartHeight;

  const leftArrow = chart.renderer
    .image(graphChevronLeft, 30, chartHeight / 2, 30, 30)
    .attr({ zIndex: 10, class: 'custom-arrow' })
    .css({ cursor: 'pointer' })
    .add();

  const rightArrow = chart.renderer
    .image(graphChevronRight, chartWidth - 80, chartHeight / 2, 30, 30)
    .attr({ zIndex: 10, class: 'custom-arrow' })
    .css({ cursor: 'pointer' })
    .add();

  const moveLeft = () => {
    const axis = chart.xAxis[0];
    const { min, max, dataMin } = axis.getExtremes();
    const range = max - min;
    const newMin = Math.max(dataMin, min - range * 0.1);
    const newMax = Math.max(dataMin + range, max - range * 0.1);
    axis.setExtremes(newMin, newMax);
    updateArrowState();
  };

  const moveRight = () => {
    const axis = chart.xAxis[0];
    const { min, max, dataMax } = axis.getExtremes();
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
      leftArrow.element.onclick = null;
    } else {
      leftArrow.attr({ opacity: 1 }).css({ cursor: 'pointer' });
      leftArrow.element.onclick = moveLeft;
    }

    if (max >= dataMax) {
      rightArrow.attr({ opacity: 0.3 }).css({ cursor: 'not-allowed' });
      rightArrow.element.onclick = null;
    } else {
      rightArrow.attr({ opacity: 1 }).css({ cursor: 'pointer' });
      rightArrow.element.onclick = moveRight;
    }
  };

  updateArrowState();

  leftArrow.on('mouseover', () => {
    setTooltipVisible(false);
  });

  leftArrow.on('mouseout', () => {
    setTooltipVisible(true);
  });

  rightArrow.on('mouseover', () => {
    setTooltipVisible(false);
  });

  rightArrow.on('mouseout', () => {
    setTooltipVisible(true);
  });

  [leftArrow, rightArrow].forEach((arrow) => {
    arrow.element.addEventListener('mouseenter', (event) => {
      event.stopPropagation();
    });
    arrow.element.addEventListener('mouseleave', (event) => {
      event.stopPropagation();
    });
  });
};

const handleLoad = function (
  this: Highcharts.Chart,
  setTooltipVisible: React.Dispatch<React.SetStateAction<boolean>>
) {
  addNavigationArrows(this, setTooltipVisible);
};

const handleRedraw = function (
  this: Highcharts.Chart,
  setTooltipVisible: React.Dispatch<React.SetStateAction<boolean>>
) {
  addNavigationArrows(this, setTooltipVisible);
};

export { handleLoad, handleRedraw };
