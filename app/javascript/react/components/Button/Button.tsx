import * as S from "./Button.style";
import React from "react";

interface ButtonProps {
  onClick: () => void;
  children: string;
}

const Button = ({ onClick, children }: ButtonProps) => (
  <S.HeaderButton onClick={onClick}>{children}</S.HeaderButton>
);

export { Button };
