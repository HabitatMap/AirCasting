import styled from "styled-components";

const Container = styled.div`
  width: 80%;
  max-height: 20rem;
  position: relative;
  font-family: "Roboto", sans-serif;

  .highcharts-scrollbar {
    position: absolute;
    top: 0;
    z-index: 2;
    background-color: #f0f0f0;
    border: 1px solid #ccc;
    border-radius: 5px;
    padding: 5px;
    transform: translate(0px, 15px);
    width: 150px; /* Set the width of the scrollbar */
    .highcharts-scrollbar-track {
      width: 150px;  importnat!/* Set the width of the scrollbar track */
    }
  }

  .highcharts-scrollbar-thumb {
    fill: #d5d4d4;
    height: 8px;
    width: 150px; /* Set the width of the scrollbar thumb */
    rx: 7px;
    ry: 7px;
    stroke: #cccccc;
    stroke-width: 0;
  }

  .highcharts-scrollbar-button {
    fill: #eee;
    stroke: #cccccc;
    stroke-width: 0;
    width: 75px; /* Set the width of the scrollbar buttons */
    height: 9px;
    rx: 7px;
    ry: 7px;
    g {
      rect {
        fill: #ccc;
        width: 20px;
        height: 9px;
        rx: 7px;
        ry: 7px;
        transform: translateX(5px);
      }
    }
  }

  .highcharts-scrollbar-button:first-child rect {
    transform: translateX(-13px);
  }
`;
export { Container };
