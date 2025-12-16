import * as THREE from 'three';
import { clamp, lerp } from '../utils/MathUtils.js';

export class CarPhysics {
  constructor() {
    // Tunable parameters
    this.maxSpeed = 22;           // m/s (~80 km/h)
    this.accel = 12;              // m/s^2
    this.brakeDecel = 18;         // m/s^2
    this.drag = 0.8;              // aerodynamic drag factor
    this.rollingResistance = 0.5; // baseline friction
    this.turnRate = 1.6;          // rad/s at full steer
    this.turnFalloffSpeed = 18;   // speed where steering begins to reduce
    this.steeringSmoothing = 0.15;

    this.velocity = new THREE.Vector3(); // world-frame velocity
    this.heading = 0; // yaw angle
    this.angularVel = 0;
    this._steer = 0;  // -1..1
  }

  update(dt, input, carPosition, carQuaternion, colliders) {
    // Steering smoothing
    const targetSteer = clamp(input.steerRight - input.steerLeft, -1, 1);
    this._steer = lerp(this._steer, targetSteer, 1.0 - Math.pow(1.0 - this.steeringSmoothing, dt * 60));

    // Forward direction from quaternion (car heading)
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(carQuaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(carQuaternion);

    // Longitudinal forces
    let accel = input.throttle * this.accel - input.brake * this.brakeDecel;
    accel -= this.rollingResistance;
    accel -= this.drag * this.velocity.length();

    // Update speed along forward
    const speedForward = this.velocity.dot(forward);
    let newSpeedForward = speedForward + accel * dt;
    newSpeedForward = clamp(newSpeedForward, -this.maxSpeed * 0.35, this.maxSpeed);

    // Steering reduced at high speed
    const steerStrength = clamp(1 - (Math.abs(newSpeedForward) / this.turnFalloffSpeed), 0.25, 1);
    const yawRate = this._steer * this.turnRate * steerStrength;

    // Drift-lite: lateral friction increases with brake
    const lateral = this.velocity.dot(right);
    const lateralFriction = lerp(5.0, 12.0, input.brake); // basic drift control
    const newLateral = lateral - lateralFriction * lateral * dt;

    // Recompose velocity
    this.velocity.copy(forward).multiplyScalar(newSpeedForward).add(right.clone().multiplyScalar(newLateral));

    // Integrate position
    const deltaPos = this.velocity.clone().multiplyScalar(dt);
    const nextPos = carPosition.clone().add(deltaPos);

    // Simple collision against colliders using bounding boxes
    let collided = false;
    for (const obj of colliders) {
      const bbox = new THREE.Box3().setFromObject(obj);
      const carBox = new THREE.Box3().setFromCenterAndSize(
        nextPos.clone().add(new THREE.Vector3(0, 0.5, 0)),
        new THREE.Vector3(1.5, 1.2, 3.2)
      );
      if (bbox.intersectsBox(carBox)) {
        collided = true;
        break;
      }
    }

    if (!collided) {
      carPosition.copy(nextPos);
    } else {
      // Collision response: damp velocity and slight push back
      this.velocity.multiplyScalar(0.25);
    }

    // Integrate heading
    this.heading += yawRate * dt;
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.heading);
    carQuaternion.copy(q);
  }
}
