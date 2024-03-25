"use client";

import { useState } from "react";
import { Config } from "./Config.js";
import { Cube } from "./Cube.js";
import { Plane } from "./Plane.js";
import { PointsModel } from "./PointsModel.js";

// import _points_data from "./../data/4x4x4.json";
// import _points_data from "./../data/7x7x7.json";
// import _points_data from "./../data/16x16x16.json";
import _points_data from "./../data/32x32x32.json";
// import _points_data from "./../data/64x64x64.json";
// import _points_data from "./../data/128x128x128.json";

export default function Home() {
	const points = PointsModel(_points_data);
	const [pointPlane, setPointPlane] = useState([points.baseCenter, points.baseCenter, points.baseCenter]);
  const [pointsActive, setPointsActive] = useState([[points.baseCenter, points.baseCenter, points.baseCenter]]);
	const [threshold, setThreshold] = useState({ min: 0, max: 255 });

  return (
    <div className="container">
      <div className="sidebar">
				<h1>NIH Brain Project</h1>
				<br />
				<br />
				<Config
					pointPlane={pointPlane}
					setPointPlane={setPointPlane}
					setThreshold={setThreshold}
					threshold={threshold}
					points={points}
				/>
      </div>
      <div className="viewer">
				<Cube
					points={points}
					pointsActive={pointsActive}
					pointPlane={pointPlane}
					setPointsActive={setPointsActive}
					setPointPlane={setPointPlane}
					threshold={threshold}
				/>
				{points.dimensions.map((dimensionName, dimension) => {
					return <Plane
						dimension={dimension}
						key={`dimension-${dimensionName}-${pointPlane[dimension]}`}
						points={points}
						pointsActive={pointsActive}
						pointPlane={pointPlane}
						setPointsActive={setPointsActive}
						setPointPlane={setPointPlane}
						threshold={threshold}
					/>
				})}
      </div>
    </div>
  );
}
