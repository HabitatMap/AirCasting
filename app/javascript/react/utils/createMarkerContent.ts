/**
 * Creates an HTMLElement containing a simple SVG circle marker with the specified color.
 * @param color - The fill color of the SVG marker.
 * @returns An HTMLElement with embedded SVG.
 */
export const createMarkerContent = (color: string): HTMLElement => {
  const div = document.createElement("div");
  div.style.position = "absolute";
  div.style.transform = "translate(-50%, -50%)";
  div.style.width = "12px";
  div.style.height = "12px";

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", "12");
  svg.setAttribute("height", "12");
  svg.setAttribute("viewBox", "0 0 12 12");

  const circle = document.createElementNS(svgNS, "circle");
  circle.setAttribute("cx", "6");
  circle.setAttribute("cy", "6");
  circle.setAttribute("r", "6");
  circle.setAttribute("fill", color);

  svg.appendChild(circle);
  div.appendChild(svg);

  return div;
};
