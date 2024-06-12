import styled from "styled-components";
import { media } from "../../utils/media";

const Container = styled.div`
  width: 100%;
  position: relative;
  font-family: "Roboto", sans-serif;

  @media ${media.smallDesktop} {
    width: 77%;
  }

  .highcharts-root {
    .highcharts-scrollbar {
      position: absolute;
      top: 0;
      z-index: 2;
      border-radius: 5px;
      padding: 5px;
      transform: translate(0px, 15px);
      width: 500px;

      .highcharts-scrollbar-arrow {
        display: inline-block;
        float: left;
        margin-right: 5px;
      }

      .highcharts-scrollbar-arrow.highcharts-scrollbar-arrow-right {
        margin-right: 0;
      }

      .highcharts-plot-bands-0 {
        border-radius: 5px;
      }
    }
  }
`;

export { Container };
