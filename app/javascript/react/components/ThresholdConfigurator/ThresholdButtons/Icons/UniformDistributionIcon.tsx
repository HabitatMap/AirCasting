//add width and height props to svg
import React from "react";
import { useTranslation } from "react-i18next";
import { gray300 } from "../../../../assets/styles/colors";

interface UniformDistributionIconProps {
  color?: string;
  width?: number;
  height?: number;
}

const UniformDistributionIcon = ({
  color = gray300,
  width = 10,
  height = 20,
}: UniformDistributionIconProps) => {
  const { t } = useTranslation();
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 10 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={t("thresholdConfigurator.altUniformDistribution")}
    >
      <path
        d="M9 15.25L5.25 19M5.25 19L1.5 15.25M5.25 19L5.25 1"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1.5 4.75L5.25 1M5.25 1L9 4.75M5.25 1L5.25 19"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export { UniformDistributionIcon };
