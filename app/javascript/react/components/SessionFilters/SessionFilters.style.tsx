import styled from "styled-components";

import {
  acBlue,
  gray100,
  gray200,
  gray300,
  gray400,
  gray600,
  white,
} from "../../assets/styles/colors";
import { Button } from "../Button/Button.style";
import { CloseButton } from "../Map/Legend/Legend.style";
import { SmallPopup } from "../Popups/Popups.style";

const SessionFilters = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: absolute;
  padding: 0 0.9rem 1.6rem 0.9rem;
  margin: 0.8rem 0 0 2rem;
  width: 30rem;
  border-radius: 10px;
  background-color: ${white};
`;

const Wrapper = styled.div`
  position: relative;
`;

const SingleFilterWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-top: 1.6rem;
  width: 100%;
`;

const SessionToggleWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  border-radius: 10px;
  height: 4.2rem;
  width: 100%;
`;

const Tab = styled.button<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 1rem 3rem;
  background-color: ${(props) => (props.$isActive ? acBlue : gray100)};
  border: none;
  text-transform: uppercase;
  font-size: 1.4rem;
  color: ${(props) => (props.$isActive ? white : gray300)};
  cursor: pointer;

  &:first-child {
    border-radius: 10px 0 0 10px;
  }

  &:nth-child(2) {
    border-radius: 0 10px 10px 0;
  }
`;

const IconWrapper = styled.div<{ $isActive: boolean; $src: string }>`
  margin-left: 0.8rem;
  background-color: ${(props) => (props.$isActive ? white : gray300)};
  mask: url(${(props) => props.$src});
  mask-size: 100% 100%;
  width: 2rem;
  height: 2rem;
`;

const MobileSessionFilters = styled(SessionFilters)`
  top: 0;
  z-index: 2;
  margin: 0;
  width: 100%;
  height: 100%;
`;

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  margin: 1.5rem 0;
`;

const HeaderTitle = styled.span`
  font-size: 1.6rem;
  margin-left: 1.6rem;

  &::first-letter {
    text-transform: uppercase;
  }
`;

const ShowSessionsButton = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  border: none;
  background-color: ${acBlue};
  color: ${white};
  font-size: 1.4rem;
  text-transform: uppercase;
`;

const Input = styled.input`
  border: 1px solid ${gray200};
  border-radius: 5px;
  width: 100%;
  font-size: 1.4rem;
  padding: 1.2rem 1.6rem;

  &::placeholder {
    color: ${gray600};
    text-transform: uppercase;
  }
`;

const SuggestionList = styled.ul<{ $displaySearchResults: boolean }>`
  max-height: 30rem;
  overflow: scroll;
  padding-top: 0.5rem;
  display: ${(p) => (p.$displaySearchResults ? "block" : "none")};
  position: absolute;
  background-color: ${white};
  width: 100%;
  border-radius: 5px;
  z-index: 1;
`;

const Suggestion = styled.li`
  font-size: 1.6rem;
  cursor: pointer;
  padding: 0.5rem;
  list-style: none;
`;

const SelectedItemsWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-top: 1rem;
`;

const SelectedItemTile = styled.div`
  display: flex;
  align-items: center;
  width: fit-content;
  border: 1px solid ${gray200};
  border-radius: 5px;
  padding: 0.5rem;
  margin: 0 0.5rem 0.5rem 0;
`;

const SelectedItem = styled.span`
  font-size: 1.4rem;
  margin-right: 0.5rem;
  color: ${gray400};
`;

const CloseSelectedItemButton = styled(CloseButton)`
  width: 1rem;
  height: 1rem;
`;

const InfoButton = styled.button`
  border: none;
  background-color: transparent;
  width: 1.8rem;
  height: 1.8rem;
  margin-left: 0.5rem;
`;

const InfoIcon = styled.img`
  width: 100%;
  height: 100%;
`;

const Info = styled.span`
  font-size: 1.4rem;
  color: ${gray400};
`;

const InfoPopup = styled(SmallPopup)`
  &-content {
    border: 1px solid ${gray200};
    width: 250px;
  }
`;

const CrowdMapButton = styled(Button)``;

export {
  CloseSelectedItemButton,
  CrowdMapButton,
  Header,
  HeaderTitle,
  IconWrapper,
  Info,
  InfoButton,
  InfoIcon,
  InfoPopup,
  Input,
  MobileSessionFilters,
  ModalContent,
  SelectedItem,
  SelectedItemsWrapper,
  SelectedItemTile,
  SessionFilters,
  SessionToggleWrapper,
  ShowSessionsButton,
  SingleFilterWrapper,
  Suggestion,
  SuggestionList,
  Tab,
  Wrapper,
};
