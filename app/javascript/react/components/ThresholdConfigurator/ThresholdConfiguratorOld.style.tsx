import styled from "styled-components";

import * as colors from "../../assets/styles/colors";
import { Button } from "../Button/Button.style";
import { media } from "../../utils/media";

interface Props {
  $isMapPage?: boolean;
}

const SliderContainer = styled.div<Props>`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const InputContainer = styled.div<Props>`
  position: relative;
  width: 100%;
  height: 70px;
  padding-left: 1.5rem;
  justify-content: space-between;

  @media (${media.desktop}) {
    padding-left: 0;
    height: 30px;
    margin-bottom: 0;
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
  height: 3.2rem;
  @media ${media.desktop} {
    margin-left: 0;
  }
`;

const ThresholdsDisclaimer = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: ${colors.gray300};
  wrap: wrap;
  width: 9.3rem;
  padding: 0rem 0.5rem;
  text-align: right;
  /* compensate for the margin on first threshold thumb */
  margin-right: 1.5rem;
`;

const DesktopContainer = styled.div`
  display: grid;
  gap: 1rem;
  align-items: center;

  @media ${media.desktop} {
    grid-template-columns: auto 1fr auto;
    gap: 1rem;
  }

  @media ${media.mobile} {
    grid-template-columns: auto;
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
  top: 50%;
  transform: translateY(-50%);
  height: 3px;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background: linear-gradient(
    to right,
    ${colors.green} ${(props) => props.$firstThumbPos}px,
    ${colors.yellow} ${(props) => props.$firstThumbPos}px,
    ${colors.yellow} ${(props) => props.$secondThumbPos}px,
    ${colors.orange} ${(props) => props.$secondThumbPos}px,
    ${colors.orange} ${(props) => props.$thirdThumbPos}px,
    ${colors.red} ${(props) => props.$thirdThumbPos}px,
    ${colors.red} 100%
  );
  border-radius: 2px;
  outline: none;
  opacity: 0.7;
  transition: opacity 0.2s;

  &::-webkit-slider-thumb,
  &::-moz-range-thumb,
  &::-ms-thumb {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    background: ${colors.white};
    border: 2px solid ${colors.gray300};
    border-radius: 50%;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, transform 0.15s;
  }

  &::-webkit-slider-thumb:hover,
  &::-moz-range-thumb:hover,
  &::-ms-thumb:hover {
    background: ${colors.gray300};
    border-color: ${colors.gray300};
  }

  &::-moz-focus-outer {
    border: 0;
  }
`;

const NumberInput = styled.input<{
  $isLast?: boolean;
  $hasError?: boolean;
  $isActive?: boolean;
}>`
  font-family: Roboto;
  font-weight: 400;
  font-size: 16px;
  text-align: center;
  color: ${colors.gray300};
  position: absolute;
  top: 10px;
  right: ${(props) => (props.$isLast ? "0px" : "auto")};
  max-width: 30px;
  height: 12px;
  margin-left: -15px;
  border-radius: 15px;
  border: 1px solid ${colors.gray100};
  box-shadow: 2px 2px 4px 0px rgba(76, 86, 96, 0.1);
  z-index: 5;
  cursor: move; /* fallback if grab cursor is unsupported */
  cursor: grab;

  appearance: textfield;
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
    max-width: 40px;
    height: 32px;
    top: -1px;
  }
`;

const ErrorMessage = styled.p`
  color: ${colors.red};
  position: absolute;
  top: 27%;
  left: 50%;
  transform: translate(-50%, -40%);
  font-size: 1.2rem;
  font-weight: bold;
  text-align: center;

  @media ${media.smallDesktop} {
    font-size: 1.5rem;
    transform: translate(-50%, -50%);
    top: 30%;
  }
`;

const Units = styled.sup`
  font-size: 1.2rem;
  vertical-align: super;
  position: relative;
  font-weight: 400;
  line-height: 1.6;
  color: ${colors.gray400};
`;

const StyledContainer = styled.div`
  display: inline;
`;

const Wrapper = styled.div`
  display: flex;
  gap: 1rem;
`;

export {
  DesktopContainer,
  ErrorMessage,
  InputContainer,
  NumberInput,
  RangeInput,
  ResetButton,
  SliderContainer,
  StyledContainer,
  ThresholdsDisclaimer,
  ThresholdResetButton,
  Units,
  Wrapper,
};
