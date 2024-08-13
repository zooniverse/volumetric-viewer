import { SortedSet, SortedSetUnion } from "./SortedSet.js";

export const PointsModel = ({ data: absoluteValue }) => {
  // Assumes 3D right now
  const BASE = Math.cbrt(absoluteValue.length);

  const pointModel = {
    // data
    base: BASE,
    dimensions: ["x", "y", "z"],
    points: [],
    annotations: [],
    //
    pointsActiveAbsolute: [],
    planesAbsoluteSets: [[], [], []],
    baseFrames: [[], [], []],
    baseFrameMod: [Math.pow(BASE, 2), BASE, 1],
    //
    setup: () => {
      let i = 0;
      for (let x = 0; x < BASE; x++) {
        for (let y = 0; y < BASE; y++) {
          for (let z = 0; z < BASE; z++) {
            pointModel.points[i] = [
              absoluteValue[i],
              x,
              y,
              z,
              true,
              0, // default annotation index is 0 as it isn't in an annotation
            ];

            // absolute point index to active value
            pointModel.pointsActiveAbsolute[i] = 0;

            // x = zy plane
            if (x === 0) {
              if (!pointModel.baseFrames[0][z])
                pointModel.baseFrames[0][z] = [];
              pointModel.baseFrames[0][z][y] = i;
            }

            // y = xz plane
            if (y === 0) {
              const yz = BASE - 1 - z;
              const yx = BASE - 1 - x;
              if (!pointModel.baseFrames[1][yx])
                pointModel.baseFrames[1][yx] = [];
              pointModel.baseFrames[1][yx][yz] = i;
            }

            // z = xy plane
            if (z === 0) {
              const zx = BASE - 1 - x;
              if (!pointModel.baseFrames[2][zx])
                pointModel.baseFrames[2][zx] = [];
              pointModel.baseFrames[2][zx][y] = i;
            }

            // planesAbsoluteSets
            if (!pointModel.planesAbsoluteSets[0][x])
              pointModel.planesAbsoluteSets[0][x] = SortedSet({ data: [] });
            if (!pointModel.planesAbsoluteSets[1][y])
              pointModel.planesAbsoluteSets[1][y] = SortedSet({ data: [] });
            if (!pointModel.planesAbsoluteSets[2][z])
              pointModel.planesAbsoluteSets[2][z] = SortedSet({ data: [] });

            pointModel.planesAbsoluteSets[0][x].add({ value: i });
            pointModel.planesAbsoluteSets[1][y].add({ value: i });
            pointModel.planesAbsoluteSets[2][z].add({ value: i });
            i++;
          }
        }
      }

      console.log("base frames", pointModel.baseFrames);
    },

    // methods
    getConnectedPoints: ({ point: pointOrig, threshold = 30 }) => {
      const pointValueStart = pointModel.getPointValue({ point: pointOrig });
      const traversedPoints = [];
      const connectedPoints = SortedSet({ data: [pointOrig] });
      const pointsToCheck = [pointOrig];
      let numPoints = 1000;

      function checkConnectedPoints() {
        if (pointsToCheck.length === 0) return;
        if (--numPoints < 0) return;

        const point = pointsToCheck.shift();
        const pointValue = pointModel.getPointValue({ point });
        const isPointValid =
          pointValue >= pointValueStart - threshold &&
          pointValue <= pointValueStart + threshold;

        // if the point is not valid, we don't want to do anything else with it
        if (!isPointValid) return checkConnectedPoints();

        // point is a connected point
        connectedPoints.add({ value: point });

        // check all points around it
        const [x, y, z] = pointModel.getPointCoordinates({ point });
        const pointsAdjascent = [
          [x - 1, y, z],
          [x + 1, y, z],
          [x, y - 1, z],
          [x, y + 1, z],
          [x, y, z - 1],
          [x, y, z + 1],
        ];

        for (let i = 0; i < pointsAdjascent.length; i++) {
          const pointPotential = pointModel.getPointFromStructured({
            point: pointsAdjascent[i],
          });
          if (pointPotential === undefined) continue; // ignore points that don't exist
          if (traversedPoints[pointPotential]) continue; // ignore points already checked
          if (pointModel.pointsActiveAbsolute[pointPotential] !== 0) continue; // ignore points already active

          traversedPoints[pointPotential] = true;
          pointsToCheck.push(pointPotential);
        }

        return checkConnectedPoints();
      }

      checkConnectedPoints();
      return connectedPoints;
    },

    absoluteActiveAdd: ({ set, point }) => {
      set = set ?? SortedSet({ data: [point] });
      set.data.forEach((point) => {
        pointModel.pointsActiveAbsolute[point] = 1;
      });
    },
    absoluteActiveRemove: ({ set, point }) => {
      set = set ?? SortedSet({ data: [point] });
      set.data.forEach((point) => {
        pointModel.pointsActiveAbsolute[point] = 0;
      });
    },
    getPointFromStructured: ({ point }) => {
      if (point.indexOf(-1) > -1) return undefined;
      if (point.indexOf(pointModel.base) > -1) return point;

      return point
        .map((factor, dim) => pointModel.baseFrameMod[dim] * factor)
        .reduce((acc, val) => acc + val, 0);
    },

    getPointValue: ({ point }) => {
      return pointModel.points[point][0];
    },
    getPointCoordinates: ({ point }) => {
      return pointModel.points[point].slice(1, 4);
    },
    ////////////////////////////////////////////////
    pointsActive: SortedSet({ data: [] }),
    resetPointsActive: ({ set }) => {
      pointModel.absoluteActiveRemove({ set: pointModel.pointsActive });
      pointModel.pointsActive = set;
      pointModel.absoluteActiveAdd({ set });
      pointModel.publish(`change:pointsActive`, { set });
    },
    addPointsActive: ({ set }) => {
      const union = SortedSetUnion({ sets: [set, pointModel.pointsActive] });
      pointModel.absoluteActiveAdd({ set });
      pointModel.pointsActive = union;
      pointModel.publish(`change:pointsActive`, { set: union });
    },
    removePointActive: ({ point }) => {
      pointModel.pointsActive.remove({ value: point });
      pointModel.absoluteActiveRemove({ point });
      pointModel.publish(`change:pointsActive`, {
        set: pointModel.pointsActive,
      });
    },
    ////////////////////////////////////////////////
    threshold: { min: 0, max: 255 },
    isInThreshold: ({ point }) => {
      const pointValue = pointModel.getPointValue({ point });
      return (
        pointValue >= pointModel.threshold.min &&
        pointValue <= pointModel.threshold.max
      );
    },
    setThreshold: ({ min, max }) => {
      pointModel.threshold.min = min;
      pointModel.threshold.max = max;
      pointModel.publish(`change:threshold`, { min, max });
    },

    // frame =
    ////////////////////////////////////////////////
    getPlaneFrame: ({ dimension = 0, frame }) => {
      frame = frame ?? pointModel.planeFrameActive[dimension];
      // get the base frame, then mod each point to get the absolute plane view
      const baseFrame = pointModel.baseFrames[dimension];
      if (frame === 0) return baseFrame;

      const offset = pointModel.baseFrameMod[dimension] * frame;
      return baseFrame.map((r) => r.map((p) => p + offset));
    },
    getPlaneSet: ({ dimension = 0, frame = 0 }) => {
      return pointModel.planesAbsoluteSets[dimension][frame];
    },
    planeFrameActive: [BASE - 1, BASE - 1, BASE - 1],
    setPlaneActive: ({ point }) => {
      pointModel.planeFrameActive = pointModel.getPointCoordinates({ point });
      pointModel.planeFrameActive.forEach((frame, dimension) => {
        pointModel.publish(`change:dimension-${dimension}:frame`, { frame });
      });
    },
    getPlaneFrameActive: ({ dimension = 0 }) => {
      return pointModel.planeFrameActive[dimension];
    },
    setPlaneFrameActive: ({ dimension, frame }) => {
      pointModel.planeFrameActive[dimension] = frame;
      pointModel.publish(`change:dimension-${dimension}:frame`, { frame });
      pointModel.publish(`change:dimension:frame`, { dimension, frame });
    },

    ////////////////////////////////////////////////
    _listeners: [],
    publish: (eventName, data) => {
      pointModel._listeners.forEach((listener) => {
        if (listener.eventName === eventName) listener.cb(data);
      });
    },
    on: (eventName, cb) => {
      pointModel._listeners.push({ eventName, cb });
    },
    off: (eventName, cb) => {
      const index = pointModel._listeners.findIndex(
        (listener) => listener.eventName === eventName && listener.cb === cb,
      );
      if (index > -1) pointModel._listeners.splice(index, 1);
    },
  };

  pointModel.setup();

  return pointModel;
};
