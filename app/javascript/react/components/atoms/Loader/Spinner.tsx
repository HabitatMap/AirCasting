import React from "react";

import { gray200 } from "../../../assets/styles/colors";
import * as S from "./Loader.style";

const Spinner = () => (
  <S.SpinnerWrapper>
    <S.SpinnerSvg
      viewBox="0 0 50 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="25"
        cy="25"
        r="20"
        stroke={gray200}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="80 30"
      />
    </S.SpinnerSvg>
  </S.SpinnerWrapper>
);

export { Spinner };
