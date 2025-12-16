import * as THREE from 'three';

export class Environment {
  constructor({ enableShadows }) {
    this.enableShadows = enableShadows;

    // Lights & sky
    const ambient = new THREE.AmbientLight(0xffffff, 0.45);
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(30, 40, 10);
    sun.castShadow = enableShadows;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -50;
    sun.shadow.camera.right = 50;
    sun.shadow.camera.top = 50;
    sun.shadow.camera.bottom = -50;
    this.lights = new THREE.Group();
    this.lights.add(ambient);
    this.lights.add(sun);
    this.sun = sun;

    // Track & terrain data
    this.colliders = [];
    this.laps = new LapSystem();
    this._time = 12; // 0..24 hours
  }

  build() {
    const group = new THREE.Group();

    // Ground plane
    const groundTex = new THREE.TextureLoader().load('/src/assets/textures/asphalt.jpg');
    groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping;
    groundTex.repeat.set(100, 100);
    const groundMat = new THREE.MeshStandardMaterial({ map: groundTex });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    group.add(ground);

    // Track (simple spline-based road)
    const road = buildRoadMesh();
    road.castShadow = true; road.receiveShadow = true;
    group.add(road);

    // Simple city blocks (boxes used as obstacles/colliders)
    const obstacles = buildObstacles();
    obstacles.forEach(o => {
      o.castShadow = true; o.receiveShadow = true;
      group.add(o);
      this.colliders.push(o);
    });

    // Lap path (same as road spline central path)
    this.laps.setPath(road.userData.pathPoints);

    return { track: group, colliders: obstacles };
  }

  updateTimeOfDay(dt) {
    // Optional day/night: slow cycle
    this._time += dt * 0.1; if (this._time >= 24) this._time = 0;
    const t = this._time / 24;
    const intensity = 0.4 + 0.6 * Math.max(0, Math.sin(t * Math.PI * 2));
    this.sun.intensity = intensity;
    const color = new THREE.Color().setHSL(0.6, 0.5, 0.5 + 0.2 * intensity);
    this.sun.color.copy(color);
  }
}

function buildRoadMesh() {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-40, 0, -40),
    new THREE.Vector3(0, 0, -30),
    new THREE.Vector3(30, 0, -10),
    new THREE.Vector3(40, 0, 20),
    new THREE.Vector3(0, 0, 40),
    new THREE.Vector3(-30, 0, 20),
    new THREE.Vector3(-40, 0, -10),
    new THREE.Vector3(-40, 0, -40),
  ], true, 'centripetal');

  const segments = 400;
  const width = 6;
  const points = curve.getPoints(segments);
  const geom = new THREE.BufferGeometry();
  const positions = [];
  const uvs = [];
  const normals = [];
  const indices = [];

  // Build a flat ribbon (road) along the curve
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const next = points[(i + 1) % points.length];
    const dir = new THREE.Vector3().subVectors(next, p).normalize();
    const left = new THREE.Vector3(-dir.z, 0, dir.x).normalize(); // perpendicular on XZ
    const pL = new THREE.Vector3().copy(p).addScaledVector(left, width * 0.5);
    const pR = new THREE.Vector3().copy(p).addScaledVector(left, -width * 0.5);
    positions.push(pL.x, pL.y + 0.01, pL.z, pR.x, pR.y + 0.01, pR.z);
    uvs.push(0, i * 0.1, 1, i * 0.1);
    normals.push(0, 1, 0, 0, 1, 0);
    if (i < points.length - 1) {
      const idx = i * 2;
      indices.push(idx, idx + 1, idx + 2, idx + 1, idx + 3, idx + 2);
    }
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geom.setIndex(indices);
  geom.computeBoundingSphere();

  const tex = new THREE.TextureLoader().load('/src/assets/textures/asphalt.jpg');
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, points.length * 0.05);
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, metalness: 0.0 });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.rotation.x = 0;
  mesh.userData.pathPoints = points;
  return mesh;
}

function buildObstacles() {
  const obstacles = [];
  const boxGeo = new THREE.BoxGeometry(4, 5, 4);
  const mat = new THREE.MeshStandardMaterial({ color: 0x555a66, roughness: 0.8 });

  const positions = [
    [8, 0, -18], [14, 0, 10], [-12, 0, 18], [-20, 0, -8], [25, 0, -2]
  ];

  positions.forEach(([x, y, z]) => {
    const m = new THREE.Mesh(boxGeo, mat);
    m.position.set(x, 2.5, z);
    m.castShadow = true; m.receiveShadow = true;
    m.userData.collider = true;
    obstacles.push(m);
  });

  return obstacles;
}

class LapSystem {
  constructor() {
    this.pathPoints = [];
    this.totalDistance = 0;
    this._lastPos = new THREE.Vector3();
    this._lapCount = 0;
  }

  setPath(points) {
    this.pathPoints = points;
  }

  computeLap(carPos) {
    // Very simple lap: count when crossing near first point direction
    if (this.pathPoints.length < 4) return this._lapCount;
    const start = this.pathPoints[0];
    const dist = carPos.distanceTo(start);
    this.totalDistance += carPos.distanceTo(this._lastPos);
    this._lastPos.copy(carPos);
    if (dist < 4) this._lapCount = Math.min(99, this._lapCount + 1);
    return this._lapCount;
  }
}
