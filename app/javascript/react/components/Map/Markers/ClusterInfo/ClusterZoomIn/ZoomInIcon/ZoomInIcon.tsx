import React from "react";
import { gray400 } from "../../../../../../assets/styles/colors";

interface ZoomInIconProps {
  color?: string;
}

const ZoomInIcon = ({ color }: ZoomInIconProps) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Zoom in"
  >
    <path
      d="M19 19L13.8033 13.8033M13.8033 13.8033C15.1605 12.4461 16 10.5711 16 8.5C16 4.35786 12.6421 1 8.5 1C4.35786 1 1 4.35786 1 8.5C1 12.6421 4.35786 16 8.5 16C10.5711 16 12.4461 15.1605 13.8033 13.8033ZM8.5 5.5V11.5M11.5 8.5H5.5"
      stroke={color ? `${color}` : `${gray400}`}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export { ZoomInIcon };
