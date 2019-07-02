import * as assets from "../assets";

let fixedClusterStyles2 = [
  { url: assets.clusterTheme1Level1Path, height: 30, width: 30 },
  { url: assets.clusterTheme1Level2Path, height: 30, width: 30 },
  { url: assets.clusterTheme1Level3Path, height: 30, width: 30 },
  { url: assets.clusterTheme1Level4Path, height: 30, width: 30 }
];

if (window.__elmApp) {
  window.__elmApp.ports.toggleTheme.subscribe(isCustomThemeOn => {
    fixedClusterStyles2 = [
      { url: assets.clusterTheme2Level1Path, height: 30, width: 30 },
      { url: assets.clusterTheme2Level2Path, height: 30, width: 30 },
      { url: assets.clusterTheme2Level3Path, height: 30, width: 30 },
      { url: assets.clusterTheme2Level4Path, height: 30, width: 30 }
    ];
  });
}

export const fixedClusterStyles = () => fixedClusterStyles2;
