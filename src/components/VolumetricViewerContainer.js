import { useEffect, useState } from "react";

import { VolumetricViewer } from "./VolumetricViewer.js";
import DATAFILES from "./../../public/datafiles.json";
import { ModelViewer } from "./ModelViewer.js";
import { ModelAnnotations } from "./ModelAnnotations.js";
import { ModelTool } from "./ModelTool.js";

export const VolumetricViewerContainer = () => {
  const [file, setFile] = useState(DATAFILES[1]);
  const [data, setData] = useState(false);
  const [models, setModels] = useState({
    annotations: ModelAnnotations(),
    tool: ModelTool(),
    viewer: ModelViewer(),
  });

  // Load whatever file we're looking to view
  useEffect(() => {
    fetch(`/b64/${file}.json`)
      .then((res) => res.json())
      .then((data) => {
        // data is base64. Convert to Uint8 array
        setData(Buffer.from(data, "base64"));
      });
  }, [file]);

  // when selected file changes, load new data
  const onFileChange = ({ file }) => {
    setData(false);
    setFile(file);
  };

  // If we're loading, show a loading message
  if (data === false) return <div>Loading...</div>;

  // Setup a base config object
  const config = {};

  return (
    <div className="container">
      <VolumetricViewer
        config={config}
        data={data}
        file={file}
        fileOptions={DATAFILES}
        models={models}
        onFileChange={onFileChange}
      />
    </div>
  );
};
