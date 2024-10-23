import styled, { keyframes } from "styled-components";

import {
  acBlue,
  acBlueTransparent,
  gray100,
  gray200,
  gray300,
  gray400,
  gray500,
  gray600,
  lightBlue,
  lightBlueInfo,
  white,
} from "../../assets/styles/colors";
import { media } from "../../utils/media";
import { Button } from "../Button/Button.style";
import { SearchInput } from "../LocationSearch/LocationSearch.style";
import { CloseButton } from "../Map/Legend/Legend.style";
import { SmallPopup } from "../Popups/Popups.style";
import { H4, H6 } from "../Typography";

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-1.5rem);
    max-height: 0;
  }
  to {
    opacity: 1;
    transform: translateY(0);
    max-height: 33rem;
  }
`;

const fadeOut = keyframes`
  from {
    opacity: 1;
    transform: translateY(0);
    max-height: 33rem;
  }
  to {
    opacity: 0;
    transform: translateY(-1.5rem);
    max-height: 0;
  }
`;

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

const SingleFilterWrapper = styled.div<{ $noMarginTop?: boolean }>`
  display: flex;
  align-items: center;
  margin-top: ${(props) => (props.$noMarginTop ? 0 : "1.6rem")};
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
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  bottom: 0;
  top: 0;
  z-index: 6;
  margin: 0;
  width: 100%;
`;

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  position: sticky;
  background-color: ${white};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  margin: 1.5rem 0;
`;

const HeaderTitle = styled.span`
  font-size: 1.6rem;
  margin-left: 1.2rem;

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
  margin-top: 1rem;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
`;

const Input = styled.input`
  border: 1px solid ${gray200};
  border-radius: 5px;
  width: 100%;
  font-size: 1.6rem;
  padding: 1.2rem 1.6rem;

  &::placeholder {
    color: ${gray600};
    text-transform: uppercase;
  }

  @media ${media.desktop} {
    font-size: 1.4rem;
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

const CrowdMapGridSizeWrapper = styled.div<{ $isVisible: boolean }>`
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto auto;
  grid-gap: 0.4rem;
  justify-content: center;
  align-items: center;
  text-transform: uppercase;
  font-size: 1.4rem;
  color: ${gray300};
  letter-spacing: 0.01em;

  overflow: hidden;
  max-height: ${({ $isVisible }) => ($isVisible ? "33rem" : "0")};
  animation: ${({ $isVisible }) => ($isVisible ? fadeIn : fadeOut)} 0.5s ease
    forwards;
  opacity: ${({ $isVisible }) => ($isVisible ? 1 : 0)};
  transform: ${({ $isVisible }) =>
    $isVisible ? "translateY(0)" : "translateY(-1.5rem)"};
  transition: max-height 1s ease, opacity 0.5s ease, transform 0.5s ease;
`;

const SectionButtonsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  justify-content: space-between;
  grid-gap: 0.8rem;
`;

const SectionButton = styled(Button)<{ $isActive: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  text-transform: uppercase;
  border: none;
  background-color: ${(props) => (props.$isActive ? acBlue : gray100)};
  color: ${(props) => (props.$isActive ? white : gray300)};
  min-width: 3.8rem;
  transition: background-color 0.4s ease, color 0.3s ease;
  height: 25px;
`;

const ToggleSettingsContainer = styled.div<{ $isActive: boolean }>`
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto auto;
  grid-gap: ${({ $isActive }) => ($isActive ? "0.8rem" : "0")};
  justify-content: center;
  align-items: center;
  border: 1px solid ${gray200};
  min-height: 4.2rem;
  width: 100%;
  padding: 1.1rem 1.6rem;
  border-radius: 0.5rem;
`;

const ToggleWrapper = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  grid-gap: 0.8rem;
  align-items: center;
  font-size: 1.4rem;
  color: ${gray600};
  width: 100%;
`;

const CrowdMapToggleText = styled.span<{ $isActive?: boolean }>`
  &::first-letter {
    text-transform: uppercase;
  }
`;

const CrowdMapToggleOnOff = styled.span`
  text-transform: uppercase;
  font-weight: 700;
`;

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

const FiltersOptionButton = styled(Button)<{ $isSelected: boolean }>`
  gap: 0;
  padding: 0.5rem 0.8rem;
  margin-bottom: 0.8rem;
  min-width: 12rem;
  height: 3rem;
  justify-content: flex-start;
  color: ${(props) => (props.$isSelected ? acBlue : gray300)};
  border: 1px solid ${gray500};
  border-color: ${(props) => props.$isSelected && lightBlue};
  font-size: 1.2rem;
  text-transform: capitalize;
  white-space: nowrap;

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
  margin-top: 0.3rem;
`;

const Description = styled.p`
  font-size: 1.2rem;
  line-height: 1.45rem;
  opacity: 50%;
`;

const ButtonsWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  position: sticky;
  /* bottom: 1.6rem; */
  height: 4.2rem;
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
  margin-top: 0;
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
  color: ${(props) => (props.$isActive ? acBlue : gray400)};
  margin: 0;
`;

const GrayButton = styled(Button)`
  display: flex;
  justify-content: center;
  align-items: center;
  text-transform: uppercase;
  border: none;
  background-color: ${gray100};
  color: ${gray400};
  width: 97%;
  align-self: center;
`;

const CustomParameterWrapper = styled.div``;

const CustomParametersListWrapper = styled.div`
  height: calc(100% - (10.5rem + 4.2rem + 1.6rem));

  @media (${media.desktop}) {
    height: auto;
  }
`;

const CustomParameterSearch = styled.div`
  display: flex;
`;

const CustomParametersInput = styled(SearchInput)`
  height: 3.2rem;
  width: 100%;
  background-size: 2.2rem;
  font-size: 1.6rem;
  color: ${gray300};
  padding: 1.8rem 4rem;
  margin-top: 0.8rem;
  background-position-x: 0.7rem;
  box-shadow: none;
  border-radius: 5px;
  border: 1px solid ${gray300};

  @media (${media.desktop}) {
    height: 2.4rem;
    width: 21rem;
    background-size: 0.9rem;
    font-size: 1rem;
    padding: 0.5rem 2.4rem;
    background-position-x: 0.7rem;
    border: 1px solid ${gray500};
  }
`;

const Hr = styled.hr`
  display: block;
  margin: 2rem 3rem;
  border: 1px solid ${gray200};
`;

const CustomParameterList = styled.ul`
  list-style: none;
  display: grid;
  grid-template-columns: 1fr;
  column-gap: 0.5rem;
  overflow-y: auto;
  padding-top: 1.8rem;
  height: 100%;

  @media (${media.desktop}) {
    grid-template-columns: 1fr 1fr;
    max-height: 40rem;
    margin-top: 0.8rem;
    padding-top: 0;
    overflow-x: hidden;
  }
`;

const CustomParameterItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.2rem;
  padding-right: 1rem;
`;

const CustomParameter = styled.button<{ $isActive?: boolean }>`
  border: none;
  background-color: transparent;
  color: ${(props) => (props.$isActive ? acBlue : gray400)};
  font-size: 1.6rem;
  text-align: left;
  white-space: nowrap;
  margin-bottom: 0.8rem;
  @media (${media.desktop}) {
    font-size: 1.2rem;
    color: ${gray300};
  }
`;

const DesktopCustomParameters = styled.div`
  display: none;
  @media (${media.desktop}) {
    display: flex;
  }
`;

const MobileCustomParameters = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-between;
  @media (${media.desktop}) {
    display: none;
  }
`;

const IndoorToggleHeading = styled.span`
  font-size: 1rem;
  text-transform: uppercase;
  color: ${gray600};
  margin-top: 1.6rem;
`;

const IndoorFilterWrapper = styled.div`
  width: 100%;
`;

const IndoorToggleWrapper = styled(SessionToggleWrapper)<{
  $isIndoor: boolean;
}>`
  border-radius: ${(props) => props.$isIndoor && "10px 10px 0 0"};
  margin-top: 0.5rem;
`;

const IndoorTab = styled(Tab)<{
  $isIndoor: boolean;
}>`
  &:first-child {
    border-radius: ${(props) => props.$isIndoor && "10px 0 0 0"};
  }

  &:nth-child(2) {
    border-radius: ${(props) => props.$isIndoor && "0 10px 0px 0"};
  }
`;

const IndoorToggleInfoWrapper = styled.div`
  padding: 0.8rem 1rem;
  border-radius: 0 0 10px 10px;
  background-color: ${lightBlueInfo};
`;

const IndoorToggleInfoText = styled.span`
  font-size: 1.2rem;
  display: block;

  &:nth-child(2) {
    margin-top: 0.5rem;
  }
`;

const YearPickerWrapper = styled.div`
  border: 1px solid ${gray200};
  border-radius: 0.5rem;
  color: ${gray600};
  display: grid;
  font-size: 1rem;
  grid-gap: 0.4rem;
  letter-spacing: 0.01em;
  overflow: hidden;
  padding: 1.1rem 1.6rem;
  text-transform: uppercase;
  width: 100%;
`;

const DormantYearPickerWrapper = styled.div`
  border-top: 1px solid ${gray200};
  border-bottom: none;
  border-left: none;
  border-right: none;
  border-radius: 0;
  padding: 0.8rem 0 0 0;
  font-size: 1rem;
  display: grid;
  grid-gap: 0.4rem;
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
  CrowdMapGridSizeWrapper,
  CrowdMapToggleOnOff,
  CrowdMapToggleText,
  CustomParameter,
  CustomParameterItem,
  CustomParameterList,
  CustomParameterSearch,
  CustomParametersInput,
  CustomParametersListWrapper,
  CustomParameterWrapper,
  Description,
  DesktopCustomParameters,
  DormantYearPickerWrapper,
  FiltersOptionButton,
  FiltersOptionHeading,
  FiltersOptionsWrapper,
  GrayButton,
  Header,
  HeaderTitle,
  Hr,
  IconWrapper,
  IndoorFilterWrapper,
  IndoorTab,
  IndoorToggleHeading,
  IndoorToggleInfoText,
  IndoorToggleInfoWrapper,
  IndoorToggleWrapper,
  Info,
  InfoButton,
  InfoIcon,
  InfoPopup,
  Input,
  InputWrapper,
  MinorShowSessionsButton,
  MobileCustomParameters,
  MobileSessionFilters,
  ModalContent,
  SectionButton,
  SectionButtonsContainer,
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
  ToggleSettingsContainer,
  ToggleWrapper,
  Wrapper,
  YearPickerWrapper,
};
