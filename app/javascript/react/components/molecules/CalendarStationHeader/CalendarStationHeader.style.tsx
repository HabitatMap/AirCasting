import styled from "styled-components";
import { H1, H3, H4, H5 } from "../../Typography";
import media from "../../../utils/media";

const Container = styled.div`
  background: #f4f6f9;
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
`;

const ImageContainer = styled.div`
  padding-left: 15px;
`;

const TextContainer = styled.div`
  color: #4c5660;
  display: flex;
  flex-direction: column;
  text-align: left;
  padding-left: 21px;
`;

const BoldText = styled.div`
  font-weight: 600;
  display: inline;
`;

const Description = styled(H4)`
  padding-bottom: 10px;

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
  padding-bottom: 6px;
  line-height: 120%;

  @media ${media.desktop} {
    text-transform: uppercase;
  }
`;

const DataDescriptionValue = styled(H3)`

  @media ${media.mobile} {
    text-transform: uppercase;
    font-size: 14px;
    line-height: 160%;
    font-weight: 500;
  }
`;

const UpdateLabel = styled(H4)`
  @media ${media.desktop} {
    text-transform: uppercase;
  }

  @media ${media.mobile} {
    font-size: 12px;
    font-weight: 400;
  }
`

const HorizontalContainer = styled.div`
  display: flex;
  flex-direction: row;
`;

export {
  Container,
  TextContainer,
  BoldText,
  ImageContainer,
  Description,
  Header,
  DataDescriptionText,
  DataDescriptionValue,
  HorizontalContainer,
  UpdateLabel,
};
