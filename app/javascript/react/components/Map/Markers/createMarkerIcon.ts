import { gray300 } from "../../../assets/styles/colors";

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
  const displayedValue = `${roundedValue} ${value.split(" ")[1]}`;

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
  const shadowRadius = isSelected ? 22 : 17;
  const maxScaleFactor = 1.5;
  const deltaR = shadowRadius * (maxScaleFactor - 1);

  const font = "12px Roboto, Arial, sans-serif";
  const textWidth = getTextWidth(displayedValue);
  const totalWidth = Math.max(
    baseCircleX + baseCircleR * 2 + padding * 2 + textWidth + 2,
    shadowRadius * 2
  );

  const shadowColor = `${color}90`;

  const viewBoxMinX = -deltaR;
  const viewBoxMinY = -deltaR;
  const viewBoxWidth = totalWidth + deltaR * 2;
  const viewBoxHeight = height + shadowRadius + deltaR * 2;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${
      totalWidth + deltaR * 2
    }" height="${
    height + shadowRadius + deltaR * 2
  }" viewBox="${viewBoxMinX} ${viewBoxMinY} ${viewBoxWidth} ${viewBoxHeight}" overflow="visible">
      <defs>
        ${
          isSelected
            ? `<radialGradient id="shadowGradient" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stop-color="${shadowColor}" />
            <stop offset="40%" stop-color="${shadowColor}" />
            <stop offset="100%" stop-color="${shadowColor}" stop-opacity="0" />
          </radialGradient>`
            : `<radialGradient id="shadowGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="${shadowColor}" />
            <stop offset="30%" stop-color="${shadowColor}" />
            <stop offset="100%" stop-color="${shadowColor}" />
          </radialGradient>`
        }
        ${
          !isSelected
            ? `<filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
          </filter>`
            : ""
        }
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
        .pulse {
          animation: pulse-animation 2s infinite;
          transform-origin: ${baseCircleX}px ${baseCircleY}px;
        }
        @keyframes pulse-animation {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(${maxScaleFactor}); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      </style>
      ${shouldPulse ? `<g class="pulse">` : ""}
      <circle cx="${baseCircleX}" cy="${baseCircleY}" r="${shadowRadius}" fill="url(#shadowGradient)" ${
    !isSelected ? 'filter="url(#blur)"' : ""
  } />
      ${shouldPulse ? `</g>` : ""}
      <rect x="8" y="${(height - rectHeight) / 2}" rx="9" ry="9" width="${
    totalWidth - 14
  }" height="${rectHeight}" fill="white" stroke="${color}" stroke-width="${strokeWidth}" filter="url(#dropShadow)"/>
      <circle cx="${baseCircleX}" cy="${
    height / 2
  }" r="${baseCircleR}" fill="${color}" stroke="${color}" stroke-width="${strokeWidth}" />
      <text x="${
        baseCircleX + baseCircleR + padding
      }" y="25" font-family="Roboto, Arial, sans-serif" font-size="12" font-weight="400" letter-spacing="0.14" fill="${gray300}"  text-anchor="start">${displayedValue}</text>
    </svg>
  `;

  const icon = {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(
      totalWidth + deltaR * 2,
      height + shadowRadius + deltaR * 2
    ),
    anchor: new google.maps.Point(baseCircleX + deltaR, baseCircleY + deltaR),
  };

  iconCache.set(cacheKey, icon);
  return icon;
};

export const createClusterIcon = (color: string, shouldPulse: boolean) => {
  const cacheKey = `${color}-cluster-${shouldPulse}`;
  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey)!;
  }

  const pulseClass = shouldPulse ? "pulse" : "";

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
      <style>
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
            transform: scale(1.2);
            opacity: 0.7;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      </style>
      <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g fill="${color}">
          <rect x="8" y="8" width="14" height="14" rx="7" class="${pulseClass}"></rect>
        </g>
        <circle stroke="${color}" cx="15" cy="15" r="14" class="${pulseClass}"></circle>
      </g>
    </svg>
  `;

  const icon = {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(30, 30),
    labelOrigin: new google.maps.Point(15, 15),
  };

  iconCache.set(cacheKey, icon);
  return icon;
};
