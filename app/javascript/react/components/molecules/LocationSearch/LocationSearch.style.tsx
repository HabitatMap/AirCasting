import styled from "styled-components";

import searchIconGray from "../../../assets/icons/searchIconGray.svg";
import { gray400, gray500, white } from "../../../assets/styles/colors";
import { media } from "../../../utils/media";

interface SuggestionProps {
  $isHighlighted?: boolean;
}

const Suggestion = styled.li<SuggestionProps>`
  cursor: pointer;
  padding: 0.5rem;
  font-size: 1.6rem;
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
    box-shadow: none;
  }

  @media ${media.largeDesktop} {
    width: 36.8rem;
  }
`;

const LocationSearchButton = styled.button`
  background-color: ${white};
  height: 4rem;
  border-radius: 50%;
  cursor: pointer;
  border: none;
  z-index: 2;

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

export {
  Hr,
  LocationSearchButton,
  LocationSearchIcon,
  SearchContainer,
  SearchInput,
  Suggestion,
  SuggestionsList,
};
