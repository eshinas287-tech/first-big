import * as THREE from 'three';

export class FollowCamera {
  constructor(camera, target, { distance = 6, height = 2, stiffness = 0.08, lookStiffness = 0.15 } = {}) {
    this.camera = camera;
    this.target = target;
    this.cfg = { distance, height, stiffness, lookStiffness };
    this._desiredPos = new THREE.Vector3();
    this._smoothedPos = new THREE.Vector3().copy(camera.position);
    this._lookAt = new THREE.Vector3();
  }

  update(dt) {
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.target.quaternion);
    const desired = new THREE.Vector3().copy(this.target.position)
      .addScaledVector(forward, -this.cfg.distance)
      .add(new THREE.Vector3(0, this.cfg.height, 0));

    // Smoothly interpolate
    this._smoothedPos.lerp(desired, 1.0 - Math.pow(1.0 - this.cfg.stiffness, dt * 60));
    this.camera.position.copy(this._smoothedPos);

    // Look smoothing
    this._lookAt.lerp(this.target.position, 1.0 - Math.pow(1.0 - this.cfg.lookStiffness, dt * 60));
    this.camera.lookAt(this._lookAt);
  }

  idle(dt) {
    // Gentle float when not started
    this._smoothedPos.y += Math.sin(performance.now() * 0.001) * 0.001;
    this.camera.position.copy(this._smoothedPos);
  }

  snap() {
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.target.quaternion);
    this._desiredPos.copy(this.target.position)
      .addScaledVector(forward, -this.cfg.distance)
      .add(new THREE.Vector3(0, this.cfg.height, 0));
    this._smoothedPos.copy(this._desiredPos);
    this.camera.position.copy(this._smoothedPos);
    this.camera.lookAt(this.target.position);
  }
}
