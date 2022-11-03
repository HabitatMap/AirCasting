import * as assets from "../assets";
import { BLUE_THEME } from "./constants";
import { getParams } from "./params";

// heatmap colors
// the same colors are used in css and in svgs
const green = "#96d788"; // rgb(150, 215, 136)
const yellow = "#ffd960"; // rgb(255, 217, 96)
const orange = "#fca443"; // rgb(252, 164, 67)
const red = "#e95f5f"; // rgb(233, 95, 95)
const grey = "#a0a2ad";

// heatmap colors - blue theme
const teal = "#81dbcb"; // rgb(129, 219, 203)
const lightBlue = "#4ebcd5"; // rgb(78, 188, 213)
const grayBlue = "#2a70b8"; // rgb(42, 112, 184)
const indigo = "#19237e"; // rgb(25, 35, 126)

export const applyTheme = (callback) => {
  updateFixedClusters();
  updateRectangles();
  callback();
};

const updateFixedClusters = () => {
  if (!window.__map.clusterers[0]) return;
  // Force a rerender of the clusters
  const marker = new google.maps.Marker({ position: { lat: 12345, lng: 12345 } });
  window.__map.clusterers[0].addMarker(marker);
  window.__map.clusterers[0].removeMarker(marker, true);
};

export const fixedClusterStyles = index => {
  const i = Math.min(3, index)
  if (getParams().theme === BLUE_THEME) {
    return [
      { url: assets.clusterTheme2Level1Path, anchor: new google.maps.Point(15, 15) },
      { url: assets.clusterTheme2Level2Path, anchor: new google.maps.Point(15, 15) },
      { url: assets.clusterTheme2Level3Path, anchor: new google.maps.Point(15, 15) },
      { url: assets.clusterTheme2Level4Path, anchor: new google.maps.Point(15, 15) },
    ][i];
  } else {
    return [
      { url: assets.clusterTheme1Level1Path, anchor: new google.maps.Point(15, 15) },
      { url: assets.clusterTheme1Level2Path, anchor: new google.maps.Point(15, 15) },
      { url: assets.clusterTheme1Level3Path, anchor: new google.maps.Point(15, 15) },
      { url: assets.clusterTheme1Level4Path, anchor: new google.maps.Point(15, 15) },
    ][i];
  }
};

export const locationMarkersByLevel = () => {
  if (getParams().theme === BLUE_THEME) {
    return {
      1: assets.locationMarkerTheme2Level1Path,
      2: assets.locationMarkerTheme2Level2Path,
      3: assets.locationMarkerTheme2Level3Path,
      4: assets.locationMarkerTheme2Level4Path,
    };
  } else {
    return {
      1: assets.locationMarkerTheme1Level1Path,
      2: assets.locationMarkerTheme1Level2Path,
      3: assets.locationMarkerTheme1Level3Path,
      4: assets.locationMarkerTheme1Level4Path,
    };
  }
};

export const pulsingMarkerStyles = () => {
  if (getParams().theme === BLUE_THEME) {
    return {
      0: assets.pulsingMarkerDefaultLevelPath,
      1: assets.pulsingMarkerTheme2Level1Path,
      2: assets.pulsingMarkerTheme2Level2Path,
      3: assets.pulsingMarkerTheme2Level3Path,
      4: assets.pulsingMarkerTheme2Level4Path,
    };
  } else {
    return {
      0: assets.pulsingMarkerDefaultLevelPath,
      1: assets.pulsingMarkerTheme1Level1Path,
      2: assets.pulsingMarkerTheme1Level2Path,
      3: assets.pulsingMarkerTheme1Level3Path,
      4: assets.pulsingMarkerTheme1Level4Path,
    };
  }
};

const updateRectangles = () => {
  if (!window.__map.rectangles) return;
  window.__map.rectangles.forEach((rectangle) => {
    rectangle.setOptions({
      fillColor: rectangleColour(rectangle.data.value),
    });
  });
};

const rectanglesStyles = () => {
  if (getParams().theme === BLUE_THEME) {
    // empty strings correspond to values outside of heat levels range
    // and this rectangles are not drawn
    return ["", teal, lightBlue, grayBlue, indigo, ""];
  } else {
    return ["", green, yellow, orange, red, ""];
  }
};

export const rectangleColour = (value) => {
  const levelIndex = heatLevels().findIndex((level) => value <= level);

  return rectanglesStyles()[levelIndex];
};

const heatLevels = () => {
  return Object.values(getParams().data.heat).sort((a, b) => a - b);
};
