import styled from "styled-components";
import { blue, mint } from "../../../assets/styles/colors";
import hexToRGBA from "../../../utils/hexToRGB";

const Container = styled.div`
  background: linear-gradient(
      241deg,
      ${hexToRGBA(blue, 0.4)} -2.4%,
      ${hexToRGBA(blue, 0.0)} 94.94%
    ),
    ${mint};
  display: flex;
  justify-content: space-between;
  padding: 34px 20px;
  width: 290px;
  height: 180px;
  border-radius: 10px;
`;

const ImageContainer = styled.img`
  height: 115px;
  width: 115px;
`;

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  text-align: right;
  color: white;
`;

const Label = styled.span`
  font-size: 16px;
  font-weight: 400;
`;

const Header = styled.span`
  font-size: 72px;
  font-weight: 600;
  padding-bottom: 5px;
`;

export { Container, ImageContainer, TextContainer, Label, Header };
