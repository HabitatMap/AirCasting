import styled from "styled-components";

import { blue, gray300, white } from "../../assets/styles/colors";
import { media } from "../../utils/media";
import { H4 } from "../Typography";

const MapButtonsWrapper = styled.div`
  position: absolute;
  top: 10rem;
  z-index: 4;
  @media ${media.desktop} {
    left: 0;
    top: 8rem;
  }

  @media ${media.mediumDesktop} {
    top: 10rem;
  }
`;

const MapButtons = styled.div`
  display: flex;
  padding: 0rem 0rem 0rem 2rem;
`;

const MapButton = styled.button<{ $isActive?: boolean; $isDisabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${(props) => (props.$isActive ? blue : white)};
  border-radius: 10px;
  padding: 0.6rem 1.6rem;
  border: none;
  margin-right: 1rem;
  cursor: pointer;
  ${(props) =>
    props.$isDisabled &&
    `opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;`}
`;

const Title = styled(H4)<{ $isActive?: boolean }>`
  color: ${(props) => (props.$isActive ? white : gray300)};
  margin-right: 0.8rem;
`;

const IconWrapper = styled.div<{ $src: string; $isActive: boolean }>`
  background-color: ${(props) => (props.$isActive ? white : gray300)};
  mask: url(${(props) => props.$src});
  mask-size: 100% 100%;
  width: 1.4rem;
  height: 1.4rem;
`;

export { IconWrapper, MapButton, MapButtons, MapButtonsWrapper, Title };
