import Highcharts from "highcharts/highstock";
import graphChevronLeft from "../../assets/icons/graphChevronLeft.svg";
import graphChevronRight from "../../assets/icons/graphChevronRight.svg";

const createCustomScrollbar = (chart: Highcharts.Chart) => {
  const chartWidth = chart.chartWidth;
  const scrollbarY = 0; // Positioning the scrollbar higher above the chart

  // Remove existing custom scrollbar if any
  chart.renderer.boxWrapper.element.querySelectorAll('.highcharts-custom-scrollbar').forEach(el => el.remove());

  const scrollbarGroup = chart.renderer.g('custom-scrollbar').attr({ zIndex: 10 }).add();

  const scrollbarBackground = chart.renderer.rect(60, 0, chartWidth - chartWidth / 2, 10)
    .attr({
      fill: '#eee',
      stroke: '#ccc',
      'stroke-width': 1,
    })
    .add(scrollbarGroup);

  const scrollbarThumb = chart.renderer.rect(90, 0, (chartWidth - chartWidth / 2) / 10, 10)
    .attr({
      fill: '#ccc',
      stroke: '#888',
      'stroke-width': 1,
      r: 5,
    })
    .add(scrollbarGroup);

  const leftButton = chart.renderer.rect(30, 0, 20, 10)
    .attr({
      fill: '#ccc',
      stroke: '#888',
      'stroke-width': 1,
      r: 5,
      class: 'scrollbar-button'
    })
    .add(scrollbarGroup);

  const rightButton = chart.renderer.rect(60, 0, 20, 10)
    .attr({
      fill: '#ccc',
      stroke: '#888',
      'stroke-width': 1,
      r: 5,
      class: 'scrollbar-button'
    })
    .add(scrollbarGroup);

  // Add icons to the buttons
  const leftIcon = chart.renderer.image(graphChevronLeft, 35, 2, 10, 6).add(scrollbarGroup);
  const rightIcon = chart.renderer.image(graphChevronRight, 65, 2, 10, 6).add(scrollbarGroup);

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
  leftIcon.on('click', moveLeft);
  rightIcon.on('click', moveRight);

  scrollbarThumb.css({ cursor: 'pointer' }).on('mousedown', function (e: { preventDefault: () => void; pageX: any; }) {
    e.preventDefault();
    const startX = e.pageX;
    const { min, max } = chart.xAxis[0].getExtremes();
    const range = max - min;

    const onMouseMove = (e: MouseEvent) => {
      const delta = e.pageX - startX;
      const newMin = min + delta * range / (chartWidth - 120);
      const newMax = max + delta * range / (chartWidth - 120);
      console.log('Mouse move:', { delta, newMin, newMax });
      chart.xAxis[0].setExtremes(newMin, newMax);
      scrollbarThumb.attr({
        x: 90 + delta
      });
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

  // Remove existing arrows if any
  chart.renderer.boxWrapper.element.querySelectorAll('.custom-arrow').forEach(el => el.remove());

  const chartContainer = chart.container;
  const chartWidth = chartContainer.offsetWidth;
  const chartHeight = chart.chartHeight;

  const leftArrow = chart.renderer
    .image(graphChevronLeft, 20, chartHeight / 2 - 15, 30, 30)
    .attr({ zIndex: 10, class: 'custom-arrow' })
    .add();
  const rightArrow = chart.renderer
    .image(graphChevronRight, chartWidth - 80, chartHeight / 2 - 15, 30, 30)
    .attr({ zIndex: 10, class: 'custom-arrow' })
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

  // Remove existing scrollbar and arrows before adding new ones
  chart.renderer.boxWrapper.element.querySelectorAll('.highcharts-custom-scrollbar, .custom-arrow').forEach(el => el.remove());

  createCustomScrollbar(chart);

  const chartWidth = chart.chartWidth;
  const chartHeight = chart.chartHeight;

  const rightArrow = chart.renderer
    .image(graphChevronRight, chartWidth - 50, chartHeight / 2 - 15, 30, 30)
    .attr({ zIndex: 10, class: 'custom-arrow' })
    .add();

  rightArrow.on('click', function () {
    const axis = chart.xAxis[0];
    const { min, max } = axis.getExtremes();
    const range = max - min;
    axis.setExtremes(min + range * 0.1, max + range * 0.1);
  });
};

// Add event listeners to handle load and redraw
