import styled from "styled-components";
import { H3 } from "../../../Typography";

export const Container = styled.div`
  display: flex;
  align-items: center;
  padding-bottom: 20px;
`;

export const RotatedIcon = styled.img<{ rotated: boolean }>`
  margin-right: 10px;
  transform: ${({ rotated }) => (rotated ? "rotate(180deg)" : "none")};
  cursor: pointer;
`;

export const Heading = styled(H3)`
  font-weight: 700;
  font-size: 22px;
  cursor: pointer;
`;
