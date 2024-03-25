import { useEffect, useRef } from "react";
import { pointColor } from "./helper.js";

export const Plane = ({
  dimension,
  pointPlane,
  pointsActive,
  setPointPlane,
  setPointsActive,
  threshold,
  points
}) => {
  const CANVAS_PADDING = 25; // extra space around element

	// We need to create internal refs so that resizing works properly
  const canvasRef = useRef(null);
  const pixelLength = useRef(0);

	// Functions that do the actual work
	function setupCanvas() {
		// Uses parent element to resize itself
		const { width, height } = canvasRef.current.parentElement.getBoundingClientRect();

		// Calculate the size of each "pixel" on the screen
    const pixelsMax = ((width < height) ? width : height) - CANVAS_PADDING;
    pixelLength.current = Math.floor(pixelsMax / points.base);
    
		// Size the canvas
    canvasRef.current.width = points.base * pixelLength.current;
    canvasRef.current.height = points.base * pixelLength.current;
	}

	function drawPlane() {
    const canvasCtx = canvasRef.current.getContext("2d");
    const [x, y, z] = pointPlane;
    
		// Because it's a plane we need to loop through two dimensions
		for (let d0 = 0; d0 < points.base; d0++) {
      for (let d1 = 0; d1 < points.base; d1++) {
        const point
          = (dimension === 0) ? [x, d0, d1]
          : (dimension === 1) ? [points.base - d0 - 1, y, points.base - d1 - 1]
          : [points.base - d0 - 1, d1, z];

				// xx is the position on canvas to draw this point
        const xx
          = (dimension === 0) ? d1
          : (dimension === 1) ? d0
          : d0;

				// yy is the position on canvas to draw this point
        const yy
          = (dimension === 0) ? d0
          : (dimension === 1) ? d1
          : d1;
  
        drawPoint({ canvasCtx, point, xx, yy });
      }
    }
	}

	function drawPoint({ canvasCtx, point, xx, yy }) {
    const isPointActive = (pointsActive.find(p => points.isSamePoint(point, p))) ? true : false;
    const pointValue = points.getPointValue({ point });

		// Only draw points that are within the threshold
    if (pointValue >= threshold.min && pointValue <= threshold.max) {
      const colorString = pointColor({
        isPointActive,
        pointValue
      });
      canvasCtx.fillStyle = colorString;
      canvasCtx.fillRect(xx * pixelLength.current, yy * pixelLength.current, pixelLength.current, pixelLength.current);
    }
  }

	// State Change Management through useEffect()
	useEffect(() => {
		setupCanvas();
		window.addEventListener("resize", onWindowResize);
	}, []);

	useEffect(() => {
		drawPlane();
  }, [pointsActive, pointPlane, threshold]);

	// Interaction Functions
	function onClick(e) {
		const { button, clientX, clientY, shiftKey } = e;
    const { left, top } = canvasRef.current.getBoundingClientRect();
    const xx = Math.floor((clientX - left) / pixelLength.current);
    const yy = Math.floor((clientY - top) / pixelLength.current);
    const [x, y, z] = pointPlane;
    const pointNew
      = (dimension === 0) ? [x, yy, xx]
      : (dimension === 1) ? [points.base - xx - 1, y, points.base - yy - 1]
      : (dimension === 2) ? [points.base - xx - 1, yy, z]
      : [-1, -1, -1];

		if (button === 2 && shiftKey) { // right click + shift
			const index = (pointsActive.findIndex(p => points.isSamePoint(pointNew, p)));
			const pointsNew = [...pointsActive];
			pointsNew.splice(index, 1);
			setPointsActive(pointsNew);
		} else if (button === 0 && shiftKey) {
			setPointsActive(points.getConnectedPoints({ point: pointNew, currPoints: pointsActive }));
		} else if (button === 0) {
			setPointsActive(points.getConnectedPoints({ point: pointNew }));
		}

		return e.preventDefault();
  }
	

	function onWindowResize() {
		setupCanvas();
		drawPlane();
	}

  function onWheel(e) {
    const valueCurrent = pointPlane[dimension];
    const valueNew
      = (e.deltaY > 0 && valueCurrent > 0) ? valueCurrent - 1
      : (e.deltaY < 0 && valueCurrent < points.base - 1) ? valueCurrent + 1
      : valueCurrent;

    const pointNew = points.setPointDimension({
      point: pointPlane,
      dimension: dimension,
      value: valueNew
    });

    setPointPlane(pointNew);
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        onClick={onClick}
				onContextMenu={onClick}
        onWheel={onWheel}
      ></canvas>
    </div>
  );
}
