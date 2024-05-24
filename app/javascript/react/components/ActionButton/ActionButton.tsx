import React from "react";

import * as S from "./ActionButton.style";

interface ButtonProps {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: string | JSX.Element | (JSX.Element | string)[];
}

const ActionButton = ({ children, ...props }: ButtonProps) => (
  <S.ActionButton {...props}>{children}</S.ActionButton>
);

export { ActionButton };
