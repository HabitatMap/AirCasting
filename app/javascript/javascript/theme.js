import * as assets from "../assets";
import { BLUE_THEME } from "./constants";
import { getParams } from "./params";

export const applyTheme = callback => {
  updateFixedClusters();
  updateRectangles();
  callback();
};

const updateFixedClusters = () => {
  if (!window.__map.clusterers[0]) return;
  window.__map.clusterers[0].setStyles(fixedClusterStyles());
  window.__map.clusterers[0].repaint();
};

export const fixedClusterStyles = () => {
  if (getParams().theme === BLUE_THEME) {
    return [
      { url: assets.clusterTheme2Level1Path, height: 30, width: 30 },
      { url: assets.clusterTheme2Level2Path, height: 30, width: 30 },
      { url: assets.clusterTheme2Level3Path, height: 30, width: 30 },
      { url: assets.clusterTheme2Level4Path, height: 30, width: 30 }
    ];
  } else {
    return [
      { url: assets.clusterTheme1Level1Path, height: 30, width: 30 },
      { url: assets.clusterTheme1Level2Path, height: 30, width: 30 },
      { url: assets.clusterTheme1Level3Path, height: 30, width: 30 },
      { url: assets.clusterTheme1Level4Path, height: 30, width: 30 }
    ];
  }
};

export const locationMarkersByLevel = () => {
  if (getParams().theme === BLUE_THEME) {
    return {
      1: assets.locationMarkerTheme2Level1Path,
      2: assets.locationMarkerTheme2Level2Path,
      3: assets.locationMarkerTheme2Level3Path,
      4: assets.locationMarkerTheme2Level4Path
    };
  } else {
    return {
      1: assets.locationMarkerTheme1Level1Path,
      2: assets.locationMarkerTheme1Level2Path,
      3: assets.locationMarkerTheme1Level3Path,
      4: assets.locationMarkerTheme1Level4Path
    };
}}

export const pulsingMarkerStyles = () => {
  if (getParams().theme === BLUE_THEME) {
    return {
      1: assets.pulsingMarkerTheme2Level1Path,
      2: assets.pulsingMarkerTheme2Level2Path,
      3: assets.pulsingMarkerTheme2Level3Path,
      4: assets.pulsingMarkerTheme2Level4Path
    };
  } else {
    return {
      1: assets.pulsingMarkerTheme1Level1Path,
      2: assets.pulsingMarkerTheme1Level2Path,
      3: assets.pulsingMarkerTheme1Level3Path,
      4: assets.pulsingMarkerTheme1Level4Path
    };
  }
};

const updateRectangles = () => {
  if (!window.__map.rectangles) return;
  window.__map.rectangles.forEach(rectangle => {
    rectangle.setOptions({
      fillColor: rectangleColour(rectangle.data.value)
    });
  });
};

const rectanglesStyles = () => {
  if (getParams().theme === BLUE_THEME) {
    // empty strings correspond to values outside of heat levels range
    // and this rectangles are not drawn
    return ["", "#81dbcb", "#4ebcd5", "#2a70b8", "#19237e", ""];
  } else {
    return ["", "#96d788", "#ffd960", "#fca443", "#e95f5f", ""];
  }
};

export const rectangleColour = value => {
  const levelIndex = heatLevels().findIndex(level => value <= level);

  return rectanglesStyles()[levelIndex];
};

const heatLevels = () => {
  return Object.values(getParams().data.heat).sort((a, b) => a - b);
};
