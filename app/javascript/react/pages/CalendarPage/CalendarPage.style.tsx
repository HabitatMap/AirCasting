import styled from "styled-components";

import { gray100, gray400, white } from "../../assets/styles/colors";
import { NAVBAR_HEIGHT } from "../../components/Navbar/Navbar.style";
import { H3 } from "../../components/Typography";
import { media } from "../../utils/media";

const CalendarPageLayout = styled.div`
  display: flex;
  justify-content: center;
  background-color: ${gray100};

  @media ${media.smallDesktop} {
    padding: 0.5rem 1.5rem;
    position: relative;
    top: ${NAVBAR_HEIGHT};
  }
`;

const StationDataContainer = styled.div`
  box-shadow: 0px 5px 20px 2px rgba(0, 0, 0, 0.1);
  width: 100vw;
  max-width: 1600px;
  min-height: 100vh;
  margin: 0;

  @media ${media.desktop} {
    margin: 20px 5vw;
  }
`;

const Heading = styled(H3)`
  padding-bottom: 2rem;
  font-weight: 600;
  font-size: 22px;

  @media ${media.smallDesktop} {
    font-size: 28px;
    font-weight: 500;
  }
`;

const Units = styled.sup`
  font-size: 1.4rem;
  vertical-align: super;
  position: relative;
  top: -0.3rem;
  right: -0.2rem;
  font-weight: 400;
  line-height: 1.6;
  margin-left: 0.2rem;
`;

const StyledContainer = styled.div`
  display: grid;
  grid-template-columns: auto auto 1fr;
  align-items: right;
  grid-gap: 1rem;
  width: 100%;
  justify-items: flex-end;

  @media ${media.mobile} {
    display: inline;
  }
`;

const StyledContainerWithGraph = styled(StyledContainer)`
  grid-template-columns: auto 2fr 1fr;
`;

const ThresholdContainer = styled.div<{ $isMobile: boolean }>`
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
  margin-bottom: 3rem;
  background-color: ${white};

  @media ${media.desktop} {
    padding: 3rem 10rem;
    margin-bottom: 0;
  }

  @media ${media.largeDesktop} {
    padding: 3rem 10rem;
    margin-bottom: 0;
  }
  ${(props) => props.$isMobile && `padding: 1.5rem; gap: 2rem;`}
`;

const SliderWrapper = styled.div`
  display: flex;
  @media ${media.desktop} {
    margin-top: 4rem;
  }
`;

const GraphContainer = styled.div<{ $isMobile: boolean }>`
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
  margin-bottom: 3rem;
  background-color: ${white};

  @media ${media.desktop} {
    padding: 3rem 10rem;
    margin-bottom: 0;
  }

  @media ${media.largeDesktop} {
    padding: 3rem 10rem;
    margin-bottom: 0;
  }

  ${(props) => props.$isMobile && `padding: 1.5rem; gap: 2rem;`}
`;

const SelectLabelContainer = styled.span`
  display: flex;
  position: absolute;
  top: 6rem;
  font-size: 1.6rem;
  color: ${gray400};
`;

export {
  CalendarPageLayout,
  GraphContainer,
  Heading,
  SelectLabelContainer,
  SliderWrapper,
  StationDataContainer,
  StyledContainer,
  StyledContainerWithGraph,
  ThresholdContainer,
  Units,
};
