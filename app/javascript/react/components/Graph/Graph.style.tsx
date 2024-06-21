import styled from "styled-components";
import { media } from "../../utils/media";
import { gray200 } from "../../assets/styles/colors";

const Container = styled.div`
  width: 100%;
  position: relative;
  font-family: "Roboto", sans-serif;

  @media ${media.largeDesktop} {
    width: 77%;
  }

  .highcharts-root {
    .highcharts-scrollbar {
      border-radius: 5px;
      padding: 5px;
      transform: translate(1px, 15px);
    }

    .data-highcharts-chart {
      width: 100%;
    }

    .highcharts-scrollbar-track {
      transform: translate(0, 4px);
      width: 92%;
      align-self: center;
      @media ${media.smallDesktop} {
        width: 97%;
      }
    }

    .highcharts-scrollbar-thumb {
      transform: translate(5px, 4px);
    }

    .highcharts-scrollbar-button {
      width: 2.4rem;
      height: 2.4rem;
      transform: translate(0, -3px);
      margin: 0 5rem;
    }

    .highcharts-scrollbar-arrow {
      transform: translate(3px, 0px) scale(2);
      stroke-width: 3px;
    }

    .highcharts-button .highcharts-reset-zoom {
      display: none;
      z-index: -1;
    }

    .highcharts-range-selector-buttons {
      border: 1px solid red !important;
    }
  }
`;

export { Container };
