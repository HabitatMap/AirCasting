import Popup from "reactjs-popup";
import styled from "styled-components";

import {
  acBlue,
  gray400,
  gray500,
  gray900,
  white,
} from "../../../assets/styles/colors";
import { media } from "../../../utils/media";

const TimelapseModal = styled(Popup)`
  width: 100%;

  &-overlay {
    z-index: 2;
  }

  &-content {
    width: 100%;
    height: auto;
    padding: 1rem;
    overflow: visible;
    flex-direction: row;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    top: 5rem;

    @media ${media.smallDesktop} {
      padding-bottom: 1.25rem;
      align-items: flex-end;
      bottom: 20rem;
      top: auto;
    }
  }
`;

const CancelButtonX = styled.button`
  border: none;
  background-color: transparent;
  position: relative;
  top: auto;
  right: 0;
  bottom: -2rem;
  left: 0;
  height: fit-content;
  align-self: flex-end;
  cursor: pointer;
  @media ${media.smallDesktop} {
    top: -9rem;
    left: 97%;
    right: 0;
    bottom: 0;
  }
  @media ${media.desktop} {
    top: -6rem;
    left: 101%;
  }
  body:not(.user-is-tabbing) &:focus-visible {
    outline: none;
  }
`;

const SmallPopup = styled(Popup)`
  width: 100%;
  height: auto;

  &-overlay {
  }

  &-content {
    background-color: ${white};
    opacity: 1;
    border-radius: 8px;
    position: relative;
    padding: 1rem;
    box-shadow: 2px 2px 4px 0px ${gray900};
    z-index: 6;
    display: flex;
    width: 20rem;
    height: 7rem;
  }
`;

const AlertInfo = styled.span`
  font-size: 1.2rem;
  color: ${gray400};
  margin: 0;
  padding: 0;
  text-align: center;
  line-height: 1.8rem;
  @media ${media.smallDesktop} {
    font-size: 1.4rem;
  }
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media ${media.smallDesktop} {
    gap: 1.6rem;
  }
`;

const TimeAxisContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 5fr;
  grid-template-rows: 1fr 1fr;
  width: 100%;
  height: 100%;
  background-color: ${white};
  gap: 1.2rem;
  padding: 1rem;
  border-radius: 1rem;
  box-shadow: 2px 2px 4px 0px ${gray900};
  @media ${media.smallDesktop} {
    width: 100%;
    max-width: 115rem;
    min-width: 50rem;
    grid-template-rows: auto;
    grid-template-columns: 1fr 5fr;
  }
`;

const NavigationButton = styled.button`
  border: none;
  background-color: transparent;
  cursor: pointer;
`;

const NavigationButtonsContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
  align-self: flex-end;
`;

const AxisContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 2px;
  background-color: ${gray500};
  position: relative;
`;

const ProgressFiller = styled.div`
  height: 4px;
  background-color: ${acBlue};
  margin-top: -0.1rem;
`;

const StepMarkers = styled.div`
  position: absolute;
  top: -6px;
  left: 0;
  right: 0;
  height: 1rem;
  width: 100%;
`;
const StepMarker = styled.div<{
  $isActive: boolean;
  $isCurrent: boolean;
  $position: number;
}>`
  left: ${({ $position }) => `${$position}%`};
  position: absolute;
  width: 0.1rem;
  height: 1.4rem;
  background-color: ${({ $isActive }) => ($isActive ? acBlue : gray500)};
  transform: scale(1);
  transition: transform 0.2s ease-in-out;
`;

const DateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${gray400};
  width: 10rem;
  gap: 0.5rem;
`;

const Time = styled.span`
  font-size: 1.2rem;
  font-weight: 400;
`;

const Date = styled.span`
  font-size: 1.4rem;
  font-weight: 500;
`;

const RoundMarker = styled.div<{ $position: number }>`
  position: absolute;
  top: -8px;
  left: ${({ $position }) => `${$position}%`};
  width: 1.6rem;
  height: 1.6rem;
  background-color: ${acBlue};
  border-radius: 50%;
  transform: translateX(-50%);
  transition: left 0.2s ease-in-out;
`;

const Tooltip = styled.div`
  display: flex;
  background-color: ${acBlue};
  color: ${white};
  padding: 1rem;
  gap: 1rem;
  border-radius: 0.5rem;
  font-size: 1.2rem;
  text-align: center;
  white-space: nowrap;
  position: absolute;
  bottom: 140%;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;

  &::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 6px;
    border-style: solid;
    border-color: ${acBlue} transparent transparent transparent;
  }
`;

export {
  AlertInfo,
  AxisContainer,
  CancelButtonX,
  Date,
  DateContainer,
  NavigationButton,
  NavigationButtonsContainer,
  ProgressBar,
  ProgressFiller,
  RoundMarker,
  SmallPopup,
  StepMarker,
  StepMarkers,
  Time,
  TimeAxisContainer,
  TimelapseModal,
  Tooltip,
  Wrapper,
};
