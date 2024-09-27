import { gray400 } from "../../../assets/styles/colors";

export const createMarkerIcon = (
  color: string,
  value: string,
  isSelected: boolean,
  shouldPulse: boolean
): google.maps.Icon => {
  const width = 100; // Total width of the SVG
  const height = 40; // Height of the SVG
  const rectWidth = 78; // Width of the rounded rectangle
  const rectHeight = 20; // Height of the rounded rectangle
  const strokeWidth = isSelected ? 3 : 2; // Adjust stroke width if selected

  // Construct the SVG string with the marker design
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <style>
        .pulse {
          animation: pulse-animation 2s infinite;
        }
        @keyframes pulse-animation {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.8;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      </style>

      <!-- Pulsating Shadow Circle behind the white rectangle -->
      <circle cx="16" cy="20" r="18" fill="${color}" fill-opacity="0.3" class="${
    shouldPulse ? "pulse" : ""
  }" />

      <!-- Rounded rectangle with marker dot and text inside -->
      <rect x="5" y="${
        (height - rectHeight) / 2
      }" rx="10" ry="10" width="${rectWidth}" height="${rectHeight}" fill="white" stroke="none"/>

      <!-- Marker circle (dot) inside the rectangle, aligned left -->
      <circle cx="18" cy="${
        height / 2
      }" r="6" fill="${color}" stroke="${color}" stroke-width="${strokeWidth}" />

      <!-- Marker text next to the circle, aligned to the same line as the circle, placed closer to the dot -->
      <text x="32" y="25" font-family="Roboto, sans-serif" font-size="12" fill="${gray400}" text-anchor="start">${value}</text>
    </svg>
  `;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(width, height),
    anchor: new google.maps.Point(20, 20), // Center anchor based on the circle position
  };
};
