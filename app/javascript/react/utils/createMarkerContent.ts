// utils/createMarkerContent.ts

/**
 * Creates an HTMLElement containing a simple SVG circle marker with the specified color.
 * @param color - The fill color of the SVG marker.
 * @returns An HTMLElement with embedded SVG.
 */
export const createMarkerContent = (color: string): HTMLElement => {
  const div = document.createElement("div");
  div.style.position = "absolute";
  div.style.transform = "translate(-50%, -50%)"; // Center the marker
  div.style.width = "12px"; // Updated size
  div.style.height = "12px"; // Updated size

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", "12"); // Updated size
  svg.setAttribute("height", "12"); // Updated size
  svg.setAttribute("viewBox", "0 0 12 12");

  // Single Circle without Stroke
  const circle = document.createElementNS(svgNS, "circle");
  circle.setAttribute("cx", "6"); // Center x-coordinate
  circle.setAttribute("cy", "6"); // Center y-coordinate
  circle.setAttribute("r", "6"); // Radius to fill the SVG
  circle.setAttribute("fill", color); // Fill color without stroke

  svg.appendChild(circle);
  div.appendChild(svg);

  return div;
};
