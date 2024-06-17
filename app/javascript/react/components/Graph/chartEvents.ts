import Highcharts from "highcharts/highstock";
import graphChevronLeft from "../../assets/icons/graphChevronLeft.svg";
import graphChevronRight from "../../assets/icons/graphChevronRight.svg";

const addNavigationArrows = (
  chart: Highcharts.Chart,
  setTooltipVisible: React.Dispatch<React.SetStateAction<boolean>>
) => {
  let leftArrow: Highcharts.SVGElement;
  let rightArrow: Highcharts.SVGElement;

  // Remove existing arrows if any
  chart.renderer.boxWrapper.element
    .querySelectorAll('.custom-arrow')
    .forEach((el) => el.remove());

  const chartWidth = chart.chartWidth;
  const chartHeight = chart.chartHeight;

  leftArrow = chart.renderer
    .image(graphChevronLeft, 30, chartHeight / 2, 30, 30)
    .attr({ zIndex: 10, class: 'custom-arrow' })
    .css({ cursor: 'pointer' })
    .add();

  rightArrow = chart.renderer
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
  };

  const moveRight = () => {
    const axis = chart.xAxis[0];
    const { min, max, dataMax } = axis.getExtremes();
    const range = max - min;
    const newMin = Math.min(dataMax - range, min + range * 0.1);
    const newMax = Math.min(dataMax, max + range * 0.1);
    axis.setExtremes(newMin, newMax);
  };

  leftArrow.on('click', moveLeft);
  rightArrow.on('click', moveRight);

  // Handle tooltip visibility on arrow hover
  const handleArrowHover = (arrow: Highcharts.SVGElement, visible: boolean) => {
    if (!visible) {
      setTooltipVisible(false);
    } else {
      setTimeout(() => {
        const chartOffset = chart.container.getBoundingClientRect();
        const arrowBBox = arrow.getBBox();
        const arrowX = arrowBBox.x + arrowBBox.width / 2;
        const arrowY = arrowBBox.y + arrowBBox.height / 2;
        const mouseX = chartOffset.left + arrowX;
        const mouseY = chartOffset.top + arrowY;
        if (!chart.isInsidePlot(mouseX, mouseY)) {
          setTooltipVisible(true);
        }
      }, 200);
    }
  };

  leftArrow.on('mouseover', () => handleArrowHover(leftArrow, false));
  leftArrow.on('mouseout', () => handleArrowHover(leftArrow, true));

  rightArrow.on('mouseover', () => handleArrowHover(rightArrow, false));
  rightArrow.on('mouseout', () => handleArrowHover(rightArrow, true));
};

const handleLoad = function (
  this: Highcharts.Chart,
  setTooltipVisible: React.Dispatch<React.SetStateAction<boolean>>
) {
  addNavigationArrows(this, setTooltipVisible);
};

export { handleLoad };
