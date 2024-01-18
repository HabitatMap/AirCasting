import styled from "styled-components";
import { H3, H4, H5 } from "../../Typography";
import media from "../../../utils/media";
import { grey100, grey300 } from "../../../assets/styles/colors";

const HorizontalContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: left;
`;

const RowContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 4px;

  @media ${media.desktop} {
    align-items: flex-end;
  }
`;

const Description = styled(H4)`
  padding-bottom: 10px;
  font-size: 12px;
  font-weight: 500;

  @media ${media.desktop} {
    color: ${grey300};
    text-transform: uppercase;
    font-size: 14px;
    font-weight: 400;
  }
`;

const Header = styled(H3)`
  padding-bottom: 10px;
  font-weight: 700;

  @media ${media.desktop} {
    font-size: 28px;
    font-weight: 400;
  }
`;

const DataDescriptionText = styled(H4)`
  @media ${media.desktop} {
    color: ${grey300};
    text-transform: uppercase;
  }
`;

const DataDescriptionValue = styled(H4)`
  font-weight: 500;
  text-transform: uppercase;

  @media ${media.desktop} {
    text-transform: none;
    font-size: 18px;
    font-weight: 400;
  }
`;

const UpdateDateLabel = styled(H4)`
  font-weight: 600;
  text-transform: uppercase;

  @media ${media.desktop} {
    text-transform: none;
    font-weight: 400;
  }
`;

const UpdateFrequencyLabel = styled(H5)`
  @media ${media.desktop} {
    font-size: 14px;
  }
`;

const UpdateLabel = styled(H5)`
  @media ${media.desktop} {
    font-size: 14px;
    color: ${grey300};
    text-transform: uppercase;
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
  background: ${grey100};
  padding: 3.5rem;
  display: grid;
  width: 100%;
  grid-template-columns: repeat(2, 1fr);
  grid-gap: 5px;

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
    grid-template-columns: 0.5fr 1fr 1fr;
    align-items: center;
    column-gap: 20px;

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
  Description,
  Header,
  DataDescriptionText,
  DataDescriptionValue,
  HorizontalContainer,
  UpdateLabel,
  UpdateDateLabel,
  UpdateFrequencyLabel,
  MobileButtons,
  DesktopButtons,
};
