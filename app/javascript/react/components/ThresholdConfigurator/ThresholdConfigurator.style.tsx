import styled from "styled-components";

import * as colors from "../../assets/styles/colors";
import media from "../../utils/media";

const Container = styled.div`
  background-color: ${colors.white};
  position: relative;
  width: 90%;
  height: 70px;
`;

const RangeInput = styled.input<{
  $firstThumbPos: number;
  $secondThumbPos: number;
  $thirdThumbPos: number;
  $sliderWidth: number;
}>`
  width: 100%;
  position: absolute;
  top: 22px;
  height: 8px;
  background: transparent;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;

  &::-webkit-slider-runnable-track,
  &::-moz-range-track,
  &::-ms-track {
    appearance: none;
    -webkit-appearance: none;
    height: 24px;
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
    height: 24px;
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
    &:nth-child(2)::before,
    &:nth-child(4)::before,
    &:nth-child(6)::before,
    &:nth-child(6)::after {
      content: "";
      position: absolute;
      height: 10px;
    }
  }
`;

const NumberInput = styled.input`
  font-family: Roboto;
  font-weight: 500;
  font-size: 1rem;
  text-align: center;
  color: ${colors.gray300};
  position: absolute;
  top: 13px;
  max-width: 24px;
  height: 42px;
  margin-left: -25px;
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
  @media ${media.desktop} {
    font-size: 1.4rem;
    font-weight: 600;
    top: -10px;
    max-width: 50px;
    height: 32px;
    margin-left: -25px;
  }
`;

export { Container, RangeInput, NumberInput };
