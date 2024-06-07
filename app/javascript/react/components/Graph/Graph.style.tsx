import styled from "styled-components";
import { media } from "../../utils/media";

const Container = styled.div`
  width: 100%;
  max-height: 20rem;
  position: relative; /* Add position relative to the container */
  font-family: "Roboto", sans-serif;

  @media ${media.smallDesktop} {
    width: 80%;
    flex-direction: column;
  }

  .highcharts-scrollbar {
    position: absolute;
    top: 0;
    z-index: 2;
    background-color: #f0f0f0;
    border: 1px solid #ccc;
    border-radius: 5px;
    padding: 5px;
    transform: translate(0px, 15px);
    width: 250px;
  }

  .highcharts-scrollbar-track {
    fill: none;
    stroke: #cccccc;
    stroke-width: 0;
    rx: 5px;
    ry: 5px;
    height: 8px;
    width: 250px;
  }

  .highcharts-scrollbar-thumb {
    fill: #d5d4d4;
    height: 8px;
    width: 250px;
    rx: 7px;
    ry: 7px;
    stroke: #cccccc;
    stroke-width: 0;
  }

  .highcharts-scrollbar-button {
    fill: #eee;
    stroke: #cccccc;
    stroke-width: 0;
    width: 9px;
    height: 9px;
    rx: 7px;
    ry: 7px;
  }

  .highcharts-scrollbar-arrow {
    fill: #333333;
  }
  .highcharts-scrollbar-rifles {
    display: none;
  }

  .highcharts-scrollbar-button {
    fill: #eee;
    stroke: #cccccc;
    stroke-width: 0;
    width: 13px;
    height: 13px;
    rx: 7px;
    ry: 7px;
  }
  .highcharts-scrollbar-button:first-child {
    transform: translateX(
      -13px
    ); /* Position the first button before the thumb */
  }

  .highcharts-scrollbar-button:last-child {
    transform: translateX(226px);
  }

  .highcharts-scrollbar-button:nth-child(4) {
    width: 256px; /* Set the width of the third child element to 20px */
  }
`;

export { Container };
