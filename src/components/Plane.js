import { useEffect, useLayoutEffect, useRef } from "react";
import { pointColor, Colors } from "./helper.js";

export const Plane = ({ dimension, points }) => {
  const CANVAS_PADDING = 25; // extra space around element

  const canvasRef = useRef(null);
  const canvasLength = useRef(0);
  const frameCanvas = document.createElement("canvas");
  frameCanvas.width = points.base;
  frameCanvas.height = points.base;

  // State Change Management through useEffect()
  useEffect(() => {
    setupFrame();

    // State Listeners to bypass React rerenders
    points.on(`change:dimension-${dimension}:frame`, drawFrame);
    points.on(`change:threshold`, drawFrame);
    points.on(`change:pointsActive`, drawFrame);

    return () => {
      points.off(`change:dimension-${dimension}:frame`, drawFrame);
      points.off(`change:threshold`, drawFrame);
      points.off(`change:pointsActive`, drawFrame);
    };
  }, []);

  // Layout Effects allows us to listen for window resize
  useLayoutEffect(() => {
    window.addEventListener("resize", setupFrame);
    return () => window.removeEventListener("resize", setupFrame);
  }, []);

  function setupFrame() {
    // Use parent element to infer frame size
    const { width, height } =
      canvasRef.current.parentElement.getBoundingClientRect();
    canvasLength.current = (width < height ? width : height) - CANVAS_PADDING;
    const ctx = canvasRef.current.getContext("2d");
    ctx.canvas.width = canvasLength.current;
    ctx.canvas.height = canvasLength.current;

    // (re)draw the current frame
    drawFrame();
  }

  // Functions that do the actual work
  async function drawFrame() {
    // draw to offscreen canvas
    const context = frameCanvas.getContext("2d");
    const frame = points.getPlaneFrame({ dimension });
    frame.forEach((lines, x) => {
      lines.forEach((point, y) => {
        drawPoint({ context, point, x, y });
      });
    });

    // transfer to screen
    const data = await createImageBitmap(frameCanvas, {
      resizeWidth: canvasLength.current,
      resizeHeight: canvasLength.current,
      resizeQuality: "pixelated",
    });
    canvasRef.current.getContext("2d").drawImage(data, 0, 0);
  }

  function drawPoint({ context, point, x, y }) {
    // Draw points that are not in threshold same color as background
    if (points.isInThreshold({ point })) {
      context.fillStyle = pointColor({
        isPointActive: points.pointsActiveAbsolute[point] !== 0,
        pointValue: points.getPointValue({ point }),
      });
    } else {
      context.fillStyle = "#222";
    }
    context.fillRect(x, y, 1, 1);
  }

  // Interaction Functions
  function onClick(e) {
    const { button, clientX, clientY, ctrlKey, shiftKey } = e;
    const { left, top } = canvasRef.current.getBoundingClientRect();
    const pixelLength = canvasLength.current / points.base;

    const x = Math.floor((clientX - left) / pixelLength);
    const y = Math.floor((clientY - top) / pixelLength);
    const frame = points.getPlaneFrame({ dimension });
    const point = frame[x][y];

    if (button === 2 && ctrlKey) {
      console.log("debug() visible frame", frameActive.current, frame);
    } else if (button === 2 && shiftKey) {
      // right click + shift = remove
      points.removePointActive({ point });
    } else if (button === 2) {
      console.log("debug() visible point", point);
    } else if (button === 0 && shiftKey) {
      const set = points.getConnectedPoints({ point });
      points.addPointsActive({ set });
    } else if (button === 0) {
      const set = points.getConnectedPoints({ point });
      points.resetPointsActive({ set });
    }

    return e.preventDefault();
  }

  function onWheel(e) {
    const frameCurrent = points.getPlaneFrameActive({ dimension });
    const frameNew =
      e.deltaY > 0 && frameCurrent > 0
        ? frameCurrent - 1
        : e.deltaY < 0 && frameCurrent < points.base - 1
        ? frameCurrent + 1
        : frameCurrent;

    points.setPlaneFrameActive({ dimension, frame: frameNew });
  }

  return (
    <div>
      <canvas
        width={points.base}
        height={points.base}
        ref={canvasRef}
        onClick={onClick}
        onContextMenu={onClick}
        onWheel={onWheel}
      ></canvas>
    </div>
  );
};
