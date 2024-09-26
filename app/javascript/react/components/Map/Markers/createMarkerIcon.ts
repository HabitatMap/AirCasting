export const createMarkerIcon = (
  color: string,
  value: string,
  isSelected: boolean,
  shouldPulse: boolean
): google.maps.Symbol => {
  const size = isSelected ? 40 : 30;
  const strokeWidth = isSelected ? 3 : 2;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${
    size / 2 - strokeWidth / 2
  }" fill="${color}" stroke="white" stroke-width="${strokeWidth}" />
      <text x="${size / 2}" y="${
    size / 2 + 5
  }" font-family="Arial" font-size="10" fill="white" text-anchor="middle">${value}</text>
      ${
        shouldPulse
          ? `
        <circle cx="${size / 2}" cy="${size / 2}" r="${
              size / 2 - strokeWidth / 2
            }">
          <animate attributeName="r" values="${size / 2 - strokeWidth / 2};${
              size / 2 + 5
            };${
              size / 2 - strokeWidth / 2
            }" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0;1" dur="1.5s" repeatCount="indefinite" />
        </circle>
      `
          : ""
      }
    </svg>
  `;

  return {
    path: `M ${size / 2},${size / 2} m -${size / 2},0 a ${size / 2},${
      size / 2
    } 0 1,0 ${size},0 a ${size / 2},${size / 2} 0 1,0 -${size},0`,
    fillColor: color,
    fillOpacity: 1,
    strokeWeight: strokeWidth,
    strokeColor: "#ffffff",
    scale: 1,
    anchor: new google.maps.Point(size / 2, size / 2),
    labelOrigin: new google.maps.Point(size / 2, size / 2 + 15),
  };
};
