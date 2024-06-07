import Highcharts from "highcharts/highstock";
import graphChevronLeft from "../../assets/icons/graphChevronLeft.svg";
import graphChevronRight from "../../assets/icons/graphChevronRight.svg";

const createCustomScrollbar = (chart: Highcharts.Chart) => {
  const chartWidth = chart.chartWidth;
  const scrollbarY = 0; // Positioning the scrollbar higher above the chart

  // Remove existing custom scrollbar if any
  const existingScrollbarGroup = chart.renderer.boxWrapper.element.querySelector('.custom-scrollbar');
  if (existingScrollbarGroup) {
    const parentNode = existingScrollbarGroup.parentNode;
    if (parentNode) {
      parentNode.removeChild(existingScrollbarGroup);
    }
  }

  const scrollbarGroup = chart.renderer.g('custom-scrollbar').attr({ zIndex: 10 }).add();

  const scrollbarBackground = chart.renderer.rect(60, 0, chartWidth - 120, 10)
    .attr({
      fill: '#eee',
      stroke: '#ccc',
      'stroke-width': 1,
    })
    .add(scrollbarGroup);

  const scrollbarThumb = chart.renderer.rect(60, 0, (chartWidth - 120) / 10, 10)
    .attr({
      fill: '#ccc',
      stroke: '#888',
      'stroke-width': 1,
      r: 5,
    })
    .add(scrollbarGroup);

  const leftButton = chart.renderer.rect(40, 0, 20, 10)
    .attr({
      fill: '#ccc',
      stroke: '#888',
      'stroke-width': 1,
      r: 5,
    })
    .add(scrollbarGroup);

  const rightButton = chart.renderer.rect(chartWidth - 60, 0, 20, 10)
    .attr({
      fill: '#ccc',
      stroke: '#888',
      'stroke-width': 1,
      r: 5,
    })
    .add(scrollbarGroup);

  const moveLeft = () => {
    const axis = chart.xAxis[0];
    const { min, max } = axis.getExtremes();
    const range = max - min;
    axis.setExtremes(min - range * 0.1, max - range * 0.1);
  };

  const moveRight = () => {
    const axis = chart.xAxis[0];
    const { min, max } = axis.getExtremes();
    const range = max - min;
    axis.setExtremes(min + range * 0.1, max + range * 0.1);
  };

  leftButton.on('click', moveLeft);
  rightButton.on('click', moveRight);

  scrollbarThumb.css({ cursor: 'pointer' }).on('mousedown', function (e: { preventDefault: () => void; pageX: any; }) {
    e.preventDefault();
    const startX = e.pageX;
    const { min, max } = chart.xAxis[0].getExtremes();
    const range = max - min;

    const onMouseMove = (e: MouseEvent) => {
      const delta = e.pageX - startX;
      const newMin = min + delta * range / (chartWidth - 120);
      const newMax = max + delta * range / (chartWidth - 120);
      chart.xAxis[0].setExtremes(newMin, newMax);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });

  // Position the scrollbar group above the chart container
  scrollbarGroup.attr({
    translateY: scrollbarY,
  });
};

export const handleLoad = function (this: Highcharts.Chart) {
  const chart = this;
  const chartContainer = chart.container;
  const chartWidth = chartContainer.offsetWidth;
  const chartHeight = chart.chartHeight;

  const leftArrowUrl = graphChevronLeft;
  const rightArrowUrl = graphChevronRight;

  const leftArrow = chart.renderer
    .image(leftArrowUrl, 20, chartHeight / 2 - 15, 30, 30)
    .attr({ zIndex: 10 })
    .add();
  const rightArrow = chart.renderer
    .image(rightArrowUrl, chartWidth - 80, chartHeight / 2 - 15, 30, 30)
    .attr({ zIndex: 10 })
    .add();

  const moveLeft = () => {
    const axis = chart.xAxis[0];
    const { min, max } = axis.getExtremes();
    const range = max - min;
    axis.setExtremes(min - range * 0.1, max - range * 0.1);
  };

  const moveRight = () => {
    const axis = chart.xAxis[0];
    const { min, max } = axis.getExtremes();
    const range = max - min;
    axis.setExtremes(min + range * 0.1, max + range * 0.1);
  };

  leftArrow.on("click", moveLeft);
  rightArrow.on("click", moveRight);

  createCustomScrollbar(chart);
};

export const handleRedraw = function (this: Highcharts.Chart) {
  const chart = this;
  const chartWidth = chart.chartWidth;
  const chartHeight = chart.chartHeight;

  const rightArrow = chart.renderer
    .image(graphChevronRight, chartWidth - 50, chartHeight / 2 - 15, 30, 30)
    .attr({ zIndex: 10 })
    .add();

  rightArrow.on('click', function () {
    const axis = chart.xAxis[0];
    const { min, max } = axis.getExtremes();
    const range = max - min;
    axis.setExtremes(min + range * 0.1, max + range * 0.1);
  });

  createCustomScrollbar(chart);
};
