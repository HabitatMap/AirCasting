import { gray400 } from "../../../assets/styles/colors";

export const createMarkerIcon = (
  color: string,
  value: string,
  isSelected: boolean,
  shouldPulse: boolean
): google.maps.Icon => {
  const padding = 7; // Padding around the text inside the rectangle
  const baseCircleX = 18; // X position of the circle
  const baseCircleR = 5; // Radius of the circle
  const rectHeight = 18; // Height of the rounded rectangle
  const height = 40; // Total height of the SVG
  const strokeWidth = isSelected ? 3 : 2; // Adjust stroke width if selected

  // Temporarily create an SVG to calculate the text width
  const temporarySvg = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg"
  );
  const tempText = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text"
  );
  tempText.setAttribute("font-family", "Roboto, Arial, sans-serif");
  tempText.setAttribute("font-size", "12");
  tempText.textContent = value;
  temporarySvg.appendChild(tempText);
  document.body.appendChild(temporarySvg);

  // Calculate the width of the text
  const textWidth = tempText.getComputedTextLength();
  const totalWidth =
    baseCircleX + baseCircleR * 2 + padding * 2 + textWidth + 2;

  // Remove the temporary SVG after calculation
  document.body.removeChild(temporarySvg);

  // Construct the SVG string with the marker design
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" viewBox="0 0 ${totalWidth} ${height}">
      <defs>
        <!-- Define the radial gradient for the shadow circle -->
        <radialGradient id="shadowGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.6" />
          <stop offset="50%" stop-color="${color}" stop-opacity="0.3" />
          <stop offset="100%" stop-color="${color}"/>
        </radialGradient>

        <!-- Define the blur filter -->
        <filter id="blurFilter" x="-50%" y="-50%" width="200%" height="200%" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      <style>
        .pulse {
          animation: pulse-animation 2s infinite;
          transform-origin: ${baseCircleX}px 20px; /* Center the transform origin on the circle */
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
      <circle cx="${baseCircleX}" cy="20" r="15" fill="url(#shadowGradient)" filter="url(#blurFilter)" class="${
    shouldPulse ? "pulse" : ""
  }" />

      <!-- Rounded rectangle with marker dot and text inside -->
      <rect x="7" y="${(height - rectHeight) / 2}" rx="10" ry="10" width="${
    totalWidth - 14
  }" height="${rectHeight}" fill="white" stroke="none"/>

      <!-- Marker circle (dot) inside the rectangle, aligned left -->
      <circle cx="${baseCircleX}" cy="${
    height / 2
  }" r="${baseCircleR}" fill="${color}" stroke="${color}" stroke-width="${strokeWidth}" />

      <!-- Marker text next to the circle, aligned to the same line as the circle, placed closer to the dot -->
      <text x="${
        baseCircleX + baseCircleR + padding
      }" y="25" font-family="Roboto, Arial, sans-serif" font-size="12" fill="${gray400}" text-anchor="start" font-weight="400" font-style="normal">${value}</text>
    </svg>
  `;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(totalWidth, height),
    anchor: new google.maps.Point(20, 20), // Center anchor based on the circle position
  };
};
