import styled from "styled-components";
import { media } from "../../utils/media";

interface ContainerProps {
  $isCalendarPage?: boolean;
}

const Container = styled.div<ContainerProps>`
  width: 100%;
  position: relative;
  font-family: "Roboto", sans-serif;

  @media ${media.desktop} {
    width: ${(props) => (props.$isCalendarPage ? "100%" : "80%")};
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
