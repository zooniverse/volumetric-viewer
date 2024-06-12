import { InputRange } from "./InputRange.js";
import { InputRangeDual } from "./InputRangeDual.js";

export const Config = ({ file, fileOptions, onFileChange, points }) => {
  function downloadPoints() {
    const rows = points.pointsActive.data.map((point) =>
      points.getPointCoordinates({ point }),
    );

    rows.unshift(["x", "y", "z"]);

    const csvContent =
      "data:text/csv;charset=utf-8," + rows.map((r) => r.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "brainsweeper.csv");
    document.body.appendChild(link);
    link.click();
  }

  return (
    <>
      <h3 style={{ paddingBottom: "10px" }}>Volumetric File</h3>
      <select
        value={file}
        onChange={(e) => onFileChange({ file: e.target.value })}
      >
        {fileOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <br />

      <h3>Brightness Range</h3>
      <InputRangeDual
        valueMax={255}
        valueMin={0}
        valueMaxCurrent={points.threshold.max}
        valueMinCurrent={points.threshold.min}
        onChange={(min, max) => {
          points.setThreshold({ min, max });
        }}
      />
      <br />
      <br />

      {points.dimensions.map((dimensionName, dimension) => {
        return (
          <div key={`dimension-${dimensionName}`}>
            <h3>{dimensionName.toUpperCase()} Plane Coordinate</h3>
            <InputRange
              onChange={(value) => {
                points.setPlaneFrameActive({ dimension, frame: value - 1 });
              }}
              valueCurrent={points.getPlaneFrameActive({ dimension }) + 1}
              valueMax={points.base}
              valueMin={1}
            />
            <br />
            <br />
          </div>
        );
      })}

      <button onClick={downloadPoints}>Download Active Points</button>
    </>
  );
};
