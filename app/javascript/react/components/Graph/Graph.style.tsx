import styled from "styled-components";
import { media } from "../../utils/media";

const Container = styled.div`
  width: 100%;
  position: relative;
  font-family: "Roboto", sans-serif;
  @media ${media.smallDesktop} {
    width: 80%;
  }

  .highcharts-scrollbar {
    position: absolute;
    top: 0;
    z-index: 2;
    background-color: red;
    border: 1px solid #ccc;
    border-radius: 5px;
    padding: 5px;
    transform: translate(0px, 15px);
    width: 150px;
    .highcharts-scrollbar-track {
      width: 150px;
    }
    .highcharts-scrollbar-arrow {
      display: inline-block;
      float: left;
      margin-right: 5px;
    }

    .highcharts-scrollbar-arrow.highcharts-scrollbar-arrow-up {
      margin-right: 0;
    }
  }
`;
export { Container };
