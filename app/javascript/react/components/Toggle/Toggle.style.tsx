import styled from "styled-components";
import { blue, gray400, white } from "../../assets/styles/colors";
import { media } from "../../utils/media";

const ToggleLabel = styled.label`
  position: relative;
  display: inline-block;
  width: 3.6rem;
  height: 1.8rem;
  @media ${media.mobile} {
    width: 2.5rem;
    height: 1.3rem;
  }
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 3.6rem;
  height: 1.8rem;

  z-index: 2;
  position: relative;

  &:checked + span:before {
    transform: translateX(1.8rem); // Adjust this value for mobile
    @media ${media.mobile} {
      transform: translateX(1.2rem);
    }
  }

  @media ${media.mobile} {
    width: 2.5rem;
    height: 1.3rem;
  }
`;

const Slider = styled.span<{ $isActive: boolean; $variant: string }>`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${(props) =>
    props.$variant === "toggle" && !props.$isActive ? gray400 : blue};
  transition: 0.4s;
  border-radius: 30px;
  z-index: 1;

  &:before {
    position: absolute;
    content: "";
    height: 1.4rem;
    width: 1.4rem;
    left: 0.2rem;
    bottom: 0.2rem;
    background-color: ${white};
    transition: 0.4s;
    border-radius: 50%;

    @media ${media.mobile} {
      height: 0.9rem;
      width: 0.9rem;
      left: 0.17rem;
      bottom: 0.16rem;
    }
  }
`;

const Label = styled.span<{ $isActive?: boolean }>`
  color: ${(props) => (props.$isActive ? blue : gray400)};
  margin: 0 1rem;
  display: inline-block;
  align-items: center;
  gap: 1rem;

  &::first-letter {
    text-transform: capitalize;
  }
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
`;

export { ToggleLabel, ToggleInput, Slider, Label, ToggleContainer };
