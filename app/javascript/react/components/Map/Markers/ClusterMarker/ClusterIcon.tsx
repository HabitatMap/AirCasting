import React from "react";
import { useTranslation } from "react-i18next";
import { green } from "../../../../assets/styles/colors";

interface ClusterIconProps {
  color?: string;
}

const ClusterIcon = ({ color = green }: ClusterIconProps) => {
  const { t } = useTranslation();
  return (
    <svg
      width="30px"
      height="30px"
      viewBox="0 0 30 30"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={t("clusterInfo.altClusterIcon")}
    >
      <g
        id="Page-1"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <g
          id="Colors/green"
          transform="translate(8.000000, 8.000000)"
          fill={color}
        >
          <rect
            id="Rectangle"
            x="0"
            y="0"
            width="13"
            height="13"
            rx="6.5"
          ></rect>
        </g>
        <circle
          id="Oval-3"
          stroke={color}
          cx="14.5"
          cy="14.5"
          r="13.5"
        ></circle>
      </g>
    </svg>
  );
};

export { ClusterIcon };
