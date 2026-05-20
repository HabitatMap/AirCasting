import styled, { keyframes } from "styled-components";

import searchIconGray from "../../../assets/icons/searchIconGray.svg";
import {
  acBlue,
  acBlueDark,
  gray300,
  gray350,
  gray400,
  gray500,
  white,
} from "../../../assets/styles/colors";
import { media } from "../../../utils/media";

interface SuggestionProps {
  $isHighlighted?: boolean;
}

const Suggestion = styled.li<SuggestionProps>`
  cursor: pointer;
  padding: 0.8rem 0.8rem;
  min-height: 4.4rem;
  display: flex;
  align-items: center;
  font-size: 1.6rem;
  color: ${gray400};
  border-radius: 4px;
  background-color: ${(p) =>
    p.$isHighlighted ? `rgba(0, 178, 239, 0.08)` : `transparent`};

  &:hover {
    background-color: rgba(0, 178, 239, 0.08);
  }

  @media ${media.mediumDesktop} {
    min-height: 3.6rem;
    padding: 0.5rem 0.8rem;
  }
`;

const SuggestionLabel = styled.span`
  flex: 1;
  min-width: 0;
  line-height: 1.3;
  word-break: break-word;
`;

const LiveRegion = styled.div`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

const SuggestionsList = styled.ul<{ $displaySearchResults?: boolean }>`
  background-color: ${(p) => (p.$displaySearchResults ? `${white}` : `none`)};
  position: absolute;
  top: 20%;
  list-style: none;
  left: 0;
  border: none;
  border-radius: 20px;
  box-shadow: ${(p) =>
    p.$displaySearchResults ? `2px 2px 4px 0px rgba(76, 86, 96, 0.1)` : `none`};
  padding: 30px 0 8px 8px;
  width: 19rem;
  z-index: 2;
  color: ${gray400};

  @media ${media.smallMobile} {
    width: 20rem;
  }

  @media ${media.smallDesktop} {
    width: 26rem;
  }

  @media ${media.mediumDesktop} {
    padding: 10px 0 8px 8px;
    border-radius: 0px 0px 10px 10px;
    top: 100%;
    z-index: 1;
  }
  @media ${media.largeDesktop} {
    width: 36.8rem;
  }
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchInput = styled.input<{ $displaySearchResults?: boolean }>`
  width: 19rem;
  height: 3.2rem;
  border-radius: ${(p) =>
    p.$displaySearchResults ? `15px 15px 0px 0px` : `20px`};
  border: none;
  box-shadow: ${(p) =>
    p.$displaySearchResults
      ? `0px 2px 0px 0px rgba(76, 86, 96, 0.1)`
      : `2px 2px 4px 0px rgba(76, 86, 96, 0.1)`};
  background: ${white} url(${searchIconGray}) 12px center no-repeat;
  background-size: 16px;
  font-size: 1.6rem;
  padding-left: 3.8rem;
  padding-right: 3.2rem;
  outline: none;
  z-index: 3;
  color: ${gray400};

  @media ${media.smallMobile} {
    width: 20rem;
  }

  @media ${media.smallDesktop} {
    width: 26rem;
  }

  @media ${media.mediumDesktop} {
    height: 4.2rem;
    font-size: 1.6rem;
    padding: 0 1.6rem;
    border-radius: 50px;
    border: ${(p) =>
      p.$displaySearchResults ? `none` : `1px solid ${gray500}`};
    background: ${white} url(${searchIconGray}) 16px center no-repeat;
    background-size: 20px;
    padding-left: 4.8rem;
    padding-right: 4rem;
    box-shadow: none;
  }

  @media ${media.largeDesktop} {
    width: 36.8rem;
  }
`;

const LocationSearchButton = styled.button`
  background-color: ${white};
  height: 4.4rem;
  min-width: 4.4rem;
  border-radius: 50%;
  cursor: pointer;
  border: none;
  z-index: 2;

  &:focus-visible {
    outline: 2px solid ${acBlue};
    outline-offset: 2px;
  }

  @media ${media.mediumDesktop} {
    height: 4.2rem;
    background-color: transparent;
  }
`;

const LocationSearchIcon = styled.img`
  width: 4rem;
  height: 4rem;

  @media ${media.mediumDesktop} {
    width: 4.2rem;
    height: 4.2rem;
  }
`;

const SearchContainer = styled.div<{ $isTimelapseView: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 70vw;

  @media ${media.smallMobile} {
    gap: 1rem;
  }

  @media ${media.smallDesktop} {
    width: auto;
  }

  ${(props) =>
    props.$isTimelapseView &&
    `opacity: 0.7;
    pointer-events: none;`}
`;

const Hr = styled.hr<{ $displaySearchResults?: boolean }>`
  visibility: hidden;

  @media ${media.mediumDesktop} {
    visibility: ${(p) => (p.$displaySearchResults ? `visible` : `hidden`)};
    border-top: 1px solid ${gray500};
    width: 97%;
  }
`;

const RecentSectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.2rem 0.8rem 0.4rem 0.5rem;
`;

const RecentSectionLabel = styled.span`
  font-size: 1.2rem;
  font-weight: 600;
  color: ${gray300};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const ClearRecentsButton = styled.button`
  background-color: transparent;
  color: ${acBlueDark};
  border: none;
  font-size: 1.2rem;
  text-transform: uppercase;
  cursor: pointer;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid ${acBlue};
    outline-offset: 2px;
  }
`;

const spin = keyframes`
  from { transform: translateY(-50%) rotate(0deg); }
  to { transform: translateY(-50%) rotate(360deg); }
`;

const Spinner = styled.div`
  position: absolute;
  top: 50%;
  right: 1.2rem;
  transform: translateY(-50%);
  width: 1.6rem;
  height: 1.6rem;
  border: 2px solid ${gray500};
  border-top-color: ${acBlue};
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
  z-index: 4;
  pointer-events: none;
  box-sizing: border-box;

  @media ${media.mediumDesktop} {
    width: 2rem;
    height: 2rem;
    right: 1.6rem;
  }

  @media (prefers-reduced-motion: reduce) {
    animation-duration: 2s;
  }
`;

const ClearInputButton = styled.button`
  position: absolute;
  top: 50%;
  right: 1.2rem;
  transform: translateY(-50%);
  width: 2rem;
  height: 2rem;
  padding: 0;
  background: transparent;
  color: #888;
  border: none;
  font-size: 2.4rem;
  font-weight: 400;
  line-height: 1;
  cursor: pointer;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;

  @media ${media.mediumDesktop} {
    width: 2.4rem;
    height: 2.4rem;
    font-size: 2.8rem;
    right: 1.6rem;
  }

  &:hover {
    color: ${gray350};
  }

  &:focus-visible {
    outline: 2px solid ${acBlue};
    outline-offset: 2px;
    border-radius: 50%;
  }
`;

const EmptyState = styled.li`
  padding: 1.2rem 0.8rem;
  font-size: 1.4rem;
  color: ${gray300};
  font-style: italic;
  list-style: none;
`;

const ErrorState = styled.li`
  padding: 1.2rem 0.8rem;
  font-size: 1.4rem;
  color: #b71c1c;
  list-style: none;
`;

const Highlight = styled.strong`
  font-weight: 700;
  color: ${gray400};
`;

export {
  ClearInputButton,
  ClearRecentsButton,
  EmptyState,
  ErrorState,
  Highlight,
  Hr,
  InputWrapper,
  LiveRegion,
  LocationSearchButton,
  LocationSearchIcon,
  RecentSectionHeader,
  RecentSectionLabel,
  SearchContainer,
  SearchInput,
  Spinner,
  Suggestion,
  SuggestionLabel,
  SuggestionsList,
};
