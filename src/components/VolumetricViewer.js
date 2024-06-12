import { useEffect, useState } from "react";

import { Config } from "./Config.js";
import { Cube } from "./Cube.js";
import { Plane } from "./Plane.js";
import { PointsModel } from "./PointsModel.js";

import DATAFILES from "./../../public/datafiles.json";

export const VolumetricViewer = () => {
  const [file, setFile] = useState(DATAFILES[2]);
  const [data, setData] = useState(false);

  // Load whatever file we're looking to view
  useEffect(() => {
    fetch(`/data/${file}.json`)
      .then((res) => res.json())
      .then((data) => setData(data));
  }, [file]);

  // when selected file changes, load new data
  const onFileChange = ({ file }) => {
    setData(false);
    setFile(file);
  };

  // If we're loading, show a loading message
  if (data === false) return <div>Loading...</div>;

  // After data is loaded, setup the underlying model
  const points = PointsModel({ data });

  return (
    <div className="container">
      <div className="sidebar">
        <h1>BrainSweeper</h1>
        <br />
        <br />
        <Config
          file={file}
          fileOptions={DATAFILES}
          onFileChange={onFileChange}
          points={points}
        />
      </div>
      <div className="viewer">
        <Cube points={points} />
        {points.dimensions.map((dimensionName, dimension) => {
          return (
            <Plane
              dimension={dimension}
              key={`dimension-${dimensionName}`}
              points={points}
            />
          );
        })}
      </div>
    </div>
  );
};
