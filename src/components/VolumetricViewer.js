import { useEffect, useState } from "react";

import { Config } from "./Config.js";
import { Cube } from "./Cube.js";
import { Plane } from "./Plane.js";
import { PointsModel } from "./PointsModel.js";
import { SortedSet } from "./SortedSet.js";

import DATAFILES from "./../../public/datafiles.json";

export const VolumetricViewer = () => {
  const [file, setFile] = useState(DATAFILES[13]);
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

  // KAMESWARA: add active points here
  points.resetPointsActive({
    set: SortedSet({
      data: [
        991831, 876888, 811226, 696415, 680031, 663647, 647263, 630879, 614495,
        2046947, 2041949, 2014545, 2014544, 2014543, 2014542, 2014541, 1960672,
        1916119, 1866470, 1862753, 1834207, 1834206, 1817955, 1817954, 1817953,
        1801572, 1785188, 1768804, 1752420, 1751530, 1751402, 1748582, 1735018,
        1719655, 1685114, 1685113, 1683045, 1668602, 1666788, 1650404, 1634021,
        1617638, 1605233, 1601254, 1599688, 1553274, 1523191, 1503209, 1487354,
        1421676, 1405292, 1405050, 1391996, 1388538, 1385803, 1372026, 1355514,
        1291241, 1274984, 1271120, 1258600, 1254736, 1242216, 1238352, 1177190,
        1161064, 1160935, 1144682, 1123155, 1106771, 1063536, 1063408, 1057494,
        1047922, 1047794,
      ],
    }),
  });

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
