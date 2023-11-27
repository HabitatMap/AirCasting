import React from "react";

import * as S from "./Button.style";

interface ButtonProps {
  onClick: () => void;
  children: string | JSX.Element | (JSX.Element | string)[];
}

const Button = ({ onClick, children }: ButtonProps) => (
  <S.HeaderButton onClick={onClick}>{children}</S.HeaderButton>
);

export { Button };
