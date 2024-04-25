import React from "react";

import * as S from "./ScrollButton.style";

interface ButtonProps {
  onClick: () => void;
  children: string | JSX.Element | (JSX.Element | string)[];
}

const ScrollButton = ({ children, ...props }: ButtonProps) => (
  <S.ScrollButton {...props}>{children}</S.ScrollButton>
);

export { ScrollButton };
