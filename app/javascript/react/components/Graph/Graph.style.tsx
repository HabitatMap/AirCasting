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
      z-index: 200;
      border-radius: 5px;
      padding: 5px;
      transform: translate(1px, 15px);
      width: 500px;
    }

    .highcharts-scrollbar-track {
      transform: translate(0, 4px);
      width: 99%;
      align-self: center;
    }

    .highcharts-scrollbar-thumb {
      transform: translate(5px, 4px);
    }

    .highcharts-scrollbar-button {
      width: 2.4rem;
      height: 2.4rem;
      transform: translate(0, -3px);
    }

    .highcharts-scrollbar-arrow {
      transform: translate(3px, 0px) scale(2);
      stroke-width: 3px;
    }
`;

export { Container };
