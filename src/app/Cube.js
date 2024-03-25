import * as THREE from "three";
import { useEffect, useRef } from "react";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { pointColor } from "./helper.js";

// https://threejs.org/examples/?q=control#misc_controls_transform
// https://threejs.org/examples/#webgl_instancing_raycast

// Hashmap of coordinate to mesh item index
const meshPlaneIndexPoint = {
	_index: [],
	get: ({ index }) => {
		return meshPlaneIndexPoint._index[index];
	},
	set: ({ index, point }) => {
		meshPlaneIndexPoint._index[index] = point;
	}
};

export const Cube = ({
  points,
  pointPlane,
  pointsActive,
  setPointPlane,
  setPointsActive,
  threshold,
}) => {
	const FPS_INTERVAL = 1000 / 60;
	const NUM_MESH_POINTS = (points.baseExp2 * 3) - (points.base * 3);
	
	// We need to create internal refs so that resizing + animation loop works properly
	const canvasRef = useRef(null);
  const pointsActiveRef = useRef(pointsActive);
  const pointPlaneRef = useRef(pointPlane);
  const threeRef = useRef({});

	// Functions that do the actual work
	function setupCube() {
    const { width, height } = canvasRef.current.parentElement.getBoundingClientRect();
    
    // Setup Ref object once DOM is rendered
    threeRef.current = {
      canvas: null,
      camera: new THREE.PerspectiveCamera(100, (width / height), 0.01, 3000),
      cubes: new THREE.Object3D(),
			isShift: false,
      isClicked: -1,
      lastRender: 0,
      light: new THREE.HemisphereLight( 0xffffff, 0x888888, 3 ),
      matrix: new THREE.Matrix4(),
      mouse: new THREE.Vector2(1, 1),
      mouseDown: 0,
      meshPlane: new THREE.InstancedMesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial( { color: 0xffffff } ),
        NUM_MESH_POINTS
      ),
			meshActive: new THREE.InstancedMesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial( { color: 0xffffff } ),
        pointsActive.length
      ),
      orbit: null,
      raycaster: new THREE.Raycaster(), 
      renderer: null,
      scene: new THREE.Scene(),
    };

    // Setup camera, light, scene, and orbit controls
    threeRef.current.camera.position.set(points.base, points.base, points.base);
    threeRef.current.camera.lookAt(0, 0, 0);

		threeRef.current.light.position.set(0, 1, 0);

		threeRef.current.meshPlane.name = 'plane';

    threeRef.current.scene.background = new THREE.Color( 0x222222 );
    threeRef.current.scene.add(threeRef.current.light);

    threeRef.current.renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
    threeRef.current.renderer.setPixelRatio(window.devicePixelRatio);
    threeRef.current.renderer.setSize(width, height);
  
    threeRef.current.orbit = new OrbitControls(threeRef.current.camera, threeRef.current.renderer.domElement);
    threeRef.current.orbit.enableDamping = false;
    threeRef.current.orbit.enableZoom = true;
    threeRef.current.orbit.enablePan = false;
	}

	function animate() {
    const lastRender = Date.now() - threeRef.current.lastRender;
    requestAnimationFrame(animate);

    if (lastRender > FPS_INTERVAL) { // throttle to 60fps
      // test for Kameswara
      // let aPoint = {
      //   x: (pointPlaneRef.current.x + 1) % points.base,
      //   y: pointPlaneRef.current.y,
      //   z: pointPlaneRef.current.z,
      // };
      // setPointPlane(aPoint);

      render();
      threeRef.current.lastRender = Date.now();
    }
  }

  function render() {
    threeRef.current.raycaster.setFromCamera(threeRef.current.mouse, threeRef.current.camera);

		// Because the render loop is called every frame, we minimize work to only that needed for click
		if (threeRef.current.isClicked !== -1) {
			const clickType = threeRef.current.isClicked;
			const isShift = threeRef.current.isShift;
			
			const intersectionScene = threeRef.current.raycaster.intersectObject(threeRef.current.scene);
			
			// reset modifiers
			threeRef.current.isClicked = -1;
			threeRef.current.isShift = false;
			if (intersectionScene.length > 0) {
				let isActive = false;

				// because the scene is rendered before activePoints, raycasting will return the plane point when there is both a plane point & active point at the same coordinate
				if (intersectionScene.length >= 2 
					&& intersectionScene[0].object.name === 'plane'
					&& intersectionScene[1].object.name === 'active'
				) { 
					const p1 = meshPlaneIndexPoint.get({ index: intersectionScene[0].instanceId });
					const p2 = pointsActiveRef.current[intersectionScene[1].instanceId];
					isActive = (points.isSamePoint(p1, p2));
				}
				
				const type = intersectionScene[0].object.name;
				const index = (isActive)
					? intersectionScene[1].instanceId
					: intersectionScene[0].instanceId
				
				if (type === 'active' || isActive) {
					const point = pointsActiveRef.current[index];
	
					if (clickType === 0 && !isShift) { // left click + no shift
						setPointsActive([point]);
					} else if (clickType === 2) { // right click
						const points = [...pointsActiveRef.current];
						points.splice(index, 1);
						setPointsActive(points);
					}
				} else if (type === 'plane') {
					const point = meshPlaneIndexPoint.get({ index });
	
					if (clickType === 0) {  // left click
						if (isShift) {
							setPointsActive(points.getConnectedPoints({ point, currPoints: pointsActiveRef.current }));
						} else {
							setPointsActive(points.getConnectedPoints({ point }));
						}
					} else if (clickType === 2) { // right click
						setPointPlane(point);
					}
				}
			}
		}

    threeRef.current.renderer.render(threeRef.current.scene, threeRef.current.camera);
  }

	function renderPlanePoints() {
    let meshIndex = 0;
    points.dimensions.forEach((dimensionName, dimension) => {
      for (let n1 = 0; n1 < points.base; n1++) {
        for (let n2 = 0; n2 < points.base; n2++) {
          // create [x, y, z] depending on plane dimension
          const [x, y, z] = (dimension === 0)
            ? [pointPlane[dimension], n1, n2]
            : (dimension === 1)
              ? [n1, pointPlane[dimension], n2]
              : [n1, n2, pointPlane[dimension]]
          
          if (dimension === 1 && x === pointPlane[0]) {
            // this is the line from Y plane that intersects with the X plane
          } else if (dimension === 2 && (x === pointPlane[0] || y === pointPlane[1])) {
            // this is the line from Z plane that intersects with the Z plane
          } else {
            meshPlaneIndexPoint.set({ index: meshIndex, point: [x, y, z] });

            drawMeshPoint({
							isPointActive: false,
							mesh: threeRef.current.meshPlane,
							meshIndex,
							point: [x, y, z]
						});
            meshIndex++;
          }
        }
      }
    });
  }

	// Currently WIP for A* algorithm
	function renderActivePoints() {
		let meshIndex = 0;
    pointsActiveRef.current.forEach(point => {
			drawMeshPoint({
				isPointActive: true,
				mesh: threeRef.current.meshActive,
				meshIndex,
				point,
			});
			meshIndex++;
    });
	}

	// Calculate the physical position in space
	function getPositionInSpace(point, base) {
		const [x, y, z] = point;
		const numPointsAdjustment = base - 1;
		const positionOffset = (numPointsAdjustment / 2) * -1;

		return [
			numPointsAdjustment + positionOffset - x,
			numPointsAdjustment + positionOffset - y,
			numPointsAdjustment + positionOffset - z
		];
	}

  function drawMeshPoint({ isPointActive, mesh, meshIndex, point }) {
    const pointValue = points.getPointValue({ point });
		
    const isHidden = (pointValue < threshold.min || pointValue > threshold.max);
    const position = (isHidden)
      ? [50000, 50000, 50000] // basically remove from view
      : getPositionInSpace(point, points.base);

    threeRef.current.matrix.setPosition(...position);
    mesh.setMatrixAt(meshIndex, threeRef.current.matrix);
    mesh.setColorAt(meshIndex, new THREE.Color(pointColor({
      isPointActive,
      pointValue: pointValue
    })));
  }

	// State Change management through useEffect()
  useEffect(() => {
		setupCube();

    window.addEventListener("resize", onWindowResize);
    window.addEventListener("mousemove", onMouseMove);

    // render mesh + add to scene so that raycasting works
    renderPlanePoints();
    threeRef.current.scene.add(threeRef.current.meshPlane);

		renderActivePoints();
		threeRef.current.meshActive.name = 'active';
		threeRef.current.scene.add(threeRef.current.meshActive);

		animate();
  }, []);


  useEffect(() => {
    // Update reference for animation loop
    pointPlaneRef.current = pointPlane;

		// Render the plane points after the pointPlane changed
    renderPlanePoints();
    threeRef.current.meshPlane.instanceMatrix.needsUpdate = true
    threeRef.current.meshPlane.instanceColor.needsUpdate = true
  }, [threshold, pointPlane]);


  useEffect(() => {
		// update reference for the animation loop
    pointsActiveRef.current = pointsActive;

		// remove the old meshActive since pointsActive changes
    threeRef.current.scene.remove(threeRef.current.meshActive);
		threeRef.current.meshActive = new THREE.InstancedMesh(
			new THREE.BoxGeometry(1, 1, 1),
			new THREE.MeshBasicMaterial( { color: 0xffffff } ),
			pointsActive.length
		)

		// render and add the mesh back to the scene
		renderActivePoints();
		threeRef.current.meshActive.name = 'active';
		threeRef.current.scene.add(threeRef.current.meshActive);
  }, [pointsActive]);


	// Interaction Functions
  function onMouseMove(e) {
    // Update the base ref() so that the animation loop handles the mouse move
    const { height, left, top, width } = canvasRef.current.parentElement.getBoundingClientRect();
    threeRef.current.mouse.x = 2 * ((e.clientX - left) / width) - 1;
    threeRef.current.mouse.y = 1 - 2 * ((e.clientY - top) / height);
  }

  function onPointerDown() {
		// detect click through pointer down + up since we can rotate the Cube
		threeRef.current.mouseDown = Date.now();
  }

  function onPointerUp(e) {
    const duration = Date.now() - threeRef.current.mouseDown;
    if (duration < 150) { // ms to call it a click
			if (e.shiftKey) threeRef.current.isShift = true;
			threeRef.current.isClicked = e.button;
		}
  }

  function onWindowResize() {
    // constrain based on parent element width and height
    const { width, height } = canvasRef.current.parentElement.getBoundingClientRect();
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
}
