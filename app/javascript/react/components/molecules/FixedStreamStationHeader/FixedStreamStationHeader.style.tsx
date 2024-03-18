import styled from "styled-components";

import { H3, H4, H5 } from "../../Typography";
import media from "../../../utils/media";
import { gray100, gray300 } from "../../../assets/styles/colors";

const HorizontalContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: left;
`;

const RowContainer = styled.div`
  flex-direction: row;
  gap: 8px;

  @media ${media.desktop} {
    display: flex;
    align-items: flex-end;
  }
`;

const Label = styled(H5)`
  padding-bottom: 10px;
  font-weight: 500;

  @media ${media.desktop} {
    color: ${gray300};
    text-transform: uppercase;
    font-size: 14px;
    font-weight: 400;
  }
`;

const Heading = styled(H3)`
  padding-bottom: 10px;
  font-weight: 700;

  @media ${media.desktop} {
    font-size: 28px;
    font-weight: 600;
  }
`;

const Subtitle = styled(H4)`
  display: inline;
  padding-right: 5px;

  @media ${media.desktop} {
    display: block;
    color: ${gray300};
    text-transform: uppercase;
    width: 120px;
  }
`;

const DataDescription = styled(H4)`
  display: inline;
  font-weight: 500;
  text-transform: uppercase;

  @media ${media.desktop} {
    display: block;
    text-transform: none;
    font-size: 18px;
    font-weight: 400;
  }
`;

const DateLabel = styled(H4)`
  display: inline;
  font-weight: 600;
  text-transform: uppercase;

  @media ${media.desktop} {
    display: block;
    text-transform: none;
    font-weight: 400;
  }
`;

const FrequencyLabel = styled(H5)`
  display: inline;

  @media ${media.desktop} {
    display: block;
    font-size: 14px;
  }
`;

const MobileButtons = styled.div`
  display: flex;
  gap: 24px;

  @media ${media.desktop} {
    display: none;
  }
`;

const DesktopButtons = styled.div`
  display: none;

  @media ${media.desktop} {
    display: flex;
    gap: 20px;
  }
`;

const GridContainer = styled.div`
  background: ${gray100};
  padding: 3.5rem;
  display: grid;
  width: 100%;
  grid-gap: 20px;

  > :nth-child(1) {
    grid-area: valueLabel;
  }
  > :nth-child(2) {
    grid-area: headerName;
  }
  > :nth-child(3) {
    grid-area: profileSensor;
  }
  > :nth-child(4) {
    grid-area: updateOccurance;
  }
  > :nth-child(5) {
    grid-area: actionButtons;
  }

  grid-template-areas:
    "valueLabel headerName"
    "valueLabel profileSensor"
    "valueLabel updateOccurance "
    "valueLabel actionButtons";

  @media ${media.desktop} {
    grid-template-columns: 0.2fr 1fr 1fr;
    align-items: center;
    column-gap: 70px;

    > :nth-child(1) {
      grid-area: valueLabel;
    }
    > :nth-child(2) {
      grid-area: headerName;
    }
    > :nth-child(3) {
      grid-area: profileSensor;
    }
    > :nth-child(4) {
      grid-area: updateOccurance;
    }
    > :nth-child(5) {
      grid-area: actionButtons;
    }

    grid-template-areas:
      "valueLabel headerName profileSensor"
      "valueLabel headerName profileSensor"
      "valueLabel updateOccurance actionButtons";
  }
`;

export {
  RowContainer,
  GridContainer,
  Label,
  Heading,
  DataDescription,
  HorizontalContainer,
  Subtitle,
  DateLabel,
  FrequencyLabel,
  MobileButtons,
  DesktopButtons,
};
