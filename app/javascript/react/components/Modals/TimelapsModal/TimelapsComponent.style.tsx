import Popup from "reactjs-popup";
import styled from "styled-components";

import { white } from "../../../assets/styles/colors";
import { media } from "../../../utils/media";

const TimelapsModal = styled(Popup)`
  width: 100%;

  &-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 26.4rem;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    /* pointer-events: none !important; */
    z-index: 2;
  }

  &-content {
    width: 115rem;
    height: 10rem;
    bottom: 26.4rem;
    padding: 0.5rem;
    overflow-y: auto;
    margin: 0;
    display: flex;
    flex-direction: row-reverse;
    flex-wrap: wrap;

    @media ${media.smallDesktop} {
      padding-bottom: 1.25rem;
      flex-direction: row;
    }
  }
`;

const CancelButtonX = styled.button`
  border: none;
  background-color: transparent;
  position: absolute;
  top: 0;
  right: 0.3rem;
  height: fit-content;
  align-self: flex-end;
  cursor: pointer;

  body:not(.user-is-tabbing) &:focus-visible {
    outline: none;
  }
  @media ${media.smallDesktop} {
    width: fit-content;
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
    box-shadow: 2px 2px 4px 0px #4c56601a;

    z-index: 4;
    display: flex;
    width: 180px;
    height: 91px;
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
  display: flex;
  justify-content: flex-start;
  width: 110rem;
  height: 5rem;
  background-color: ${white};
  flex-direction: column;
  gap: 1.2rem;
  padding: 1rem;
  border-radius: 1rem;
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
`;

export {
  CancelButtonX,
  NavigationButton,
  NavigationButtonsContainer,
  SmallPopup,
  TimeAxisContainer,
  TimelapsModal,
  Wrapper,
};
