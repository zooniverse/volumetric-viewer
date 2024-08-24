import { useEffect, useRef } from "react";

export const Histogram = ({ viewer }) => {
  // canvas ref
  const canvasRef = useRef(null);

  // setup defaults
  const histogram = [];
  let maxValue = 0;
  let maxCount = 0;
  let minValue = 255;

  for (let i = 0; i < 256; i++) {
    histogram[i] = 0;
    if (viewer.data[i] < minValue) minValue = viewer.data[i];
    if (viewer.data[i] > maxValue) maxValue = viewer.data[i];
  }

  viewer.data.forEach((point) => {
    const newCount = histogram[point] + 1;
    if (newCount > maxCount) maxCount = newCount;
    histogram[point] = newCount;
  });

  const histogramMin = [];
  histogram.forEach((val, i) => {
    if (val !== 0) {
      histogramMin.push({ x: i, y: val });
    }
  });

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    const { width, height } = canvasRef.current.getBoundingClientRect();

    const w = width / 256;
    const h = height / maxCount;

    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.moveTo(0, height);

    // // SMOOTHS OUT THE LINE
    // histogramMin.forEach(({ x, y }, i) => {
    // 	ctx.lineTo(
    // 		x * w,
    // 		height - (y * h)
    // 	);
    // });

    // ACTUAL POINTS OF LINE
    histogram.forEach((y, x) => {
      ctx.lineTo(x * w, height - y * h);
    });

    ctx.lineTo(width, height);
    ctx.fill();
    console.log("width", width, height);
  }, []);

  return <canvas ref={canvasRef} className="viewer-histogram"></canvas>;
};
