import { gray400 } from "../../../assets/styles/colors";

const getTextWidth = (text: string, font: string): number => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (context) {
    context.font = font;
    return context.measureText(text).width;
  }
  return 0;
};

const iconCache = new Map<string, google.maps.Icon>();

export const createMarkerIcon = (
  color: string,
  value: string,
  isSelected: boolean,
  shouldPulse: boolean
): google.maps.Icon => {
  const cacheKey = `${color}-${value}-${isSelected}-${shouldPulse}`;
  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey)!;
  }

  const padding = 7;
  const baseCircleX = 19;
  const baseCircleY = 20;
  const baseCircleR = 6;
  const rectHeight = 20;
  const height = 40;
  const strokeWidth = isSelected ? 1 : 0;
  const shadowRadius = isSelected ? 22 : 17;
  const maxScaleFactor = 1.5;
  const deltaR = shadowRadius * (maxScaleFactor - 1);

  const font = "12px Roboto, Arial, sans-serif";
  const textWidth = getTextWidth(value, font);
  const totalWidth = Math.max(
    baseCircleX + baseCircleR * 2 + padding * 2 + textWidth + 2,
    shadowRadius * 2
  );

  const shadowColor = `${color}66`;

  // Update the viewBox to encompass the entire shape of the SVG
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
      </defs>
      <style>
        .pulse {
          animation: pulse-animation 2s infinite;
          transform-origin: ${baseCircleX}px ${baseCircleY}px; /* Set transform origin to circle center */
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
  }" height="${rectHeight}" fill="white" stroke="${color}" stroke-width="${strokeWidth}"/>
      <circle cx="${baseCircleX}" cy="${
    height / 2
  }" r="${baseCircleR}" fill="${color}" stroke="${color}" stroke-width="${strokeWidth}" />
      <text x="${
        baseCircleX + baseCircleR + padding
      }" y="25" font-family="Roboto, Arial, sans-serif" font-size="12" fill="${gray400}" text-anchor="start">${value}</text>
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

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(30, 30),
    labelOrigin: new google.maps.Point(15, 15), // Adjust the label position
  };
};
