import {
  BoxGeometry,
  Color,
  HemisphereLight,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  Object3D,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Vector2,
  WebGLRenderer,
} from "three";
import { useEffect, useLayoutEffect, useRef } from "react";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { pointColor } from "./helper.js";
import { SortedSetUnion } from "./SortedSet.js";

export const Cube = ({ points }) => {
  const FPS_INTERVAL = 1000 / 60;
  const NUM_MESH_POINTS = Math.pow(points.base, 2) * 3 - points.base * 3 + 1;

  // We need to create internal refs so that resizing + animation loop works properly
  const canvasRef = useRef(null);
  const meshPlaneSet = useRef(null);
  const threeRef = useRef({});

  // State Change management through useEffect()
  useEffect(() => {
    setupCube();

    // render mesh + add to scene so that raycasting works
    renderPlanePoints();
    threeRef.current.scene.add(threeRef.current.meshPlane);

    renderActivePoints();
    animate();

    // Setup State Listeners
    points.on(`change:dimension:frame`, renderPlanePoints);
    points.on(`change:threshold`, renderPlanePoints);
    points.on(`change:pointsActive`, renderActivePoints);

    return () => {
      points.off(`change:dimension:frame`, renderPlanePoints);
      points.off(`change:threshold`, renderPlanePoints);
      points.off(`change:pointsActive`, renderActivePoints);
    };
  }, []);

  useLayoutEffect(() => {
    window.addEventListener("resize", onWindowResize);
    window.addEventListener("mousemove", onMouseMove);

    return () => {
      window.removeEventListener("resize", onWindowResize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  // Functions that do the actual work
  function setupCube() {
    const { width, height } =
      canvasRef.current.parentElement.getBoundingClientRect();

    // Setup Ref object once DOM is rendered
    threeRef.current = {
      canvas: null,
      camera: new PerspectiveCamera(100, width / height, 0.01, 3000),
      cubes: new Object3D(),
      isShift: false,
      isClicked: -1,
      lastRender: 0,
      light: new HemisphereLight(0xffffff, 0x888888, 3),
      matrix: new Matrix4(),
      mouse: new Vector2(1, 1),
      mouseDown: 0,
      meshPlane: new InstancedMesh(
        new BoxGeometry(1, 1, 1),
        new MeshBasicMaterial({ color: 0xffffff }),
        NUM_MESH_POINTS,
      ),
      meshActive: new InstancedMesh(
        new BoxGeometry(1, 1, 1),
        new MeshBasicMaterial({ color: 0xffffff }),
        points.pointsActive.data.length,
      ),
      orbit: null,
      raycaster: new Raycaster(),
      renderer: null,
      scene: new Scene(),
    };

    // Setup camera, light, scene, and orbit controls
    threeRef.current.camera.position.set(points.base, points.base, points.base);
    threeRef.current.camera.lookAt(0, 0, 0);

    threeRef.current.light.position.set(0, 1, 0);

    threeRef.current.meshPlane.name = "plane";

    threeRef.current.scene.background = new Color(0x222222);
    threeRef.current.scene.add(threeRef.current.light);

    threeRef.current.renderer = new WebGLRenderer({
      canvas: canvasRef.current,
    });
    threeRef.current.renderer.setPixelRatio(window.devicePixelRatio);
    threeRef.current.renderer.setSize(width, height);

    threeRef.current.orbit = new OrbitControls(
      threeRef.current.camera,
      threeRef.current.renderer.domElement,
    );
    threeRef.current.orbit.enableDamping = false;
    threeRef.current.orbit.enableZoom = true;
    threeRef.current.orbit.enablePan = false;
  }

  function animate() {
    const lastRender = Date.now() - threeRef.current.lastRender;
    requestAnimationFrame(animate);

    if (lastRender > FPS_INTERVAL) {
      // throttle to 60fps
      render();
      threeRef.current.lastRender = Date.now();
    }
  }

  function render() {
    threeRef.current.raycaster.setFromCamera(
      threeRef.current.mouse,
      threeRef.current.camera,
    );

    // Because the render loop is called every frame, we minimize work to only that needed for click
    if (threeRef.current.isClicked !== -1) {
      const clickType = threeRef.current.isClicked;
      const isShift = threeRef.current.isShift;

      const intersectionScene = threeRef.current.raycaster.intersectObject(
        threeRef.current.scene,
      );

      // reset modifiers
      threeRef.current.isClicked = -1;
      threeRef.current.isShift = false;
      if (intersectionScene.length > 0) {
        let isActive = false;

        // because the scene is rendered before activePoints, raycasting will return the plane point when there is both a plane point & active point at the same coordinate
        if (
          intersectionScene.length >= 2 &&
          intersectionScene[0].object.name === "plane" &&
          intersectionScene[1].object.name === "active"
        ) {
          const p1 = meshPlaneSet.current.data[intersectionScene[0].instanceId];
          const p2 = points.pointsActive.data[intersectionScene[1].instanceId];
          isActive = p1 === p2;
        }

        const type = intersectionScene[0].object.name;
        const index = isActive
          ? intersectionScene[1].instanceId
          : intersectionScene[0].instanceId;

        if (type === "active" || isActive) {
          const point = points.pointsActive.data[index];

          if (clickType === 0 && !isShift) {
            // left click + no shift
            const set = points.getConnectedPoints({ point });
            points.resetPointsActive({ set });
          } else if (clickType === 2) {
            // right click
            points.removePointActive({ point });
          }
        } else if (type === "plane") {
          const point = meshPlaneSet.current.data[index];

          if (clickType === 0) {
            // left click
            if (isShift) {
              const set = points.getConnectedPoints({ point });
              points.addPointsActive({ set });
            } else {
              const set = points.getConnectedPoints({ point });
              points.resetPointsActive({ set });
            }
          } else if (clickType === 2) {
            // right click
            points.setPlaneActive({ point });
          }
        }
      }
    }

    threeRef.current.renderer.render(
      threeRef.current.scene,
      threeRef.current.camera,
    );
  }

  function renderPlanePoints() {
    const t0 = performance.now();

    const frames = points.planeFrameActive;
    const sets = frames.map((frame, dimension) =>
      points.getPlaneSet({ dimension, frame }),
    );
    console.log("sets", sets);
    meshPlaneSet.current = SortedSetUnion({ sets });

    meshPlaneSet.current.data.forEach((point, index) => {
      drawMeshPoint({
        isPointActive: false,
        mesh: threeRef.current.meshPlane,
        meshIndex: index,
        point,
      });
    });
    console.log("Performance: renderPlanePoints()", performance.now() - t0);

    threeRef.current.meshPlane.instanceMatrix.needsUpdate = true;
    threeRef.current.meshPlane.instanceColor.needsUpdate = true;
  }

  function renderActivePoints() {
    // remove the old meshActive since pointsActive changes
    threeRef.current.scene.remove(threeRef.current.meshActive);
    threeRef.current.meshActive = new InstancedMesh(
      new BoxGeometry(1, 1, 1),
      new MeshBasicMaterial({ color: 0xffffff }),
      points.pointsActive.data.length,
    );

    // render
    points.pointsActive.data.forEach((point, index) => {
      drawMeshPoint({
        isPointActive: true,
        mesh: threeRef.current.meshActive,
        meshIndex: index,
        point,
      });
    });

    //  add the mesh back to the scene
    threeRef.current.meshActive.name = "active";
    threeRef.current.scene.add(threeRef.current.meshActive);
    threeRef.current.meshActive.instanceMatrix.needsUpdate = true;
  }

  function drawMeshPoint({ isPointActive, mesh, meshIndex, point }) {
    const pointValue = points.getPointValue({ point });
    const isVisible = points.isInThreshold({ point });
    const position = isVisible
      ? getPositionInSpace({ coors: points.getPointCoordinates({ point }) })
      : [50000, 50000, 50000]; // basically remove from view

    threeRef.current.matrix.setPosition(...position);
    mesh.setMatrixAt(meshIndex, threeRef.current.matrix);
    mesh.setColorAt(
      meshIndex,
      pointColor({
        isPointActive,
        isThree: true,
        pointValue: pointValue,
      }),
    );
  }

  // Calculate the physical position in space
  function getPositionInSpace({ coors }) {
    const [x, y, z] = coors;
    const numPointsAdjustment = points.base - 1;
    const positionOffset = (numPointsAdjustment / 2) * -1;

    return [
      numPointsAdjustment + positionOffset - x,
      numPointsAdjustment + positionOffset - y,
      numPointsAdjustment + positionOffset - z,
    ];
  }

  // Interaction Functions
  function onMouseMove(e) {
    // Update the base ref() so that the animation loop handles the mouse move
    const { height, left, top, width } =
      canvasRef.current.parentElement.getBoundingClientRect();
    threeRef.current.mouse.x = 2 * ((e.clientX - left) / width) - 1;
    threeRef.current.mouse.y = 1 - 2 * ((e.clientY - top) / height);
  }

  function onPointerDown() {
    // detect click through pointer down + up since we can rotate the Cube
    threeRef.current.mouseDown = Date.now();
  }

  function onPointerUp(e) {
    const duration = Date.now() - threeRef.current.mouseDown;
    if (duration < 150) {
      // ms to call it a click
      if (e.shiftKey) threeRef.current.isShift = true;
      threeRef.current.isClicked = e.button;
    }
  }

  function onWindowResize() {
    // constrain based on parent element width and height
    const { width, height } =
      canvasRef.current.parentElement.getBoundingClientRect();
    threeRef.current.camera.aspect = width / height;
    threeRef.current.camera.updateProjectionMatrix();
    threeRef.current.renderer.setSize(width, height);
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      />
    </div>
  );
};
