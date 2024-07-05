import styled from "styled-components";

import { gray100, gray300 } from "../../../assets/styles/colors";
import { media } from "../../../utils/media";
import { H5 } from "../../Typography";

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

const Subtitle = styled(H5)`
  display: inline;
  padding-right: 5px;

  @media ${media.desktop} {
    display: block;
    color: ${gray300};
    text-transform: uppercase;
    width: 120px;
    font-size: 14px;
  }
`;

const GridContainer = styled.div`
  background: ${gray100};
  padding: 6rem 2rem 5.5rem 2rem;
  display: grid;
  width: 100%;
  grid-gap: 10px;

  > :nth-child(1) {
    grid-area: valueLabel;
  }
  > :nth-child(2) {
    grid-area: headerName;
    align-self: center;
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

  @media ${media.smallDesktop} {
    padding: 3.5rem 10rem;
  }

  @media ${media.desktop} {
    padding: 4.5rem 10rem;
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

export { GridContainer, HorizontalContainer, RowContainer, Subtitle };
