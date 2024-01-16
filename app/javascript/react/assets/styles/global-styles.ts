import { createGlobalStyle } from "styled-components";

import { darkGray } from "./colors";

const GlobalStyles = createGlobalStyle`
  *,
  *::before,
  *::after {
    margin: 0;
    padding: 0;
    box-sizing: inherit;
  }

  html {
    font-size: 62.5%; /* equivalent to 10px; 1rem = 10px; 10px/16px */
  }

  body {
    box-sizing: border-box;
    font-family: 'Roboto';
    line-height: 1;
  }

  H1, H2, H3, H4, H5, H6 {
    line-height: 1.2;
    color: ${darkGray};
  }
`;

export default GlobalStyles;
