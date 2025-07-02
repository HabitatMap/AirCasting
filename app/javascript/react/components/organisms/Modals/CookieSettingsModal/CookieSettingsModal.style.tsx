import Popup from "reactjs-popup";
import styled from "styled-components";

import {
  acBlue,
  blue,
  gray100,
  gray400,
  gray600,
  white,
} from "../../../../assets/styles/colors";
import { media } from "../../../../utils/media";
import { Button } from "../../../atoms/Button/Button.style";

const CookieSettingsModal = styled(Popup)`
  width: 100%;

  &-overlay {
    z-index: 1000;
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
    max-height: 80vh;
    overflow-y: auto;
    margin: 2rem auto;

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
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;

  @media ${media.mobile} {
    font-size: 1.3rem;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${gray100};
  }

  img {
    width: 1.5rem;
    height: 1.5rem;
  }
`;

const Description = styled.p`
  color: ${gray600};
  font-size: 1rem;
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
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
`;

const PreferenceDescription = styled.p`
  color: ${gray600};
  font-size: 0.9rem;
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
    flex-direction: column;
    gap: 0.75rem;
  }
`;

const RejectAllButton = styled(Button)`
  background-color: ${gray400};
  color: ${white};
  font-weight: 600;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 0.9rem;
  text-transform: uppercase;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${gray600};
  }

  @media ${media.mobile} {
    width: 100%;
    padding: 1rem;
  }
`;

const SaveButton = styled(Button)`
  background-color: ${blue};
  color: ${white};
  font-weight: 600;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 0.9rem;
  text-transform: uppercase;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${acBlue};
  }

  @media ${media.mobile} {
    width: 100%;
    padding: 1rem;
  }
`;

const AcceptAllButton = styled(Button)`
  background-color: transparent;
  color: ${acBlue};
  font-weight: 600;
  border: 2px solid ${acBlue};
  padding: 0.75rem 1.5rem;
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
    width: 100%;
    padding: 1rem;
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
