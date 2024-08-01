import styled from "styled-components";
import * as colors from "../../../../assets/styles/colors";
import { media } from "../../../../utils/media";
import { H1, H3 } from "../../../Typography";

const Container = styled.div<{ $isCalendarPage?: boolean; $rotated?: boolean }>`
  display: flex;
  align-items: center;
  padding-bottom: ${({ $isCalendarPage, $rotated }) =>
    $isCalendarPage && !$rotated ? "10rem" : "1.25rem"};

  @media ${media.smallDesktop} {
    justify-content: none;
  }
`;

const RotatedIcon = styled.img<{ $rotated: boolean }>`
  margin-right: 10px;
  transform: ${({ $rotated }) => ($rotated ? "rotate(180deg)" : "none")};
  cursor: pointer;
`;

const Heading = styled(H1)`
  font-weight: 500;
  font-size: 22px;
  cursor: pointer;

  @media ${media.desktop} {
    display: flex;
    justify-content: space-between;
    width: 100%;
    cursor: auto;
    font-size: 28px;
  }
`;

const DateField = styled(H3)`
  display: none;

  @media ${media.desktop} {
    display: flex;
    align-items: center;
    font-size: 16px;
    color: ${colors.gray300};

    span {
      margin: 0 0.6rem;
    }
  }
`;

export { Container, DateField, Heading, RotatedIcon };
