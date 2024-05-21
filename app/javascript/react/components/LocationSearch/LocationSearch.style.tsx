import styled from "styled-components";

import { blue, white } from "../../assets/styles/colors";
import searchIconGray from "../../assets/icons/searchIconGray.svg";

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
`;

const SearchInput = styled.input`
  width: 36.8rem;
  height: 4.2rem;
  font-size: 1.6rem;
  padding: 0 1.6rem;
  border-radius: 50px;
  border: 1px solid rgba(198, 205, 211, 1);
  background: ${white} url(${searchIconGray}) 16px center no-repeat;
  background-size: 20px;
  padding-left: 48px;
`;

const LocationSearchButton = styled.button`
  background-color: transparent;
  cursor: pointer;
  border: none;
`;

const SearchContainer = styled.div`
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
