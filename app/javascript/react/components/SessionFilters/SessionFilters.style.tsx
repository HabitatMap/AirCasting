import styled from "styled-components";

import {
  acBlue,
  acBlueTransparent,
  black,
  gray100,
  gray200,
  gray300,
  gray400,
  gray500,
  gray600,
  lightBlue,
  white,
} from "../../assets/styles/colors";
import { Button } from "../Button/Button.style";
import { CloseButton } from "../Map/Legend/Legend.style";
import { SmallPopup } from "../Popups/Popups.style";
import { H4, H6 } from "../Typography";

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
  top: 6rem;
  overflow-y: scroll;
  overflow-x: hidden;
  padding-top: 0.5rem;
  display: ${(p) => (p.$displaySearchResults ? "block" : "none")};
  position: absolute;
  background-color: ${white};
  width: 100%;
  border: 1px solid ${gray200};
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

const SelectedOptionButton = styled(Button)<{ $isActive: boolean }>`
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0.6rem 1.6rem;
  background-color: ${(props) => props.$isActive && acBlueTransparent};
  border-color: ${(props) => props.$isActive && acBlue};
`;

const SelectedOptionHeadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
`;

const SelectedOptionHeading = styled(H6)<{ $isSelected: boolean }>`
  text-transform: uppercase;
  color: ${(props) => (props.$isSelected ? gray400 : gray600)};
  opacity: ${(props) => props.$isSelected && 0.5};
`;

const SelectedOption = styled(H4)<{ $isSelected: boolean }>`
  color: ${(props) => (props.$isSelected ? gray400 : gray300)};
`;

const ChevronIcon = styled.img<{ $isActive?: boolean; $src: string }>`
  width: 1rem;
  height: 2rem;
  background-color: ${(props) => (props.$isActive ? acBlue : gray300)};
  mask: url(${(props) => props.$src});
  mask-size: 100% 100%;
`;

const FiltersOptionsWrapper = styled(SessionFilters)`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 1.6rem;
  margin: 0;
  z-index: 3;
  left: 105%;
  top: 1.6rem;
  border-top-left-radius: 0;
  width: fit-content;
`;

const FiltersOptionHeading = styled.span`
  font-size: 1.2rem;
  text-transform: uppercase;
  margin-bottom: 0.8rem;
  color: ${gray300};
`;

const FiltersOptonButton = styled(Button)<{ $isSelected: boolean }>`
  gap: 0;
  padding: 0.5rem 0.8rem;
  margin-bottom: 0.8rem;
  width: 12rem;
  height: 2.4rem;
  justify-content: flex-start;
  color: ${(props) => (props.$isSelected ? acBlue : gray300)};
  border: 1px solid ${gray500};
  border-color: ${(props) => props.$isSelected && lightBlue};
  font-size: 1.2rem;
  text-transform: capitalize;

  &:last-of-type {
    margin-bottom: 0;
  }
`;

const SeeMoreButton = styled.button`
  display: flex;
  align-items: center;
  align-self: end;
  border: none;
  background-color: transparent;
`;

const SeeMoreSpan = styled.span`
  font-size: 1.2rem;
  color: ${gray300};
  margin-right: 0.2rem;

  &::first-letter {
    text-transform: uppercase;
  }
`;

const BasicParameterWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const ChevronBackButton = styled.button`
  border: none;
  background-color: transparent;
`;

const Description = styled.p`
  font-size: 1.2rem;
  line-height: 1.45rem;
  opacity: 50%;
`;

const ButtonsWrapper = styled.div`
  display: flex;
  justify-content: space-between;
`;

const BackButton = styled(Button)`
  display: flex;
  justify-content: center;
  align-items: center;
  text-transform: uppercase;
  border: none;
  background-color: ${gray100};
  color: ${gray400};
  margin-right: 1rem;
  flex-grow: 2;
`;

const MinorShowSessionsButton = styled(ShowSessionsButton)`
  width: fit-content;
  flex-grow: 3;
`;

const BasicParameterButtonsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 2rem;
`;

const BasicParameterButton = styled.button`
  border: none;
  background-color: transparent;
  display: flex;
  justify-content: space-between;
  margin-bottom: 2.4rem;
  padding-right: 1rem;
`;

const ButtonSpan = styled(HeaderTitle)<{ $isActive: boolean }>`
  color: ${(props) => (props.$isActive ? acBlue : black)};
  margin: 0;
`;

export {
  BackButton,
  BasicParameterButton,
  BasicParameterButtonsWrapper,
  BasicParameterWrapper,
  ButtonSpan,
  ButtonsWrapper,
  ChevronBackButton,
  ChevronIcon,
  CloseSelectedItemButton,
  CrowdMapButton,
  Description,
  FiltersOptionHeading,
  FiltersOptionsWrapper,
  FiltersOptonButton,
  Header,
  HeaderTitle,
  IconWrapper,
  Info,
  InfoButton,
  InfoIcon,
  InfoPopup,
  Input,
  MinorShowSessionsButton,
  MobileSessionFilters,
  ModalContent,
  SeeMoreButton,
  SeeMoreSpan,
  SelectedItem,
  SelectedItemsWrapper,
  SelectedItemTile,
  SelectedOption,
  SelectedOptionButton,
  SelectedOptionHeading,
  SelectedOptionHeadingWrapper,
  SessionFilters,
  SessionToggleWrapper,
  ShowSessionsButton,
  SingleFilterWrapper,
  Suggestion,
  SuggestionList,
  Tab,
  Wrapper,
};
