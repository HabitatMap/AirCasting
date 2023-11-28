import React from "react";

import { HeaderButton } from "./Button.style";

interface ButtonProps {
  onClick: () => void;
  children: string | JSX.Element | (JSX.Element | string)[];
}

const Button = ({ onClick, children }: ButtonProps) => (
  <HeaderButton onClick={onClick}>{children}</HeaderButton>
);

export { Button };
