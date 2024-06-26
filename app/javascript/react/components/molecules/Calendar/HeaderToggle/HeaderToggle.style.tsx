import styled from "styled-components";
import { H1, H3 } from "../../../Typography";
import { media } from "../../../../utils/media";
import { Button } from "../../../Button/Button.style";
import * as colors from "../../../../assets/styles/colors";

const Container = styled.div`
  display: flex;
  align-items: center;
  padding-bottom: 1.25rem;

  @media ${media.smallDesktop} {
    justify-content: none;
  }
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

const ResetButton = styled(Button)`
  white-space: nowrap;
  background: ${colors.gray100};
  border: none;
  color: ${colors.gray300};
  width: fit-content;
  margin-left: auto;
  @media ${media.desktop} {
    margin-left: 0;
  }
`;

const ThresholdResetButton = styled(ResetButton)`
  white-space: nowrap;
  background: ${colors.gray100};
  border: none;
  color: ${colors.gray300};
  width: fit-content;
  margin-top: 3rem;
  @media ${media.desktop} {
    margin-left: 0;
  }
`;

const Wrapper = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

export {
  DateField,
  Container,
  RotatedIcon,
  Heading,
  ResetButton,
  ThresholdResetButton,
  Wrapper,
};
