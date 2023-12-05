import React, { useState } from "react";

import { Slider } from "antd";

import { red, orange, yellow, green } from "../../assets/styles/colors";

const MultiSlider = () => {
  const [thresholds, setThresholds] = useState([0, 50, 20, 40, 100]);

  const startThreshold = thresholds[0];
  const endThreshold = thresholds[thresholds.length - 1];

  function getGradientColor(percentage: number) {
    const startColor = [135, 208, 104];
    const endColor = [255, 204, 199];

    const midColor = startColor.map((start, i) => {
      const end = endColor[i];
      const delta = end - start;
      return (start + delta * percentage).toFixed(0);
    });
    return `rgb(${midColor.join(",")})`;
  }

  return (
    <Slider
      min={startThreshold}
      max={endThreshold}
      range
      defaultValue={thresholds}
      onChange={setThresholds}
      styles={{
        track: {
          background: "transparent",
        },
        tracks: {
          background: `linear-gradient(to right, ${red} 0%, ${orange} 50%, ${yellow} 70%, ${green} 100%)`,
        },
      }}
    />
  );
};

export default MultiSlider;
