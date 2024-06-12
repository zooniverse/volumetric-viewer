import { SortedSet, SortedSetUnion } from "./SortedSet.js";

export const PointsModel = ({ data: absoluteValue }) => {
  // Assumes 3D right now

  const base = Math.cbrt(absoluteValue.length);
  const absoluteActive = [];
  const absoluteStructured = [];
  const planesAbsoluteSets = [[], [], []];
  const structuredAbsolute = [];
  const baseFrames = [[], [], []];
  const baseFrameMod = [Math.pow(base, 2), base, 1];

  let i = 0;
  for (let x = 0; x < base; x++) {
    for (let y = 0; y < base; y++) {
      for (let z = 0; z < base; z++) {
        // absolute point index to active value
        absoluteActive[i] = 0;

        // absolute point index to [x, y, z]
        absoluteStructured[i] = [x, y, z];

        // structuredAbsolute
        if (!structuredAbsolute[x]) structuredAbsolute[x] = [];
        if (!structuredAbsolute[x][y]) structuredAbsolute[x][y] = [];
        structuredAbsolute[x][y][z] = i;

        // x = zy plane
        if (x === 0) {
          if (!baseFrames[0][z]) baseFrames[0][z] = [];
          baseFrames[0][z][y] = i;
        }

        // y = xz plane
        if (y === 0) {
          const yz = base - 1 - z;
          const yx = base - 1 - x;
          if (!baseFrames[1][yx]) baseFrames[1][yx] = [];
          baseFrames[1][yx][yz] = i;
        }

        // z = xy plane
        if (z === 0) {
          const zx = base - 1 - x;
          if (!baseFrames[2][zx]) baseFrames[2][zx] = [];
          baseFrames[2][zx][y] = i;
        }

        // planesAbsoluteSets
        if (!planesAbsoluteSets[0][x])
          planesAbsoluteSets[0][x] = SortedSet({ data: [] });
        if (!planesAbsoluteSets[1][y])
          planesAbsoluteSets[1][y] = SortedSet({ data: [] });
        if (!planesAbsoluteSets[2][z])
          planesAbsoluteSets[2][z] = SortedSet({ data: [] });

        planesAbsoluteSets[0][x].add({ value: i });
        planesAbsoluteSets[1][y].add({ value: i });
        planesAbsoluteSets[2][z].add({ value: i });
        i++;
      }
    }
  }

  const pointModel = {
    // data
    base,
    baseCenter: Math.floor(base / 2),
    baseExp2: Math.pow(base, 2),
    dimensions: ["x", "y", "z"],

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
          if (absoluteActive[pointPotential] !== 0) continue; // ignore points already active

          traversedPoints[pointPotential] = true;
          pointsToCheck.push(pointPotential);
        }

        return checkConnectedPoints();
      }

      checkConnectedPoints();
      return connectedPoints;
    },
    getPlaneFrame: ({ dimension = 0, frame }) => {
      frame = frame ?? pointModel.planeFrameActive[dimension];
      // get the base frame, then mod each point to get the absolute plane view
      const baseFrame = baseFrames[dimension];
      if (frame === 0) return baseFrame;

      const offset = baseFrameMod[dimension] * frame;
      return baseFrame.map((r) => r.map((p) => p + offset));
    },
    getPlaneSet: ({ dimension = 0, frame = 0 }) => {
      return planesAbsoluteSets[dimension][frame];
    },
    getPointFromStructured: ({ point }) => {
      if (point.indexOf(-1) > -1) return undefined;
      if (point.indexOf(pointModel.base) > -1) return point;
      const [x, y, z] = point;
      return structuredAbsolute[x][y][z];
    },
    getPointValue: ({ point }) => {
      return absoluteValue[point];
    },
    getPointCoordinates: ({ point }) => {
      return absoluteStructured[point];
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
    pointsActiveAbsolute: absoluteActive,
    absoluteActiveAdd: ({ set, point }) => {
      set = set ?? SortedSet({ data: [point] });
      set.data.forEach((point) => {
        absoluteActive[point] = 1;
      });
    },
    absoluteActiveRemove: ({ set, point }) => {
      set = set ?? SortedSet({ data: [point] });
      set.data.forEach((point) => {
        absoluteActive[point] = 0;
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
    ////////////////////////////////////////////////
    planeFrameActive: [base - 1, base - 1, base - 1],
    setPlaneActive: ({ point }) => {
      const coors = absoluteStructured[point];
      pointModel.planeFrameActive = coors;

      coors.forEach((frame, dimension) => {
        pointModel.publish(`change:dimension-${dimension}:frame`, { frame });
      });
      pointModel.publish(`change:dimension:frame`, { dimension, frame });
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
        if (listener.eventName === eventName) {
          listener.cb(data);
        }
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

  return pointModel;
};
