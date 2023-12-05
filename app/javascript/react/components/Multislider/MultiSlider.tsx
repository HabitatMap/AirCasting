import React, { useState } from "react";

import { Slider } from "antd";

import { red, orange, yellow, green } from "../../assets/styles/colors";

const MultiSlider = () => {
  const [thresholds, setThresholds] = useState([0, 50, 20, 40, 100]);
  const startThreshold = thresholds[0];
  const endThreshold = thresholds[thresholds.length - 1];

  function makeAscending(arr: number[]): number[] {
    return arr.slice().sort((a, b) => a - b);
  }

  function convertToPercentage(arr: number[]): number[] {
    const max: number = Math.max(...arr);
    const scaledArr: number[] = arr.map((value) => (value / max) * 100);
    return scaledArr;
  }
  const percentagesThresholds = convertToPercentage(makeAscending(thresholds));

  function convertToCssColors(arr: number[]): string {
    const colors = `linear-gradient(to right,${green} ${arr[0]}% ${arr[1]}%, ${yellow} ${arr[1]}% ${arr[2]}%, ${orange} ${arr[2]}% ${arr[3]}%, ${red} ${arr[3]}% ${arr[4]}%) `;
    console.log(colors);
    return colors;
  }
  const cssColors = convertToCssColors(percentagesThresholds);

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
          background: cssColors,
        },
      }}
    />
  );
};

export default MultiSlider;
