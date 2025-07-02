import Popup from "reactjs-popup";
import styled from "styled-components";

import {
  acBlue,
  blue,
  gray100,
  gray300,
  gray600,
  white,
} from "../../../../assets/styles/colors";
import { media } from "../../../../utils/media";
import { Button } from "../../../atoms/Button/Button.style";

const CookieSettingsModal = styled(Popup)`
  width: 100%;

  &-overlay {
    z-index: 1000;
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
    border-radius: 12px;
    position: relative;
    padding: 2rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    max-width: 600px;
    width: 90vw;
    margin: 0;
    transform: none;
    top: auto;
    left: auto;
    right: auto;
    bottom: auto;

    @media ${media.mobile} {
      margin: 1rem;
      padding: 1.5rem;
      width: calc(100vw - 2rem);
    }
  }
`;

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${gray100};
`;

const Title = styled.h2`
  color: ${acBlue};
  font-size: 2rem;
  font-weight: 700;
  margin: 0;

  @media ${media.mobile} {
    font-size: 1.5rem;
  }
`;

const CloseButton = styled.button`
  border: none;
  background-color: transparent;
  cursor: pointer;

  body:not(.user-is-tabbing) &:focus-visible {
    outline: none;
  }
`;

const Description = styled.p`
  color: ${gray300};
  font-size: 1.4rem;
  line-height: 1.5;
  margin: 0;
`;

const PreferencesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const PreferenceItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid ${gray100};
  border-radius: 8px;
  background-color: ${white};

  @media ${media.mobile} {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
`;

const PreferenceInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const PreferenceTitle = styled.h3`
  color: ${acBlue};
  font-size: 1.4rem;
  font-weight: 600;
  margin: 0;
`;

const PreferenceDescription = styled.p`
  color: ${gray300};
  font-size: 1.2rem;
  line-height: 1.4;
  margin: 0;
`;

const ActionsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid ${gray100};

  @media ${media.mobile} {
    flex-direction: row;
    gap: 0.5rem;
    justify-content: center;
  }
`;

const RejectAllButton = styled(Button)`
  background-color: ${gray100};
  color: ${gray300};
  font-weight: 600;
  border: none;
  padding: 0.75rem 2.5rem;
  border-radius: 6px;
  font-size: 0.9rem;
  text-transform: uppercase;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${gray600};
  }

  @media ${media.mobile} {
    padding: 0.6rem 1.5rem;
    font-size: 0.8rem;
  }
`;

const SaveButton = styled(Button)`
  background-color: ${blue};
  color: ${white};
  font-weight: 600;
  border: none;
  padding: 0.75rem 2.5rem;
  border-radius: 6px;
  font-size: 0.9rem;
  text-transform: uppercase;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${acBlue};
  }

  @media ${media.mobile} {
    padding: 0.6rem 1.5rem;
    font-size: 0.8rem;
  }
`;

const AcceptAllButton = styled(Button)`
  background-color: transparent;
  color: ${acBlue};
  font-weight: 600;
  border: 2px solid ${acBlue};
  padding: 0.75rem 2.5rem;
  border-radius: 6px;
  font-size: 0.9rem;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${acBlue};
    color: ${white};
  }

  @media ${media.mobile} {
    padding: 0.6rem 1.5rem;
    font-size: 0.8rem;
  }
`;

export {
  AcceptAllButton,
  ActionsContainer,
  CloseButton,
  CookieSettingsModal,
  Description,
  Header,
  ModalContent,
  PreferenceDescription,
  PreferenceInfo,
  PreferenceItem,
  PreferencesContainer,
  PreferenceTitle,
  RejectAllButton,
  SaveButton,
  Title,
};
