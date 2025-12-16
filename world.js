import * as THREE from 'three';
import { Environment } from './Environment.js';

export class World {
  constructor({ clearColor = 0x000000, enableShadows = true, environmentMaps = null } = {}) {
    this.clock = new THREE.Clock();
    this.scene = new THREE.Scene();
    this.scene.background = environmentMaps || new THREE.Color(clearColor);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = enableShadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 3, 6);

    this.environment = new Environment({ enableShadows });
    this.scene.add(this.environment.lights);

    // simple update subscription
    this._updateHandlers = [];
  }

  onUpdate(handler) {
    this._updateHandlers.push(handler);
  }

  start() {
    const loop = () => {
      const dt = Math.min(0.033, this.clock.getDelta()); // clamp to ~30 fps for physics stability
      for (const h of this._updateHandlers) h(dt);
      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(loop);
    };
    loop();
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
