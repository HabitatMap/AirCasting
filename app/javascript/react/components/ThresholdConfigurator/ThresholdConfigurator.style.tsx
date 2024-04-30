import styled from "styled-components";

import * as colors from "../../assets/styles/colors";
import { media } from "../../utils/media";
import { Button } from "../Button/Button.style";

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
  height: 70px;
  padding-left: 1.5rem;

  @media (${media.desktop}) {
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
  height: 21px;
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
    width: 100%;
    height: 8px;

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
  $hasError?: boolean;
  $isActive?: boolean;
}>`
  font-family: Roboto;
  font-weight: 500;
  font-size: 1.5rem;
  text-align: center;
  color: ${colors.gray300};
  position: absolute;
  top: 0;
  right: ${(props) => (props.$isLast ? "0px" : "auto")};
  max-width: 27px;
  height: 50px;
  margin-left: -15px;
  border-radius: 5px;
  border: 1px solid ${colors.gray100};
  box-shadow: 2px 2px 4px 0px rgba(76, 86, 96, 0.1);
  z-index: 5;
  cursor: move; /* fallback if grab cursor is unsupported */
  cursor: grab;

  -moz-appearance: textfield;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &:active {
    cursor: grabbing;
    cursor: -moz-grabbing;
    cursor: -webkit-grabbing;
  }
  &:disabled {
    background-color: ${colors.white};
  }

  &:focus-visible {
    border-color: ${(props) =>
      props.$isActive
        ? "transparent"
        : props.$hasError
        ? colors.red
        : colors.gray100};
    outline: 2px solid
      ${(props) => (props.$isActive ? colors.gray100 : "transparent")};
  }

  @media ${media.desktop} {
    font-weight: 600;
    font-size: 1.5rem;
    top: -10px;
    max-width: 40px;
    height: 32px;
  }
`;

const ErrorMessage = styled.p`
  color: ${colors.red};
  position: absolute;
  top: 65%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1rem;
  font-weight: bold;

  @media ${media.desktop} {
    font-size: 1.5rem;
    top: 43%;
  }
`;

const Units = styled.sup`
  font-size: 1.2rem;
  vertical-align: super;
  position: relative;
  top: -0.3rem;
  right: -0.2rem;
  weight: 400;
  line-height: 1.6;
  letter-spacing: 1%;
  margin-left: 0.2rem;
`;

export {
  Container,
  InputContainer,
  RangeInput,
  NumberInput,
  ErrorMessage,
  Units,
};
