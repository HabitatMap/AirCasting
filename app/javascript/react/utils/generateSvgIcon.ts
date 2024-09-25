/**
 * Generates an SVG Data URL with the specified color.
 * @param color - The fill color of the SVG marker.
 * @returns A Data URL representing the SVG.
 */
export const generateSvgIcon = (color: string): string => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" stroke="${color}" stroke-width="2" fill="white" />
      <circle cx="12" cy="12" r="4" fill="${color}" />
    </svg>
  `;

  // Encode the SVG string
  const encodedSvg = encodeURIComponent(svg)
    .replace(/'/g, "%27")
    .replace(/"/g, "%22");

  return `data:image/svg+xml;charset=UTF-8,${encodedSvg}`;
};
