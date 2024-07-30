import styled from "styled-components";
import { gray300 } from "../../assets/styles/colors";
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

const MeasurementContainer = styled.div`
  display: flex;
  width: 100%;
  gap: 1rem;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  padding-right: 0.5rem;

  @media ${media.desktop} {
    justify-content: flex-end;
    padding-right: 0;
    margin-top: 0;
  }
`;

const TimeRangeContainer = styled.div`
  display: flex;
  width: 100%;
  gap: 1rem;
  color: ${gray300};
  justify-content: center;
  align-items: center;
  font-weight: 300;
  padding-right: 0.5rem;
  @media ${media.desktop} {
    justify-content: flex-end;
    padding-right: 0;
  }
`;

const Date = styled.div`
  font-size: 1.6rem;
  font-weight: 500;
`;

const Time = styled.div`
  font-size: 1.6rem;
  font-weight: 300;
`;

export { Container, Date, MeasurementContainer, Time, TimeRangeContainer };
