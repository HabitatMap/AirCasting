import styled from "styled-components";
import { H3 } from "../../../Typography";
import { media } from "../../../../utils/media";

const Container = styled.div`
  display: flex;
  align-items: center;
  padding-bottom: 20px;
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

  @media ${media.desktop} {
    cursor: auto;
  }
`;

export { Container, RotatedIcon, Heading };
