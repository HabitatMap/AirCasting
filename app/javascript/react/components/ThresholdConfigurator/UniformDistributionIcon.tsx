//add width and height props to svg
import React from "react";
import { gray300 } from "../../assets/styles/colors";

interface UniformDistributionIconProps {
  width: string;
  height: string;
}

const UniformDistributionIcon = ({
  width,
  height,
}: UniformDistributionIconProps) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 10 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9 15.25L5.25 19M5.25 19L1.5 15.25M5.25 19L5.25 1"
      stroke={gray300}
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M1.5 4.75L5.25 1M5.25 1L9 4.75M5.25 1L5.25 19"
      stroke={gray300}
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

export { UniformDistributionIcon };
