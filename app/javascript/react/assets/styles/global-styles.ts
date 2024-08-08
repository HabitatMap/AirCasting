import { createGlobalStyle, css, keyframes } from "styled-components";

import { gray100, gray400 } from "./colors";

const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(2.0);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

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

  body, button {
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

  // style for pulsating clusters
  .pulsating-marker {
      animation: ${css`
        ${pulseAnimation} 2s infinite
      `};
  }

  /* Scroll bar stylings */
::-webkit-scrollbar {
  width: 5px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background-color: transparent;
}

::-webkit-scrollbar-thumb {
  background-color: #888;
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}

@-moz-document url-prefix() {
    html {
        scrollbar-width: thin;
        scrollbar-color: #888 #F0F0F0;
    }

    ::-webkit-scrollbar {
        width: 12px;
    }

    ::-webkit-scrollbar-track {
        background: transparent;
    }

    ::-webkit-scrollbar-thumb {
        background-color: #888;;
        border-radius: 6px;
        border: 1px solid #F0F0F0;
    }

    ::-webkit-scrollbar-thumb:hover {
        background-color: #555;;
    }
}
`;

export default GlobalStyles;
