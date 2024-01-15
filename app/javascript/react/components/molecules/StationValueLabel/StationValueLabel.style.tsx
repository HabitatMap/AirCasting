import styled from "styled-components";
import { blue, mint } from "../../../assets/styles/colors";
import hexToRGBA from "../../../utils/hexToRGB";
import media from "../../../utils/media";

const Container = styled.div`
  background: linear-gradient(
      241deg,
      ${hexToRGBA(blue, 0.4)} -2.4%,
      ${hexToRGBA(blue, 0.0)} 94.94%
    ),
    ${mint};
  display: flex;
  padding: 34px 20px;
  width: 290px;
  height: 180px;
  border-radius: 10px;

  @media ${media.mobile} {
    flex-direction: column;
    width: 111px;
    height: 274px;
    border-radius: 8px;
  }
`;

const ImageContainer = styled.img`
  height: 115px;
  width: 115px;

  @media ${media.mobile} {
    height: 85px;
    width: 85px;
  }
`;

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  text-align: right;
  color: white;

  @media ${media.mobile} {
    text-align: left;
    padding-top: 16px;
  }
`;

const Label = styled.span`
  font-size: 16px;
  font-weight: 400;

  @media ${media.mobile} {
    font-size: 12px;
    font-weight: 700;
  }
`;

const Header = styled.span`
  font-size: 72px;
  font-weight: 600;
  padding-bottom: 5px;

  @media ${media.mobile} {
    font-size: 42px;
    font-weight: 700;
  }
`;

export { Container, ImageContainer, TextContainer, Label, Header };
