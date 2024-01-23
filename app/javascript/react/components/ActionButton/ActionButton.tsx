import React from "react";

import * as S from "./ActionButton.style";

interface ButtonProps {
  onClick: () => void;
  children: string | JSX.Element | (JSX.Element | string)[];
}

const ActionButton = ({ children, ...props }: ButtonProps) => (
  <S.ActionButton {...props}>{children}</S.ActionButton>
);

export { ActionButton };
