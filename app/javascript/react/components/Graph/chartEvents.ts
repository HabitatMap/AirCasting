import Highcharts from "highcharts/highstock";
import graphChevronLeft from "../../assets/icons/graphChevronLeft.svg";
import graphChevronRight from "../../assets/icons/graphChevronRight.svg";

const addNavigationArrows = (chart: Highcharts.Chart) => {
  const chartWidth = chart.chartWidth;
  const chartHeight = chart.chartHeight;

  // Remove existing arrows if any
  chart.renderer.boxWrapper.element
    .querySelectorAll('.custom-arrow')
    .forEach((el) => el.remove());

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

  const move = (direction: 'left' | 'right') => {
    const axis = chart.xAxis[0];
    const { min, max, dataMin, dataMax } = axis.getExtremes();
    const range = max - min;
    const newMin = direction === 'left' ? Math.max(dataMin, min - range * 0.1) : Math.min(dataMax - range, min + range * 0.1);
    const newMax = direction === 'left' ? Math.max(dataMin + range, max - range * 0.1) : Math.min(dataMax, max + range * 0.1);
    axis.setExtremes(newMin, newMax);
  };

  const toggleElements = (display: 'none' | 'block') => {
    const elements = ['.highcharts-tooltip', '.highcharts-point', '.highcharts-crosshair', '.highcharts-halo'];
    elements.forEach(selector => {
      const element = chart.container.querySelector(selector) as HTMLElement;
      if (element) element.style.display = display;
    });
  };

  leftArrow.on('click', () => move('left'));
  rightArrow.on('click', () => move('right'));

  leftArrow.on('mouseover', () => toggleElements('none'));
  leftArrow.on('mouseout', () => toggleElements('block'));
  rightArrow.on('mouseover', () => toggleElements('none'));
  rightArrow.on('mouseout', () => toggleElements('block'));
}

const handleLoad = function (this: Highcharts.Chart) {
  addNavigationArrows(this);
};

export { handleLoad };
