import styled from "styled-components";

import * as colors from "../../assets/styles/colors";
import { media } from "../../utils/media";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  margin-bottom: 3rem;
  background: ${colors.white};

  @media (${media.desktop}) {
    padding: 3.5rem 10rem;
    margin-bottom: 0;
  }
`;

const InputContainer = styled.div`
  position: relative;
  width: 100%;
  height: 6rem;
  padding-left: 1.5rem;

  @media (${media.desktop}) {
    width: 98%;
    margin-top: 3rem;
    padding-left: 0;
  }
`;

const RangeInput = styled.input<{
  $firstThumbPos: number;
  $secondThumbPos: number;
  $thirdThumbPos: number;
  $sliderWidth: number;
}>`
  width: 100%;
  position: absolute;
  top: 13px;
  height: 0.5rem;
  left: 0;
  background: transparent;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;

  &::-webkit-slider-runnable-track,
  &::-moz-range-track,
  &::-ms-track {
    appearance: none;
    -webkit-appearance: none;
    height: 2.5rem;
    background: transparent;
  }

  &::-webkit-slider-thumb,
  &::-moz-range-thumb,
  &::-ms-thumb {
    appearance: none;
    width: 0;
    height: 0;
  }

  &:nth-child(2)::before,
  &:nth-child(4)::before,
  &:nth-child(6)::before,
  &:nth-child(6)::after {
    content: "";
    position: absolute;
    height: 2.5rem;
    border-radius: 5px;
    margin-right: 10px;
  }

  &:nth-child(2)::before {
    left: 0;
    right: ${(props) => props.$sliderWidth - props.$firstThumbPos}px;
    background: ${colors.green};
  }

  &:nth-child(4)::before {
    left: ${(props) => props.$firstThumbPos}px;
    right: ${(props) => props.$sliderWidth - props.$secondThumbPos}px;
    background: ${colors.yellow};
  }

  &:nth-child(6)::before {
    left: ${(props) => props.$secondThumbPos}px;
    right: ${(props) => props.$sliderWidth - props.$thirdThumbPos}px;
    background: ${colors.orange};
  }

  &:nth-child(6)::after {
    left: ${(props) => props.$thirdThumbPos}px;
    right: 0;
    background: ${colors.red};
  }

  @media ${media.desktop} {
    top: 0;
    height: 1.5rem;
    left: 2.2rem;
    &::-webkit-slider-runnable-track,
    &::-moz-range-track,
    &::-ms-track {
      height: 5px;
    }

    &:nth-child(2)::before,
    &:nth-child(4)::before,
    &:nth-child(6)::before,
    &:nth-child(6)::after {
      content: "";
      position: absolute;
      height: 10px;
      margin-right: 0;
    }
  }
`;

const NumberInput = styled.input<{
  $isLast?: boolean;
}>`
  font-family: Roboto;
  font-weight: 500;
  font-size: 1rem;
  text-align: center;
  color: ${colors.gray300};
  position: absolute;
  top: 0;
  right: ${(props) => (props.$isLast ? "0px" : "auto")};
  max-width: 2.5rem;
  height: 5rem;
  margin-left: -15px;
  border-radius: 5px;
  border: 1px solid ${colors.gray100};
  box-shadow: 2px 2px 4px 0px rgba(76, 86, 96, 0.1);
  z-index: 5;
  cursor: move; /* fallback if grab cursor is unsupported */
  cursor: grab;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }

  &:active {
    cursor: grabbing;
    cursor: -moz-grabbing;
    cursor: -webkit-grabbing;
  }
  &:disabled {
    background-color: ${colors.white};
  }

  @media ${media.desktop} {
    font-weight: 600;
    font-size: 1.4rem;
    top: -10px;
    max-width: 5rem;
    height: 3.2rem;
    margin-left: 0;
    right: ${(props) => (props.$isLast ? "-2.2rem" : "auto")};
  }
`;

export { Container, InputContainer, RangeInput, NumberInput };
