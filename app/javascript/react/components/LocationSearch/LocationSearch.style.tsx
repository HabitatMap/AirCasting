import styled from "styled-components";

import { blue, white } from "../../assets/styles/colors";

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

export { Suggestion, SuggestionsList };
