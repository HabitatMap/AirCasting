export const createMarkerIcon = (
  color: string,
  value: string,
  isSelected: boolean,
  shouldPulse: boolean
): google.maps.Icon => {
  const markerSVG = `
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="${isSelected ? 12 : 10}" fill="${color}" />
      ${
        shouldPulse
          ? `<animate attributeName="r" from="10" to="12" dur="1s" repeatCount="indefinite" />`
          : ""
      }
      <text x="20" y="25" font-family="Arial" font-size="12" fill="white" text-anchor="middle">${value}</text>
    </svg>
  `;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markerSVG)}`,
    scaledSize: new google.maps.Size(40, 40),
    anchor: new google.maps.Point(20, 40),
  };
};

export const createClusterIcon = (
  count: number,
  isSelected: boolean
): google.maps.Icon => {
  const clusterSVG = `
    <svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
      <circle cx="25" cy="25" r="${
        isSelected ? 25 : 20
      }" fill="rgba(0, 123, 255, 0.6)" />
    </svg>
  `;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(clusterSVG)}`,
    scaledSize: new google.maps.Size(50, 50),
    anchor: new google.maps.Point(25, 25),
  };
};
