import { size } from "lodash";
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
  isSelected: boolean = false,
  shouldPulse: boolean
): google.maps.Icon => {
  // Round value to reduce number of unique icons
  const roundedValue = Math.round(Number(value.split(" ")[0]));
  const unit = value.split(" ")[1];
  const displayedValue = `${roundedValue} ${unit}`;

  const cacheKey = `${color}-${displayedValue}-${isSelected}-${shouldPulse}`;
  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey)!;
  }

  const padding = 7;
  const baseCircleX = 19;
  const baseCircleY = 20;
  const baseCircleR = 6;
  const rectHeight = 19;
  const height = 40;
  const strokeWidth = isSelected ? 1 : 0;
  const shadowRadius = isSelected ? 22 : 18;
  const maxScaleFactor = 1.6;
  const deltaR = shadowRadius * (maxScaleFactor - 1);

  const textWidth = getTextWidth(displayedValue);
  const mainContentWidth =
    8 + height / 2 + baseCircleR + padding + textWidth + 2;
  const totalWidth = Math.max(mainContentWidth + 8, shadowRadius * 2);

  const shadowColor = `${color}`;

  // Define viewBox based on whether pulsation is needed
  const viewBoxMinX = shouldPulse ? -deltaR : 0;
  const viewBoxMinY = shouldPulse ? -deltaR * 2 + padding : padding;

  const viewBoxWidth =
    totalWidth + (shouldPulse ? deltaR * 2 : 0) + padding * 2;
  const viewBoxHeight = height + (shouldPulse ? deltaR * 2 + padding : padding);

  const centerX = (totalWidth + padding * 2) / 2;
  const centerY = (height + padding * 2) / 2;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${viewBoxWidth}" height="${viewBoxHeight}" viewBox="${viewBoxMinX} ${viewBoxMinY} ${viewBoxWidth} ${viewBoxHeight}" overflow="visible">
      <defs>
        <!-- Radial Gradient for Shadow -->
        ${
          isSelected
            ? `<radialGradient id="shadowGradient" cx="50%" cy="50%" r="70%">
                <stop offset="0%" stop-color="${shadowColor}90" />
                <stop offset="40%" stop-color="${shadowColor}90" />
                <stop offset="100%" stop-color="${shadowColor}90" stop-opacity="0" />
              </radialGradient>`
            : `<radialGradient id="shadowGradient" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stop-color="${shadowColor}95" />
                <stop offset="30%" stop-color="${shadowColor}95" />
                <stop offset="100%" stop-color="${shadowColor}95" />
              </radialGradient>`
        }
        <!-- Blur Filter -->
        ${
          !isSelected
            ? `<filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
              </filter>`
            : ""
        }
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
      <style>
        ${
          shouldPulse
            ? `
          @keyframes pulse-animation {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(${maxScaleFactor}); opacity: 0.9; }
            100% { transform: scale(1); opacity: 1; }
          }
          .pulse {
            animation: pulse-animation 2s infinite;
            transform-origin: ${
              centerX - mainContentWidth / 2 + 11
            }px ${centerY}px;
          }
        `
            : ""
        }
      </style>
      <!-- Pulsating Circle (Background) -->
      ${shouldPulse ? `<g class="pulse">` : ""}
              <circle cx="${
                centerX - mainContentWidth / 2 + 11
              }" cy="${centerY}" r="${shadowRadius}" fill="url(#shadowGradient)" ${
    !isSelected ? 'filter="url(#blur)"' : ""
  } />
            ${shouldPulse ? `</g>` : ""}
      <!-- Label Rectangle with Drop Shadow -->
      <rect x="${centerX - mainContentWidth / 2}" y="${
    centerY - rectHeight / 2
  }" rx="9" ry="${centerY}" width="${mainContentWidth}" height="${rectHeight}" fill="white" stroke="${color}" stroke-width="${strokeWidth}" filter="url(#dropShadow)"/>
      <!-- Small Colored Circle Inside Label -->
      <circle cx="${
        centerX - mainContentWidth / 2 + 11
      }" cy="${centerY}" r="${baseCircleR}" fill="${color}" stroke="${color}" stroke-width="${strokeWidth}" />
      <!-- Label Text -->
      <text x="${
        centerX - mainContentWidth / 2 + 11 + baseCircleR + padding
      }" y="${
    centerY + 5
  }" font-family="Roboto, Arial, sans-serif" font-size="12" font-weight="400" letter-spacing="0.14" fill="${gray400}" text-anchor="start">${displayedValue}</text>
    </svg>
  `;

  const icon = {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
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
