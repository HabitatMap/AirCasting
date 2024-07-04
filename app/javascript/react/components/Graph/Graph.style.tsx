import styled from "styled-components";
import { media } from "../../utils/media";

const Container = styled.div`
  width: 100%;
  position: relative;
  font-family: "Roboto", sans-serif;

  @media ${media.largeDesktop} {
    width: 80%;
  }

  .highcharts-root {
    .highcharts-scrollbar {
      transform: translate(0, 15px);
    }

    .data-highcharts-chart {
      width: 100%;
    }

    .highcharts-button .highcharts-reset-zoom {
      display: none;
      z-index: -1;
    }
  }
`;

export { Container };
