import styled from "styled-components";
import { blue, white } from "../../assets/styles/colors";
import { media } from "../../utils/media";
import { H6 } from "../Typography";

const StyledSectionButton = styled.button<{
  $isNotTimelapseButton: boolean;
  $isActive: boolean;
}>`
  background-color: ${(props) => (props.$isActive ? blue : white)};
  border-radius: 1rem;
  box-shadow: 0 0.4rem 0.8rem rgba(0, 0, 0, 0.1);
  margin-bottom: 0.4rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 1.8rem;
  height: 4.2rem;
  border: none;
  ${(props) =>
    props.$isNotTimelapseButton &&
    `opacity: 0.7;
    pointer-events: none;`}
  @media (${media.smallDesktop}) {
    width: 8.5rem;
  }
`;

const Title = styled(H6)<{ $isActive: boolean }>`
  text-transform: capitalize;
  ${(props) => props.$isActive && `color: ${white};`}
`;

const Image = styled.img<{ $isActive: boolean }>`
  width: 1.2rem;
  height: 1.2rem;
  margin-bottom: 0.25rem;
  ${(props) =>
    props.$isActive &&
    `filter: invert(100%) sepia(37%) saturate(2%) hue-rotate(273deg) brightness(109%) contrast(101%);;`}
`;

export { Image, StyledSectionButton, Title };
