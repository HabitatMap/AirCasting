import Popup from "reactjs-popup";
import styled from "styled-components";

import {
  acBlue,
  cta,
  gray100,
  gray400,
  white,
} from "../../../../assets/styles/colors";
import { media } from "../../../../utils/media";
import { Button } from "../../../atoms/Button/Button.style";

const SurveyPopup = styled(Popup)`
  width: 100%;

  &-overlay {
    z-index: 1100;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

  &-content {
    background-color: ${white};
    opacity: 1;
    border-radius: 16px;
    position: relative;
    padding: 0;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
    max-width: 520px;
    width: 90vw;
    margin: 0;
    overflow: hidden;

    @media ${media.mobile} {
      margin: 1rem;
      width: calc(100vw - 2rem);
    }
  }
`;

const Hero = styled.div`
  position: relative;
  width: 100%;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media ${media.mobile} {
    height: 160px;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  border: none;
  background-color: ${white};
  cursor: pointer;
  padding: 0;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

  img {
    width: 14px;
    height: 14px;
    object-fit: contain;
  }

  &:hover {
    background-color: ${gray100};
  }

  body:not(.user-is-tabbing) &:focus-visible {
    outline: none;
  }
`;

const Body = styled.div`
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  @media ${media.mobile} {
    padding: 1.5rem;
  }
`;

const Title = styled.h2`
  color: ${acBlue};
  font-size: 2.4rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;

  @media ${media.mobile} {
    font-size: 2rem;
  }
`;

const Description = styled.p`
  color: ${gray400};
  font-size: 1.6rem;
  line-height: 1.5;
  margin: 0;

  @media ${media.mobile} {
    font-size: 1.5rem;
  }
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid ${gray100};

  @media ${media.mobile} {
    flex-direction: column-reverse;
    align-items: stretch;
    gap: 0.5rem;
  }
`;

const PrimaryButton = styled(Button)`
  background-color: ${cta};
  color: ${gray400};
  font-weight: 700;
  border: none;
  padding: 1.1rem 2.2rem;
  border-radius: 8px;
  font-size: 1.6rem;
  cursor: pointer;
  transition: filter 0.2s, transform 0.1s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    filter: brightness(0.95);
  }

  &:active {
    transform: scale(0.98);
  }
`;

export {
  Actions,
  Body,
  CloseButton,
  Description,
  Hero,
  PrimaryButton,
  SurveyPopup,
  Title,
};
