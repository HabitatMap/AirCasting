import { gray400 } from "../../../assets/styles/colors";

const iconCache = new Map<string, google.maps.Icon>();

// Reuse a single canvas and context for text measurement
const canvas = document.createElement("canvas");
const context = canvas.getContext("2d")!;
context.font = "12px Roboto, Arial, sans-serif";
const textWidthCache = new Map<string, number>();

const getTextWidth = (text: string): number => {
  if (textWidthCache.has(text)) {
    return textWidthCache.get(text)!;
  }
  const width = context.measureText(text).width;
  textWidthCache.set(text, width);
  return width;
};

export const createMarkerIcon = (
  color: string,
  value: string,
  isSelected: boolean = false
): google.maps.Icon => {
  // Round value to reduce the number of unique icons
  const roundedValue = Math.round(Number(value.split(" ")[0]));
  const unit = value.split(" ")[1];
  const displayedValue = `${roundedValue} ${unit}`;

  const cacheKey = `${color}-${displayedValue}-${isSelected}`;
  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey)!;
  }

  const padding = 7;
  const baseCircleR = 6;
  const rectHeight = 19;
  const strokeWidth = isSelected ? 1 : 0;

  // Calculate text width
  const textWidth = getTextWidth(displayedValue);

  // Calculate rectangle width
  const rectWidth = 8 + baseCircleR + padding + textWidth * 1.2 + 2;

  // Set SVG dimensions and viewBox to match the rectangle
  const svgWidth = rectWidth;
  const svgHeight = rectHeight;

  // Positions within the SVG
  const circleCX = 11; // Circle center x-coordinate
  const circleCY = rectHeight / 2; // Circle center y-coordinate
  const textX = circleCX + baseCircleR + padding; // Text x-coordinate
  const textY = rectHeight / 2 + 4; // Text y-coordinate

  // Generate SVG
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
      <defs>
        <!-- Drop Shadow for Rectangle -->
        <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="0.5"/>
          <feOffset dx="1.25" dy="1.25" result="offsetblur"/>
          <feFlood flood-color="rgba(76, 86, 96, 0.1)"/>
          <feComposite in2="offsetblur" operator="in"/>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <!-- Label Rectangle with Drop Shadow -->
      <rect x="0" y="0" rx="9" ry="9.5" width="${rectWidth}" height="${rectHeight}" fill="white" stroke="${color}" stroke-width="${strokeWidth}" filter="url(#dropShadow)"/>
      <!-- Small Colored Circle Inside Label -->
      <circle cx="${circleCX}" cy="${circleCY}" r="${baseCircleR}" fill="${color}" stroke="${color}" stroke-width="${strokeWidth}" />
      <!-- Label Text -->
      <text x="${textX}" y="${textY}" font-family="Roboto, Arial, sans-serif" font-size="12" font-weight="500" letter-spacing="0.14" fill="${gray400}" text-anchor="start">${displayedValue}</text>
    </svg>
  `;

  // Set the anchor point to the center of the small colored circle
  const anchorPoint = new google.maps.Point(circleCX, circleCY);

  const icon = {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    anchor: anchorPoint,
  };

  iconCache.set(cacheKey, icon);
  return icon;
};

export const createClusterIcon = (
  color: string,
  shouldPulse: boolean
): google.maps.Icon => {
  const cacheKey = `${color}-cluster-${shouldPulse}`;
  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey)!;
  }

  const baseSize = 30;
  const baseRadius = 14;
  const center = baseSize / 2;

  let totalSize = baseSize;
  let anchorPoint = new google.maps.Point(center, baseSize);
  let svgContent = "";
  let viewBox = `0 0 ${baseSize} ${baseSize}`;
  let pulseStyles = "";

  // Making sure the icon is not obscuring other map elements when not pulsing
  if (shouldPulse) {
    const maxScaleFactor = 2.0;
    const extraMargin = (baseSize * (maxScaleFactor - 1)) / 2;
    totalSize = baseSize + extraMargin * 2;
    const scaledBaseSize = baseSize * maxScaleFactor;
    const halfTotalSize = totalSize / 2;

    const offsetY = (scaledBaseSize - baseSize) / 2;
    const anchorY = halfTotalSize + offsetY;
    anchorPoint = new google.maps.Point(totalSize / 2, anchorY);
    viewBox = `0 0 ${totalSize} ${totalSize}`;

    pulseStyles = `
      .pulse {
        animation: pulse-animation 2s infinite;
        transform-origin: center;
      }
      @keyframes pulse-animation {
        0% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(${maxScaleFactor});
          opacity: 0.8;
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }
    `;

    svgContent = `
      <g class="pulse">
        <circle stroke="${color}" fill="none" cx="${totalSize / 2}" cy="${
      totalSize / 2
    }" r="${baseRadius}"></circle>
        <g fill="${color}">
          <rect x="${(totalSize - 14) / 2}" y="${
      (totalSize - 14) / 2
    }" width="14" height="14" rx="7"></rect>
        </g>
      </g>
    `;
  } else {
    svgContent = `
      <circle stroke="${color}" fill="none" cx="${center}" cy="${center}" r="${baseRadius}"></circle>
      <g fill="${color}">
        <rect x="${(baseSize - 14) / 2}" y="${
      (baseSize - 14) / 2
    }" width="14" height="14" rx="7"></rect>
      </g>
    `;
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${totalSize}" height="${totalSize}" viewBox="${viewBox}">
      <style>
        ${pulseStyles}
      </style>
      ${svgContent}
    </svg>
  `;

  const icon: google.maps.Icon = {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(totalSize, totalSize),
    anchor: anchorPoint,
  };

  iconCache.set(cacheKey, icon);
  return icon;
};
