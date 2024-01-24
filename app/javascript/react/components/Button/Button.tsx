import React from "react";

import * as S from "./Button.style";

interface ButtonProps {
  onClick: () => void;
  children: string | JSX.Element | (JSX.Element | string)[];
}

const Button = ({ children, ...props }: ButtonProps) => (
  <S.Button {...props}>{children}</S.Button>
);


export { Button };
