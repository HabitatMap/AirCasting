import React from "react";

interface ClusterIconProps {
  color?: string;
  count: number;
}

export function ClusterIcon({ color = "#4CAF50", count }: ClusterIconProps) {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 30 30"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`Cluster of ${count} markers`}
    >
      <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
        <g transform="translate(8, 8)" fill={color}>
          <rect x="0" y="0" width="13" height="13" rx="6.5" />
        </g>
        <circle stroke={color} cx="14.5" cy="14.5" r="13.5" />
        <text
          x="15"
          y="18"
          fontFamily="Arial"
          fontSize="10"
          fill="white"
          textAnchor="middle"
        >
          {count}
        </text>
      </g>
    </svg>
  );
}
