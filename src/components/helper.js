// Generate a cache of all the colors used during render
// This improves draw performance by avoiding re-calculating the same color every render

import { Color } from "three";

export const Colors = [
  [], // default
  [], // active
];

export const ThreeColors = [
  [], // default
  [], // active
];

export const pixelToPercent = (value) => {
  // 255 => 100%
  // 0 => 0%
  // 127.5 => 50%
  return `${Math.round((value / 255) * 100)}%`; // normalize is some way
};

export const pointColor = ({
  isPointActive = false,
  isThree = false,
  pointValue,
}) => {
  const ref = isThree ? ThreeColors : Colors;
  return ref[isPointActive ? 1 : 0][pointValue];
};

// Generate the cached colors
for (let i = 0; i < 256; i++) {
  const pointNormed = Math.floor(i / 2) + 64;
  const colorGrey = `hsl(205, 0%, ${pixelToPercent(pointNormed)})`;
  const colorGreen = `hsl(120, 75%, ${pixelToPercent(pointNormed)})`;

  Colors[0][i] = colorGrey;
  Colors[1][i] = colorGreen;

  ThreeColors[0][i] = new Color(colorGrey);
  ThreeColors[1][i] = new Color(colorGreen);
}
