# Volumetric Viewer

The volumetric viewer is a tool for visualizing and annotating structured volumetric data. This project is part of a grant funded by the NIH for the visualization and annotation of neuroimaging data.

## Assumptions

1. The underlying data is volumetric in structure, specifically that each datapoint correlates with a voxel within 3d space
1. There is no inherent 3D structure to incorporate beyond the underlying voxel-space (no meshes, for example)
1. The annotation process should be flexible and allow for a variety of annotation tools/processes (manual, algorithmic, generative, etc)

## Goals

1. The viewer should be performant for volumetric datasets up to 128^3 (~2M datapoints)
1. The viewer should support both 3D (volumetric) and 2D (planar) views
1. The viewer should be built on top of robust and well-tested libraries/frameworks/tools (React.js + Next.js + Three.js)
1. The viewer should be configurable with a default annotation process implementing the A\* algorithm

## Architecture

1. `PointModel` takes in a 1D array of datapoints and provides methods for interaction.
1. `AbsoluteActive` is a 1D array same size as PointModel, but each value is its active/selected state. This enables efficient lookup of how to render a point as active or default.
1. `BaseFrames` are the X, Y, Z base planar views generated and cached on dataload. To get to another plane is simple mathematical mapping from the base frame to the new frame. The linear mapping is 128^2 addition operations per render.
1. `SortedSet` creates a sorted set of indices for the 1D array of datapoints. This is used for efficient intersection and union operations, especially in rendering the 3D cube and an irregular active set.
1. `getConnectedPoints()` is the most computationally intense operation. It utilizes `AbsoluteActive`, `SortedSet`, and other cached data to efficiently compute the connected points.

## Getting Started
Install the dependencies and start the application:

```js
yarn install
yarn dev
```

Open the app at the URL in the console. Should be something like: `https://localhost:3000`

## License

Copyright 2018 Zooniverse

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
