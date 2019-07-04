import * as assets from "../assets";

export const applyTheme = () => {
  if (window.__map) {
    updateFixedClusters();
    updateRectangles();
  }
};

const updateFixedClusters = () => {
  if (window.__map.clusterers[0]) {
    window.__map.clusterers[0].setStyles(fixedClusterStyles());
    window.__map.clusterers[0].repaint();
  }
};

export const fixedClusterStyles = () => {
  if (params().theme === "blue") {
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

const updateRectangles = () => {
  if (window.__map.rectangles) {
    window.__map.rectangles.forEach(rectangle => {
      rectangle.setOptions({
        fillColor: rectangleColour(rectangle.data.value)
      });
    });
  }
};

const rectanglesStyles = () => {
  if (params().theme === "blue") {
    return [null, "#81dbcb", "#4ebcd5", "#2a70b8", "#19237e"];
  } else {
    return [null, "#96d788", "#ffd960", "#fca443", "#e95f5f"];
  }
};

export const rectangleColour = value => {
  const levels = heatLevels();
  const level = _(levels).detect(level => value < level);

  return rectanglesStyles()[levels.indexOf(level)];
};

const heatLevels = () => {
  return Object.values(params().data.heat).sort();
};

const params = () =>
  window.location.hash
    .slice(2)
    .split("&")
    .filter(x => x.length !== 0)
    .map(x => x.split("="))
    .map(([k, v]) => [k, decodeURIComponent(v)])
    .map(([k, v]) => [k, JSON.parse(v)])
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
