export const PointsModel = (_points) => {
	// Points is nested array accessed as _points[x][y][z]
	// Assumes 3D right now
	
	const pointModel = {
		base: _points.length,
		baseCenter: Math.floor(_points.length / 2),
		baseExp2: Math.pow(_points.length, 2),
		dimensions: ['x', 'y', 'z'],
		getConnectedPoints: ({ point, threshold = 30, currPoints = [] }) => {
			const pointValue = pointModel.getPointValue({ point });
			const traversedPoints = {};
			const connectedPoints = new Set(currPoints);
			
			function checkConnectedPoints({ point }) {
				const [x, y, z] = point;
				const points = [
					[x - 1, y, z],
					[x + 1, y, z],
					[x, y - 1, z],
					[x, y + 1, z],
					[x, y, z - 1],
					[x, y, z + 1]
				];

				points.forEach(pnt => {
					if (!traversedPoints[pnt.join(':')]) {
						const pv = pointModel.getPointValue({ point: pnt });

						if ((pointValue - threshold) <= pv && pv <= (pointValue + threshold)) {
							connectedPoints.add(pnt);
							traversedPoints[pnt.join(':')] = true;
							checkConnectedPoints({ point: pnt });
						}
					}
				});
			}

			checkConnectedPoints({ point });
			return Array.from(connectedPoints);
		},
		getPointValue: ({ point }) => {
			const [x, y, z] = point;
			return _points[x][y][z];
		},
		getPointValueColor: (pointValue) => {
			// based on pointValue && assumes knowledge of active points
			// Plane line 23
			
		},
		isVisible: () => {
			// Plane line 22

		},
		isSamePoint: (p1, p2) => {
			if (!p1 || !p2) return false;
			return p1.join(':') === p2.join(':');
		},
		isSimilarPoint: (p1, p2) => { // similar means sharing 1 or more dimension values
			if (!p1 || !p2) return false;
			let isSimilar = false;
			p1.forEach(i => {
				if (p1[i] === p2[i]) isSimilar = true;
			});
			return isSimilar;
		},
		setPointDimension: ({ point, dimension, value }) => {
			const newPoint = [...point];
			newPoint[dimension] = value;
			return newPoint;
		}
	};

	return pointModel;
};
