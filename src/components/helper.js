export const pixelToPercent = (value) => {
  // 255 => 100%
  // 0 => 0%
  // 127.5 => 50%
  return `${Math.round((value / 255) * 100)}%`; // normalize is some way
};

export const pointColor = ({ isPointActive = false, pointValue }) => {
  const pointNormed = Math.floor(pointValue / 2) + 64;

  const colorStr = isPointActive
    ? `hsl(120, 75%, ${pixelToPercent(pointNormed)})`
    : `hsl(205, 0%, ${pixelToPercent(pointNormed)})`;
  return colorStr;
};
