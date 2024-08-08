import React from "react";

import * as S from "./Loader.style";

interface LoaderProps {
  width?: string;
}

const Loader = ({ width = "50px" }: LoaderProps) => (
  <S.Container>
    <S.Loader width={width}>
      <S.Logo
        viewBox="0 0 19 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M15.5132 20.0739H10.8951L9.88775 23.1112H7.4082L11.8094 10.5349H14.6144L19.0001 23.1112H16.5205L15.5132 20.0739ZM14.8778 18.1123L13.2816 13.2558H13.1421L11.5459 18.1123H14.8778Z" />
        <path d="M11.8398 0V1.36045C6.04389 1.36045 1.31726 6.1853 1.31726 12.1017H0C0 5.42598 5.31552 0 11.8398 0Z" />
        <path d="M11.8403 2.73682V4.08145C7.50112 4.08145 3.98327 7.68822 3.98327 12.1018H2.66602C2.66602 6.9289 6.78825 2.73682 11.8403 2.73682Z" />
        <path d="M11.8393 5.63159V6.99204C9.06532 6.99204 6.81823 9.28582 6.81823 12.1175H5.50098C5.50098 8.5265 8.35245 5.63159 11.8393 5.63159Z" />
      </S.Logo>
    </S.Loader>
  </S.Container>
);

export { Loader };
