import styled from "styled-components";

import {
  grey100,
  green,
  grey300,
  orange,
  red,
  yellow,
  white,
} from "../../assets/styles/colors";

const Container = styled.div`
  margin: 50px;
  background-color: ${white};
  position: relative;
  width: 90%;
  height: 70px;
`;

const RangeInput = styled.input.attrs<{ thresholds: number[] }>((props) => ({
  min: props.thresholds[0],
  max: props.thresholds[4],
}))<{
  $firstThumbPos: number;
  $secondThumbPos: number;
  $thirdThumbPos: number;
  $sliderWidth: number;
  thresholds: number[];
}>`
  width: 100%;
  position: absolute;
  top: 0;
  height: 8px;

  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;

  &::-webkit-slider-runnable-track {
    appearance: none;
    -webkit-appearance: none;
    height: 5px;
    background: transparent;
    border-radius: 5px;
  }

  &::-moz-range-track {
    appearance: none;
    height: 5px;
    background: transparent;
    border-radius: 5px;
  }

  &::-ms-track {
    appearance: none;
    height: 5px;
    background: transparent;
    border-radius: 5px;
  }

  &::-webkit-slider-thumb {
    appearance: none;
    width: 0;
    height: 0;
  }

  &::-moz-range-thumb {
    appearance: none;
    width: 0;
    height: 0;
  }

  &::-ms-thumb {
    appearance: none;
    width: 0;
    height: 0;
  }

  &:nth-child(2)::before {
    content: "";
    position: absolute;
    height: 10px;
    left: 0;
    right: ${(props) => props.$sliderWidth - props.$firstThumbPos}px;
    background: ${green};
  }

  &:nth-child(4)::before {
    content: "";
    position: absolute;
    height: 10px;
    left: ${(props) => props.$firstThumbPos}px;
    right: ${(props) => props.$sliderWidth - props.$secondThumbPos}px;
    background: ${yellow};
  }

  &:nth-child(6)::before {
    content: "";
    position: absolute;
    height: 10px;
    left: ${(props) => props.$secondThumbPos}px;
    right: ${(props) => props.$sliderWidth - props.$thirdThumbPos}px;
    background: ${orange};
  }

  &:nth-child(6)::after {
    content: "";
    position: absolute;
    height: 10px;
    left: ${(props) => props.$thirdThumbPos}px;
    right: 0;
    background: ${red};
  }
`;

const NumberInput = styled.input.attrs(() => ({
  type: "number",
  inputMode: "numeric",
}))<{ $marginLeft?: string }>`
  font-family: Roboto;
  font-weight: 600;
  font-size: 1.4rem;
  text-align: center;
  color: ${grey300};
  position: absolute;
  top: -10px;
  max-width: 50px;
  height: 32px;
  margin-left: ${(p) => p.$marginLeft || "-25px"};
  padding: 2px;
  border-radius: 5px;
  border: 1px solid ${grey100};
  box-shadow: 2px 2px 4px 0px rgba(76, 86, 96, 0.1);
  z-index: 5;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type="number"] {
    -moz-appearance: textfield;
  }

  cursor: move; /* fallback if grab cursor is unsupported */
  cursor: grab;
  cursor: -moz-grab;
  cursor: -webkit-grab;

  &:active {
    cursor: grabbing;
    cursor: -moz-grabbing;
    cursor: -webkit-grabbing;
  }
`;

export { Container, RangeInput, NumberInput };
