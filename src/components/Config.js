import { useEffect, useState } from "react";
import { AnnotationView } from "./AnnotationView.js";
import { InputRange } from "./InputRange.js";
import { InputRangeDual } from "./InputRangeDual.js";

export const Config = ({
  annotations,
  file,
  fileOptions,
  onFileChange,
  viewer,
}) => {
  const [_annotations, setAnnotations] = useState(annotations.annotations);

  function annotationsChange({ annotations }) {
    setAnnotations([...annotations]);
  }

  // State Change Management through useEffect()
  useEffect(() => {
    // State Listeners to bypass React rerenders
    annotations.on(`active:annotation`, annotationsChange);
    annotations.on(`add:annotation`, annotationsChange);
    annotations.on(`update:annotation`, annotationsChange);
    annotations.on(`remove:annotation`, annotationsChange);

    return () => {
      annotations.off(`active:annotation`, annotationsChange);
      annotations.off(`add:annotation`, annotationsChange);
      annotations.off(`update:annotation`, annotationsChange);
      annotations.off(`remove:annotation`, annotationsChange);
    };
  }, []);

  function downloadPoints() {
    const rows = annotations.annotations.map((annotation) => {
      return [
        annotation.label,
        annotation.threshold,
        annotation.points.active.join("|"),
        annotation.points.all.data.join("|"),
      ];
    });

    rows.unshift([
      "annotation name",
      "annotation threshold",
      "control points",
      "connected points",
    ]);
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
        valueMaxCurrent={viewer.threshold.max}
        valueMinCurrent={viewer.threshold.min}
        onChange={(min, max) => {
          viewer.setThreshold({ min, max });
        }}
      />
      <br />
      <br />

      {viewer.dimensions.map((dimensionName, dimension) => {
        return (
          <div key={`dimension-${dimensionName}`}>
            <h3>{dimensionName.toUpperCase()} Plane Coordinate</h3>
            <InputRange
              onChange={(value) => {
                viewer.setPlaneFrameActive({ dimension, frame: value - 1 });
              }}
              valueCurrent={viewer.getPlaneFrameActive({ dimension }) + 1}
              valueMax={viewer.base}
              valueMin={1}
            />
            <br />
            <br />
          </div>
        );
      })}

      <button onClick={downloadPoints} style={{ marginBottom: "20px" }}>
        Download Active Points
      </button>

      {_annotations.map((annotation, index) => {
        return (
          <AnnotationView
            annotation={annotation}
            annotations={annotations}
            index={index}
            key={`annotation-${index}`}
          />
        );
      })}
    </>
  );
};
