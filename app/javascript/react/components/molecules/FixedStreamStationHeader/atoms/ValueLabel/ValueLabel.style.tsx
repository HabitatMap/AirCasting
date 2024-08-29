import styled from "styled-components";
import {
  gray100,
  gray300,
} from "../../../../../assets/styles/colors";
import hexToRGBA from "../../../../../utils/hexToRGB";
import { media } from "../../../../../utils/media";

interface ContainerProps {
  $isActive?: boolean;
  $color?: string;
}

const Container = styled.div<ContainerProps>`
  background: ${(props) =>
    props.$isActive
      ? props.$color 
      : `linear-gradient(
          241deg,
          ${hexToRGBA(gray100, 0.4)} -2.4%,
          ${hexToRGBA(gray100, 0.0)} 94.94%
        ), ${gray300}`};
  display: flex;
  flex-direction: column;
  align-self: stretch;
  padding: 16px 12px;
  width: 111px;
  border-radius: 8px;

  @media ${media.desktop} {
    align-self: auto;
    flex-direction: row;
    justify-content: space-between;
    width: 290px;
    border-radius: 10px;
    padding: 34px 20px;
  }
`;

const ImageContainer = styled.img`
  height: 85px;
  width: 85px;

  @media ${media.desktop} {
    height: 115px;
    width: 115px;
  }
`;

const TextContainer = styled.div`
  text-align: left;
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  color: white;

  @media ${media.desktop} {
    text-align: right;
    padding-top: 0;
  }
`;

const Label = styled.span`
  font-size: 12px;
  font-weight: 700;

  @media ${media.desktop} {
    font-size: 16px;
    font-weight: 400;
  }
`;

const Header = styled.span`
  font-size: 42px;
  font-weight: 700;

  @media ${media.desktop} {
    font-size: 72px;
    font-weight: 600;
    padding-bottom: 5px;
  }
`;

export { Container, ImageContainer, TextContainer, Label, Header };
