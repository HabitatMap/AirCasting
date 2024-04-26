import styled from "styled-components";

import { H3 } from "../../../Typography";
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

const Heading = styled(H3)`
  font-weight: 700;
  font-size: 22px;
  cursor: pointer;
`;

const ResetButton = styled(Button)`
  background: ${colors.gray100};
  border: none;
  color: ${colors.gray300};
`;

export { Container, RotatedIcon, Heading, ResetButton };
