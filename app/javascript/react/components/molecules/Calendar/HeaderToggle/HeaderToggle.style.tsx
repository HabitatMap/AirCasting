import styled from "styled-components";
import { H1, H3 } from "../../../Typography";
import { media } from "../../../../utils/media";
import { Button } from "../../../Button/Button.style";
import * as colors from "../../../../assets/styles/colors";

const Container = styled.div`
  display: flex;
  align-items: center;
  padding-bottom: 20px;
  justify-content: space-between;
`;

const RotatedIcon = styled.img<{ rotated: boolean }>`
  margin-right: 10px;
  transform: ${({ rotated }) => (rotated ? "rotate(180deg)" : "none")};
  cursor: pointer;
`;

const Heading = styled(H1)`
  font-weight: 500;
  font-size: 22px;
  cursor: pointer;

  @media ${media.desktop} {
    cursor: auto;
    font-size: 28px;
  }
`;

const ResetButton = styled(Button)`
  background: ${colors.gray100};
  border: none;
  color: ${colors.gray300};
  width: fit-content;
  margin-left: auto;
  @media ${media.desktop} {
    margin-left: 0;
  }
`;

export { Container, RotatedIcon, Heading, ResetButton };
