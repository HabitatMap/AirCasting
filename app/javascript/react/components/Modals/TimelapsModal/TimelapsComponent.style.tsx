import Popup from "reactjs-popup";
import styled from "styled-components";

import { white } from "../../../assets/styles/colors";
import { media } from "../../../utils/media";

const TimelapsModal = styled(Popup)`
  width: 115rem;
  height: 10rem;

  &-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    pointer-events: none !important;
    z-index: 2;
  }

  &-content {
    width: 115rem;
    height: 10rem;
    background-color: ${white};
    padding: 0.5rem;
    border-radius: 10px 10px 0 0;
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
  top: 0.5rem;
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
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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

export { CancelButtonX, SmallPopup, TimelapsModal, Wrapper };
