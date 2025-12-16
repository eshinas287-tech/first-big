import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CarPhysics } from '../physics/CarPhysics.js';

export class Car {
  constructor(loader) {
    this.loader = loader;
    this.group = new THREE.Group();
    this.group.castShadow = true;
    this.group.receiveShadow = true;

    this.body = null;
    this.wheels = { fl: null, fr: null, rl: null, rr: null };

    this.physics = new CarPhysics();

    this.state = {
      speed: 0,           // m/s
      heading: 0,         // radians
      wheelRotation: 0,   // for visual spin
    };

    // Sound (optional)
    this.engineAudio = null;
    this.brakeAudio = null;
  }

  async loadModel(path) {
    const gltf = await new GLTFLoader().loadAsync(path);
    const car = gltf.scene;
    car.traverse(o => {
      o.castShadow = true;
      o.receiveShadow = true;
      if (o.name.toLowerCase().includes('body')) this.body = o;
      if (o.name.toLowerCase().includes('wheel_fl')) this.wheels.fl = o;
      if (o.name.toLowerCase().includes('wheel_fr')) this.wheels.fr = o;
      if (o.name.toLowerCase().includes('wheel_rl')) this.wheels.rl = o;
      if (o.name.toLowerCase().includes('wheel_rr')) this.wheels.rr = o;
    });

    if (!this.body) this.body = car;
    this.group.add(car);

    // optional sounds
    this.engineAudio = await this.loader.loadAudio('/src/assets/sounds/engine_loop.mp3', { loop: true, volume: 0.4 });
    this.brakeAudio = await this.loader.loadAudio('/src/assets/sounds/brake.mp3', { loop: false, volume: 0.6 });
    if (this.engineAudio) this.group.add(this.engineAudio);
    if (this.brakeAudio) this.group.add(this.brakeAudio);
    this.engineAudio?.play();
  }

  setPosition(x, y, z) {
    this.group.position.set(x, y, z);
  }

  reset({ position = { x: 0, y: 0, z: 0 }, heading = 0 } = {}) {
    this.group.position.set(position.x, position.y, position.z);
    this.physics.velocity.set(0, 0, 0);
    this.physics.heading = heading;
    this.group.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), heading);
    this.state.speed = 0;
    this.state.wheelRotation = 0;
  }

  update(dt, input, colliders) {
    const pos = this.group.position.clone();
    const q = this.group.quaternion.clone();
    this.physics.update(dt, input, pos, q, colliders);
    this.group.position.copy(pos);
    this.group.quaternion.copy(q);

    // Update visual wheel spin based on forward speed
    const wheelRadius = 0.32; // meters
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.group.quaternion);
    const speedForward = this.physics.velocity.dot(forward);
    this.state.speed = this.physics.velocity.length();
    this.state.wheelRotation += (speedForward / wheelRadius) * dt;

    // Apply to wheel meshes (if found)
    const rot = this.state.wheelRotation;
    const steerAngle = this.physics._steer * Math.PI * 0.15;
    for (const key of ['fl', 'fr', 'rl', 'rr']) {
      const w = this.wheels[key];
      if (!w) continue;
      // spin around local X
      w.rotation.x = rot;
      // front wheels steer around Y
      if (key === 'fl' || key === 'fr') w.rotation.y = steerAngle;
    }

    // Brake sound trigger
    if (input.brake && this.brakeAudio && !this.brakeAudio.isPlaying) {
      this.brakeAudio.play();
    }

    // Slight body roll / pitch for immersion
    const roll = THREE.MathUtils.clamp(-this.physics._steer * 0.04 * (this.state.speed / 10), -0.06, 0.06);
    const pitch = THREE.MathUtils.clamp((input.throttle - input.brake) * 0.03, -0.05, 0.05);
    const euler = new THREE.Euler(pitch, 0, roll);
    const qRollPitch = new THREE.Quaternion().setFromEuler(euler);
    this.body && this.body.quaternion.copy(q).multiply(qRollPitch);
  }
}
