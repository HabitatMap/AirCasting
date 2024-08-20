import styled from "styled-components";

import * as colors from "../../assets/styles/colors";
import { media } from "../../utils/media";
import { Button } from "../Button/Button.style";
import { ThresholdButtonVariant } from "./ThresholdButtons/ThresholdButton";

interface Props {
  $isMobileOldStyle?: boolean;
  $useColorBoxStyle?: boolean;
}

const SliderContainer = styled.div<Props>`
  display: flex;
  flex-direction: column;
  width: 100%;

  ${(props) =>
    props.$isMobileOldStyle &&
    `
    padding: 0 0.5rem;
  `}
`;
const ColorBox = styled.div`
  width: 100%;
  height: 2.4rem;
  display: inline-block;
  border-radius: 0.5rem;
`;

const StaticMobileSliderContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(4, auto 1fr) auto;
  grid-template-rows: auto;
  gap: 0.9rem;
  align-items: center;
  width: 100%;
`;

const InputContainer = styled.div<Props>`
  position: relative;
  width: 100%;
  padding-left: 1.5rem;
  justify-content: space-between;

  ${(props) =>
    props.$useColorBoxStyle &&
    `
    height: 4.7rem;
    padding-left: 0;
  `}

  @media (${media.mobile}) {
    ${(props) =>
      props.$isMobileOldStyle &&
      `
    height: 4.7rem;
  `}
  }

  @media (${media.desktop}) {
    padding-left: 0;
    height: 30px;
    margin-bottom: 0;
  }
`;

const ThresholdButton = styled(Button)<{ variant: ThresholdButtonVariant }>`
  white-space: nowrap;
  background: ${colors.gray100};
  border: none;
  color: ${colors.gray300};
  width: fit-content;
  text-transform: uppercase;
  align-items: center;
  justify-content: center;
  align-content: center;

  @media ${media.desktop} {
    margin-left: 0;
    ${(props) =>
      props.variant === ThresholdButtonVariant.IconOnly &&
      `
        height: 32px;
      `}
  }

  @media ${media.smallDesktop} {
    margin-left: 0;
    ${(props) =>
      props.variant === ThresholdButtonVariant.IconOnly &&
      `
        height: 32px;
      `}
  }

  @media ${media.mobile} {
    margin-left: auto;
    white-space: pre-line;
    text-align: left;
    line-height: 1.6rem;
    width: 33%;
    min-width: 100px;
    padding: 0.6rem 1.85rem;
    font-size: 1.2rem;
  }
`;

const ThresholdButtonWrapper = styled.div`
  display: grid;
  gap: 10px;
  align-items: center;
  grid-template-columns: auto 1fr;

  @media ${media.mobile} {
    grid-template-columns: 1fr auto;
    max-width: 100px;
    gap: 10px;
  }
`;

const ThresholdButtonsWrapper = styled.div`
  display: flex;
  gap: 1.6rem;
  justify-content: center;
  width: fit-content;

  @media ${media.tabletMax} {
    display: none;
  }
  @media ${media.desktop} {
    display: flex;
  }
`;

const UniformDistributionButton = styled(Button)`
  white-space: nowrap;
  background: ${colors.gray100};
  border: none;
  color: ${colors.gray300};
  width: 5.2rem;
  text-transform: uppercase;
  align-items: center;
  justify-content: center;
  align-content: center;

  @media ${media.desktop} {
    margin-left: 0;
    height: 32px;
  }

  @media ${media.smallDesktop} {
    margin-left: 0;

    height: 32px;
  }

  @media ${media.mobile} {
    display: none;
  }
`;

const ThresholdsDisclaimer = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: ${colors.gray300};
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
    grid-template-columns: auto 1fr auto auto;
    grid-template-rows: auto;
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
  $isMobileOldStyle: boolean;
}>`
  width: 100%;
  position: absolute;
  top: 50%;
  margin-left: -15px;
  transform: translateY(-50%);
  height: 9px;
  overflow: hidden;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  caret-color: transparent;
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
  color: transparent;
  border: none;

  &::-webkit-slider-thumb,
  &::-moz-range-thumb,
  &::-ms-thumb {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    width: 0;
    height: 0;
    background: transparent; /* Set the background to transparent */
    border: none;
  }

  &::-ms-track {
    width: 0;
    cursor: pointer;

    background: transparent;
    border-color: transparent;
    color: transparent;
  }

  &::-webkit-slider-thumb:hover,
  &::-moz-range-thumb:hover,
  &::-ms-thumb:hover {
    background: ${colors.gray300};
    border-color: ${colors.gray300};
  }

  &::-webkit-slider-runnable-track {
    display: none;
    width: 0;
    height: 0;
    cursor: pointer;
    background: transparent;
    border: none;
    color: transparent;
    border-radius: 0px;
  }

  &::-moz-range-track {
    display: none;
    width: 0px;
    height: 0px;
    cursor: pointer;
    background: transparent;
    border: none;
    color: transparent;
    border-radius: 0px;
  }

  ::-ms-track {
    display: none;
    width: 0%;
    cursor: pointer;
    background: transparent;
    border-color: transparent;
    color: transparent;
    border-width: 0px;
  }

  &:focus::-webkit-slider-runnable-track {
    background: transparent;
    border: none;
    color: transparent;
  }

  &:focus::-moz-range-track {
    background: transparent;
    border: none;
    color: transparent;
  }

  &:focus {
    outline: none;
    background: transparent;
    height: 0;
    color: transparent;
    caret-color: transparent;
  }

  &::-webkit-slider-thumb:active,
  &::-moz-range-thumb:active,
  &::-ms-thumb:active {
    background: ${colors.white};
    border-color: ${colors.gray300};
    color: transparent;
  }

  &::-moz-focus-outer {
    border: 0;
  }

  @media (${media.desktop}) {
    margin-left: 0;
  }

  ${(props) =>
    props.$isMobileOldStyle &&
    `
    height: 3px;
    top: 60%; /* Move the range input down */
    transform: translateY(-50%);
    color: transparent;
  `}
`;

const ColorBoxNumberInput = styled.input`
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 100%;
  min-width: 2.4rem;
  max-width: 2.9rem;
  height: 5rem;
  justify-content: space-between;
  text-align: center;
  border-radius: 5px;
  border: 1px solid ${colors.darkBlueTransparent};
  z-index: 7;
  font-size: 1.6rem;
  color: ${colors.darkBlue};

  @media (${media.mobile}) {
    height: 4.7rem;
  }

  @media (${media.desktop}) {
    padding-left: 0;
    height: 30px;
    margin-bottom: 0;
  }

  appearance: textfield;
  -moz-appearance: textfield;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &:focus {
    border: 1px solid ${colors.acBlue};
    outline: 0px solid ${colors.acBlue};
    background-color: ${colors.acBlueTransparent};
    color: ${colors.gray400};
    font-weight: 600;
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
  height: 50px;
  margin-left: -15px;
  border-radius: 5px;
  border: 1px solid ${colors.gray100};
  box-shadow: 2px 2px 4px 0px rgba(76, 86, 96, 0.1);
  z-index: 7;
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
  background-color: ${colors.white};
  top: 8%;
  left: 50%;
  transform: translate(-50%, -40%);
  font-size: 1.2rem;
  font-weight: bold;
  text-align: center;
  z-index: 20;

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

const OldStyleSliderHandles = styled.div`
  position: absolute;
  top: 60%; /* Center it vertically within the input container */
  transform: translate(-50%, -50%);
  cursor: pointer;
  z-index: 10;
  user-select: none;
`;

const OldStyleSliderHandle = styled.div`
  width: 13px;
  height: 13px;
  background-color: ${colors.white};
  box-shadow: rgba(166, 166, 166, 0.5) 0px 2px 4px;

  border-radius: 50%;
  user-select: none;
  -webkit-user-drag: none;
  pointer-events: none;
  &:active {
    cursor: grabbing;
    cursor: -moz-grabbing;
    cursor: -webkit-grabbing;
  }
`;

const OldStyleSliderText = styled.p`
  font-size: 1.2rem;
  font-weight: 600;
  color: ${colors.gray400};
  position: absolute;
  top: -16px; /* Adjust this value to position the text above the handle */
  left: 50%;
  transform: translateX(-50%);
  -webkit-user-select: none;
  -ms-user-select: none;
  user-select: none;
`;

export {
  ColorBox,
  ColorBoxNumberInput,
  DesktopContainer,
  ErrorMessage,
  InputContainer,
  NumberInput,
  OldStyleSliderHandle,
  OldStyleSliderHandles,
  OldStyleSliderText,
  RangeInput,
  SliderContainer,
  StaticMobileSliderContainer,
  StyledContainer,
  ThresholdButton,
  ThresholdButtonWrapper,
  ThresholdButtonsWrapper,
  ThresholdsDisclaimer,
  UniformDistributionButton,
  Units,
  Wrapper,
};
