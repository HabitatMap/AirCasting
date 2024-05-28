import styled from "styled-components";

import searchIconGray from "../../assets/icons/searchIconGray.svg";
import { blue, gray500, white } from "../../assets/styles/colors";
import { media } from "../../utils/media";

interface SuggestionProps {
  $isHighlighted?: boolean;
}

const Suggestion = styled.li<SuggestionProps>`
  cursor: pointer;
  padding: 0.5rem;
  font-size: 1.6rem;
  background-color: ${(p) => p.$isHighlighted && blue};
`;

const SuggestionsList = styled.ul`
  background-color: ${white};
  position: absolute;
  top: 100%;
  list-style: none;
  left: 0;
  width: 100%;
  z-index: 1000;

  @media ${media.smallDesktop} {
    width: 103.5%;
  }
`;

const SearchInput = styled.input`
  width: 26.9rem;
  height: 3.2rem;
  border-radius: 20px;
  border: none;
  box-shadow: 2px 2px 4px 0px rgba(76, 86, 96, 0.1);
  background: ${white} url(${searchIconGray}) 12px center no-repeat;
  background-size: 16px;
  font-size: 1.6rem;
  padding-left: 3.8rem;

  @media ${media.smallDesktop} {
    width: 36.8rem;
    height: 4.2rem;
    font-size: 1.6rem;
    padding: 0 1.6rem;
    border-radius: 50px;
    border: 1px solid ${gray500};
    background: ${white} url(${searchIconGray}) 16px center no-repeat;
    background-size: 20px;
    padding-left: 4.8rem;
    box-shadow: none;
  }
`;

const LocationSearchButton = styled.button`
  background-color: transparent;
  cursor: pointer;
  border: none;
`;

const SearchContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

export {
  Suggestion,
  SuggestionsList,
  SearchInput,
  LocationSearchButton,
  SearchContainer,
};