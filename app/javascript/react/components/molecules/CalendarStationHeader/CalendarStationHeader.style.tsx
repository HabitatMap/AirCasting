import styled from "styled-components";
import { H1, H3, H4 } from "../../Typography";
import media from "../../../utils/media";
import { grey100, grey300 } from "../../../assets/styles/colors";

const Container = styled.div`
  background: ${grey100};
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  padding: 3.5rem;
`;

const DetailsContainer = styled.div`
  display: flex;
  flex-direction: column;
  text-align: left;
  padding-left: 21px;
  gap: 10px;
`;

const MixContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
`;

const ExtraContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;

  @media ${media.desktop} {
    flex-direction: row;
    text-transform: uppercase;
  }
`;

const Description = styled(H4)`
  padding-bottom: 10px;

  @media ${media.desktop} {
    color: ${grey300};
    text-transform: uppercase;
  }

  @media ${media.mobile} {
    font-size: 12px;
    font-weight: 500;
  }
`;

const Header = styled(H1)`
  padding-bottom: 10px;

  @media ${media.mobile} {
    font-size: 18px;
    font-weight: 700;
  }
`;

const DataDescriptionText = styled(H4)`
  @media ${media.desktop} {
    color: ${grey300};
    text-transform: uppercase;
  }
`;

const DataDescriptionValue = styled(H3)`
  @media ${media.mobile} {
    text-transform: uppercase;
    font-size: 14px;
    font-weight: 500;
  }
`;

const UpdateLabel = styled(H4)`
  @media ${media.desktop} {
    color: ${grey300};
    text-transform: uppercase;
  }

  @media ${media.mobile} {
    font-size: 12px;
    font-weight: 400;
  }
`;

const UpdateFrequencyLabel = styled(H4)`
  @media ${media.mobile} {
    font-size: 12px;
    font-weight: 400;
  }
`;

const UpdateDateLabel = styled(H4)`
  @media ${media.mobile} {
    text-transform: uppercase;
    font-weight: 600;
    flex: 1;
  }
`;

const HorizontalContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: left;

  @media ${media.mobile} {
    align-items: flex-start;
  }
`;

const HorizontalSpacingContainer = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 70px;
`;

const RowContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: leading;
  gap: 10px;
`;

const MobileButtons = styled.div`
  display: flex;

  @media ${media.desktop} {
    display: none;
  }
`;

const DesktopButtons = styled.div`
  display: none;

  @media ${media.desktop} {
    display: flex;
  }
`;

export {
  Container,
  MixContainer,
  DetailsContainer,
  ExtraContainer,
  Description,
  Header,
  DataDescriptionText,
  DataDescriptionValue,
  HorizontalContainer,
  UpdateLabel,
  UpdateDateLabel,
  HorizontalSpacingContainer,
  UpdateFrequencyLabel,
  RowContainer,
  MobileButtons,
  DesktopButtons
};
