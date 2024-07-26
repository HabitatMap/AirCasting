import styled from "styled-components";
import { media } from "../../utils/media";

interface ContainerProps {
  $isCalendarPage?: boolean;
}

const Container = styled.div<ContainerProps>`
  width: 100%;
  position: relative;
  font-family: "Roboto", sans-serif;
  overflow: visible;

  @media ${media.desktop} {
    width: ${(props) => (props.$isCalendarPage ? "100%" : "80%")};
  }

  .highcharts-container {
    overflow: visible;
  }

  .highcharts-root {
    overflow: visible;
    .highcharts-scrollbar {
      transform: translate(0, 15px);
    }

    .highcharts-container {
      overflow: visible;
    }

    .data-highcharts-chart {
      width: 100%;
      overflow: visible;
    }

    .highcharts-button .highcharts-reset-zoom {
      display: none;
      z-index: -1;
    }

    .custom-arrow {
      position: absolute;
      visibility: visible;
      width: 48px;
      height: 48px;
    }
  }
`;

export { Container };
