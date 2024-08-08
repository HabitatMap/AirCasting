import Popup from "reactjs-popup";
import styled from "styled-components";

import { gray400, gray900, white } from "../../../assets/styles/colors";
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
    top: -6rem;
    right: 0;
    bottom: 0;
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
    z-index: 4;
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
`;

const AxisContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export {
  AlertInfo,
  AxisContainer,
  CancelButtonX,
  NavigationButton,
  NavigationButtonsContainer,
  SmallPopup,
  TimeAxisContainer,
  TimelapseModal,
  Wrapper,
};
