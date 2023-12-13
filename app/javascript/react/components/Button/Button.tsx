import React from "react";

import * as S from "./Button.style";

interface ButtonProps {
  onClick: () => void;
  children: string | JSX.Element | (JSX.Element | string)[];
}

const Button = ({ onClick, children }: ButtonProps) => (
  <S.Button onClick={onClick}>{children}</S.Button>
);

export { Button };
