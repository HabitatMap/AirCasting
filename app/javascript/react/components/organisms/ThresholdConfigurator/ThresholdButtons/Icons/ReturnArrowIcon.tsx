import React from "react";
import { useTranslation } from "react-i18next";
import { gray300 } from "../../../../../assets/styles/colors";

interface ReturnArrowIconProps {
  color?: string;
  width?: number;
  height?: number;
}

const ReturnArrowIcon: React.FC<ReturnArrowIconProps> = ({
  color = gray300,
  width = 20,
  height = 20,
}) => {
  const { t } = useTranslation();
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={t("thresholdConfigurator.altResetButton")}
    >
      <path
        d="M7.5 12.5L2.5 7.5M2.5 7.5L7.5 2.5M2.5 7.5H12.5C15.2614 7.5 17.5 9.73858 17.5 12.5C17.5 15.2614 15.2614 17.5 12.5 17.5H10"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export { ReturnArrowIcon };
