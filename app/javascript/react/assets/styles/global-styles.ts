import { createGlobalStyle } from "styled-components";

import { gray100, gray400 } from "./colors";

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

  html, body {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: auto;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale !important;
    text-rendering: optimizeLegibility;
    background-color: ${gray100};
    overscroll-behavior-y: contain; // Prevents the page from scrolling when the user scrolls past the top or bottom
  }

  H1, H2, H3, H4, H5, H6 {
    line-height: 1.2;
    color: ${gray400};
  }

  body:not(.user-is-tabbing) .gm-style iframe + div {
    border: none !important;
  }
`;

export default GlobalStyles;
