import React from "react";

import { Button } from "./Button.style";

interface ButtonProps {
  onClick: () => void;
  children: string | JSX.Element | (JSX.Element | string)[];
}

const Button = ({ onClick, children }: ButtonProps) => (
  <Button onClick={onClick}>{children}</Button>
);

export { Button };
