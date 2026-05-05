import styled from "styled-components";
import { acBlueDark, blue, white } from "../../../assets/styles/colors";
import { H6 } from "../Typography";

const StyledSectionButton = styled.button<{
  $isNotTimelapseButton: boolean;
  $isActive?: boolean;
  $isDisabled?: boolean;
}>`
  background-color: ${white};
  border-radius: 1rem;
  box-shadow: 0 0.4rem 0.8rem rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 1.6rem;
  height: 4.2rem;
  border: 2px solid ${(props) => (props.$isActive ? blue : "transparent")};

  ${(props) =>
    props.$isNotTimelapseButton &&
    `opacity: 0.7;
    pointer-events: none;`}

  ${(props) =>
    props.$isDisabled &&
    `opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;`}

  @media (min-width: 390px) {
    padding: 0;
  }
`;

const Title = styled(H6)<{ $isActive?: boolean }>`
  text-transform: capitalize;
  ${(props) => props.$isActive && `color: ${acBlueDark};`}
`;

const Image = styled.img<{ $isActive?: boolean }>`
  width: 1.2rem;
  height: 1.2rem;
  margin-bottom: 0.25rem;
`;

export { Image, StyledSectionButton, Title };
