import Popup from "reactjs-popup";
import styled from "styled-components";

import { gray900, white } from "../../../assets/styles/colors";
import { media } from "../../../utils/media";

const TimelapseModal = styled(Popup)`
  width: 100%;

  &-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 32rem;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    z-index: 2;
    @media ${media.smallDesktop} {
      bottom: 26.4rem;
    }
  }

  &-content {
    width: 100%;
    height: auto;
    bottom: 32rem;
    padding: 0.5rem;
    overflow-y: auto;
    margin: 0;
    display: flex;
    flex-direction: row-reverse;
    flex-wrap: wrap;

    @media ${media.smallDesktop} {
      bottom: 26.4rem;
      width: 115rem;
      height: 10rem;
      padding-bottom: 1.25rem;
      flex-direction: row;
    }
  }
`;

const CancelButtonX = styled.button`
  border: none;
  background-color: transparent;
  position: absolute;
  bottom: -2rem;
  left: 0.3rem;
  height: fit-content;
  align-self: flex-end;
  cursor: pointer;

  body:not(.user-is-tabbing) &:focus-visible {
    outline: none;
  }
  @media ${media.smallDesktop} {
    width: fit-content;
    top: 0;
    right: 0.3rem;
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
  display: grid;
  grid-template-columns: 1fr 5fr;
  grid-template-rows: 1fr 1fr;
  width: 100%;
  height: 100%;
  background-color: ${white};
  gap: 1.2rem;
  padding: 1rem;
  border-radius: 1rem;
  @media ${media.smallDesktop} {
    width: 110rem;
    height: 5rem;
    box-shadow: 2px 2px 4px 0px ${gray900};
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
`;

const AxisContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export {
  AxisContainer,
  CancelButtonX,
  NavigationButton,
  NavigationButtonsContainer,
  SmallPopup,
  TimeAxisContainer,
  TimelapseModal,
  Wrapper,
};
