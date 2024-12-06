const iconCache = new Map<string, google.maps.Icon>();

// Reuse a single canvas and context for text measurement
const canvas = document.createElement("canvas");
const context = canvas.getContext("2d")!;
context.font = "12px Roboto, Arial, sans-serif";

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
        zIndex: 9999999999999999;
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
