import Highcharts from "highcharts/highstock";
import graphChevronLeft from "../../assets/icons/graphChevronLeft.svg";
import graphChevronRight from "../../assets/icons/graphChevronRight.svg";

const createCustomScrollbar = (chart: Highcharts.Chart, scrollbarContainer: HTMLElement) => {
  const chartWidth = chart.chartWidth;
  const scrollbarY = 1; // Positioning within the div

  // Clear existing content in the scrollbar container
  scrollbarContainer.innerHTML = '';

  const scrollbarGroup = chart.renderer.g('custom-scrollbar').add();

  const scrollbarBackground = chart.renderer.rect(60, scrollbarY, chartWidth - 120, 10)
    .attr({
      fill: '#eee',
      stroke: '#ccc',
      'stroke-width': 1,
    })
    .add(scrollbarGroup);

  const scrollbarThumb = chart.renderer.rect(60, scrollbarY, (chartWidth - 120) / 10, 10)
    .attr({
      fill: '#ccc',
      stroke: '#888',
      'stroke-width': 1,
      r: 5,
    })
    .add(scrollbarGroup);

  const leftButton = chart.renderer.rect(40, scrollbarY, 20, 10)
    .attr({
      fill: '#ccc',
      stroke: '#888',
      'stroke-width': 1,
      r: 5,
    })
    .add(scrollbarGroup);

  const rightButton = chart.renderer.rect(chartWidth - 60, scrollbarY, 20, 10)
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

  // Append the SVG elements to the scrollbar container
  scrollbarContainer.appendChild(scrollbarGroup.element);
};

export const handleLoad = function (this: Highcharts.Chart) {
  const chart = this;
  const scrollbarContainer = document.getElementById('scrollbar-container');
  if (scrollbarContainer) {
    createCustomScrollbar(chart, scrollbarContainer);
  }
};

export const handleRedraw = function (this: Highcharts.Chart) {
  const chart = this;
  const scrollbarContainer = document.getElementById('scrollbar-container');
  if (scrollbarContainer) {
    createCustomScrollbar(chart, scrollbarContainer);
  }
};
