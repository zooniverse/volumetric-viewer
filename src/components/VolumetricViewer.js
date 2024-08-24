import { AlgorithmAStar } from "./AlgorithmAStar.js";
import { Config } from "./Config.js";
import { Cube } from "./Cube.js";
import { Plane } from "./Plane.js";

export const VolumetricViewer = ({
  config,
  data,
  file,
  fileOptions,
  models,
  onFileChange,
}) => {
  // Initialize the underlying models
  if (models.annotations) {
    models.annotations.initialize({
      algorithm: AlgorithmAStar,
      algorithmRunOnInit: true,
      data: [], // will come from Caesar if they exist
      tool: models.tool,
      viewer: models.viewer,
    });
  }

  // Tool
  if (models.tool) {
    models.tool.initialize({
      annotations: models.annotations,
      viewer: models.viewer,
    });
  }

  // Viewer
  if (models.viewer) {
    models.viewer.initialize({
      annotations: models.annotations,
      data,
      tool: models.tool,
    });
  }

  return (
    <>
      <div className="sidebar">
        <h1>BrainSweeper</h1>
        <br />
        <br />
        <Config
          annotations={models.annotations}
          file={file}
          fileOptions={fileOptions}
          onFileChange={onFileChange}
          viewer={models.viewer}
        />
      </div>
      <div className="viewer">
        <Cube
          annotations={models.annotations}
          tool={models.tool}
          viewer={models.viewer}
        />
        <div className="viewer-planes">
          {models.viewer.dimensions.map((dimensionName, dimension) => {
            return (
              <Plane
                annotations={models.annotations}
                dimension={dimension}
                key={`dimension-${dimensionName}`}
                tool={models.tool}
                viewer={models.viewer}
              />
            );
          })}
        </div>
      </div>
    </>
  );
};
