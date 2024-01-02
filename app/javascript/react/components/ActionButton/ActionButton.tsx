import React from "react";

import * as S from "./ActionButton.style";

interface ButtonProps {
  onClick: () => void;
  children: string | JSX.Element | (JSX.Element | string)[];
}

const ActionButton = ({ onClick, children }: ButtonProps) => (
  <S.ActionButton onClick={onClick}>{children}</S.ActionButton>
);

export { ActionButton };
