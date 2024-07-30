import styled from "styled-components";
import { gray100, gray300 } from "../../assets/styles/colors";
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
  min-width: 29rem;
  height: 4rem;
  gap: 1rem;
  color: ${gray300};
  justify-content: center;
  align-items: center;
  font-weight: 300;
  position: absolute;
  top: 10.8rem;
  left: 6.5rem;
  z-index: 1;
  background-color: ${gray100};
  @media ${media.desktop} {
    justify-content: flex-end;
    padding-right: 0;
    position: inherit;
    top: 0;
    left: 0;
    z-index: 0;
    background-color: transparent;
    width: 100%;
    height: auto;
  }
`;

const Date = styled.div`
  font-size: 1.4rem;
  font-weight: 500;
  @media ${media.desktop} {
    font-size: 1.6rem;
  }
`;

const Time = styled.div`
  font-size: 1rem;
  font-weight: 300;
  @media ${media.desktop} {
    font-size: 1.6rem;
  }
`;

const TimeContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

export {
  Container,
  Date,
  MeasurementContainer,
  Time,
  TimeContainer,
  TimeRangeContainer,
};
