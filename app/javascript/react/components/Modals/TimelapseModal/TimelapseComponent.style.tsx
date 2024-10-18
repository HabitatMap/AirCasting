import Popup from "reactjs-popup";
import styled from "styled-components";

import {
  acBlue,
  gray300,
  gray400,
  gray500,
  gray900,
  grayStroke,
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
      bottom: 10rem;
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
  bottom: 2.8rem;
  left: 0;
  height: fit-content;
  align-self: flex-end;
  cursor: pointer;
  @media ${media.smallDesktop} {
    top: -14rem;
    left: 97%;
    right: 0;
    bottom: 0;
  }
  @media ${media.desktop} {
    top: -11rem;
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
  align-items: center;
  display: flex;
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
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr auto;
  width: calc(100vw - 3rem);
  height: 100%;
  background-color: ${white};
  gap: 1.2rem;
  padding: 2rem 1.5rem;
  border-radius: 1rem;
  box-shadow: 2px 2px 4px 0px ${gray900};
  @media ${media.smallDesktop} {
    width: 100%;
    max-width: 115rem;
    min-width: 50rem;
    grid-template-rows: auto;
    grid-template-columns: 1fr 5fr;
    padding: 1rem;
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
  gap: 1.6rem;

  @media ${media.smallDesktop} {
    gap: 1rem;
    align-self: flex-end;
  }
`;

const DesktopAxisContainer = styled.div`
  display: none;
  @media ${media.smallDesktop} {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }
`;

const MobileAxisContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  grid-column: 1 / 3;
  grid-row: 3 / 3;
  padding-left: 0.8rem;
  @media ${media.smallDesktop} {
    display: none;
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background-color: ${gray500};
  position: relative;
  border-radius: 1rem;
  cursor: pointer;
  touch-action: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;

  @media ${media.smallDesktop} {
    height: 2px;
    border-radius: 0;
  }
`;

const ProgressFiller = styled.div<{ $isDragging: boolean }>`
  height: 6px;
  background-color: ${acBlue};
  border-radius: 1rem;
  transition: width ${({ $isDragging }) => ($isDragging ? "0.05s" : "0.2s")}
    ease-in-out;

  @media ${media.smallDesktop} {
    height: 4px;
    background-color: ${acBlue};
    margin-top: -0.1rem;
    border-radius: 0;
  }
`;

const StepMarkers = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1rem;
  width: 100%;
  @media ${media.smallDesktop} {
    top: -6px;
    left: 0;
    right: 0;
    height: 1rem;
  }
`;
const StepMarker = styled.div<{
  $isActive: boolean;
  $isCurrent: boolean;
  $position: number;
  $isDragging: boolean;
}>`
  left: ${({ $position }) => `${$position}%`};
  position: absolute;
  width: 0.1rem;
  height: 0.6rem;
  background-color: ${({ $isActive }) => ($isActive ? acBlue : white)};
  transform: scale(1);
  transition: background-color
    ${({ $isDragging }) => ($isDragging ? "0.05s" : "0.2s")} ease-in-out;
  @media ${media.smallDesktop} {
    height: 1.4rem;
    background-color: ${({ $isActive }) => ($isActive ? acBlue : gray500)};
  }
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

const MobileDateContainer = styled.div`
  display: flex;
  width: 100%;
  height: 3.2rem;
  border-radius: 1.2rem;
  border: 1px solid ${grayStroke};
  padding: 2rem 0.5rem;
  color: ${acBlue};
  justify-content: center;
  align-items: center;
  gap: 1rem;
  @media ${media.smallDesktop} {
    display: none;
  }
`;

const Time = styled.span`
  font-size: 1.2rem;
  @media ${media.smallDesktop} {
    font-size: 1.2rem;
    font-weight: 400;
  }
`;

const Date = styled.span`
  font-size: 1.6rem;
  font-weight: 500;
  @media ${media.smallDesktop} {
    font-size: 1.4rem;
    font-weight: 500;
  }
`;

const RoundMarker = styled.div<{ $position: number; $isDragging: boolean }>`
  position: absolute;
  top: -6px;
  left: ${({ $position }) => `${$position}%`};
  width: 1.6rem;
  height: 1.6rem;
  background-color: ${acBlue};
  border-radius: 50%;
  transform: translateX(-50%);
  transition: left ${({ $isDragging }) => ($isDragging ? "0.05s" : "0.2s")}
    ease-in-out;
  z-index: 1;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;

  @media ${media.smallDesktop} {
    top: -8px;
  }
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

const TimeRangeButtonsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  width: 100%;

  @media ${media.smallDesktop} {
    justify-content: flex-start;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1rem;
    background-color: ${white}80;
    padding: 0.4rem 0.8rem;
    width: fit-content;
    border-radius: 8px;
  }
`;

const TimeRangeButton = styled.button<{ $isActive: boolean }>`
  padding: 0.7rem 1.5rem;
  margin: 0 5px;
  background-color: ${white};
  color: ${({ $isActive }) => ($isActive ? acBlue : gray300)};
  border: none;
  border-radius: 5px;
  box-shadow: 2px 2px 4px 0px rgba(76, 86, 96, 0.1);
  font-size: 1.2rem;
  margin: 0;

  cursor: pointer;

  @media ${media.smallDesktop} {
    background-color: ${({ $isActive }) => ($isActive ? acBlue : white)};
    color: ${({ $isActive }) => ($isActive ? white : gray300)};
    &:hover {
      background-color: ${acBlue};
      color: ${white};
    }
  }
`;

const TimeRangeLabel = styled.span`
  display: none;
  @media ${media.smallDesktop} {
    display: flex;
    font-size: 1.2rem;
    color: ${gray400};
  }
`;

export {
  AlertInfo,
  CancelButtonX,
  Date,
  DateContainer,
  DesktopAxisContainer,
  MobileAxisContainer,
  MobileDateContainer,
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
  TimeRangeButton,
  TimeRangeButtonsContainer,
  TimeRangeLabel,
  Tooltip,
  Wrapper,
};
