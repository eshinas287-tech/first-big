import { World } from './world/World.js';
import { UI } from './ui/UI.js';
import { AssetLoader } from './loaders/AssetLoader.js';
import { Car } from './entities/Car.js';
import { FollowCamera } from './camera/FollowCamera.js';
import { Input } from './input/Input.js';

let world, ui, car, cameraRig, input, loader;
let started = false;

async function init() {
  loader = new AssetLoader();
  await loader.preload(); // skybox, textures, sounds

  world = new World({
    clearColor: 0x87b8ff,
    enableShadows: true,
    environmentMaps: loader.skyboxTexture
  });

  ui = new UI();
  input = new Input();

  car = new Car(loader);
  await car.loadModel('/src/assets/models/car.glb'); // requires separate wheel meshes
  car.setPosition(0, 0.15, 0);

  world.scene.add(car.group);

  const { track, colliders } = world.environment.build();
  world.scene.add(track);
  colliders.forEach(c => world.scene.add(c));

  cameraRig = new FollowCamera(world.camera, car.group, {
    distance: 6,
    height: 2.2,
    stiffness: 0.08,
    lookStiffness: 0.15
  });

  // UI hooks
  ui.onStart(() => { started = true; });
  ui.onReset(() => { resetGame(); });

  // Resize
  window.addEventListener('resize', () => world.onResize());

  // Game loop
  world.onUpdate((dt) => {
    // Update input and physics if started
    if (started) {
      car.update(dt, input, world.environment.colliders);
      cameraRig.update(dt);
      ui.update({
        speedKmh: Math.max(0, car.state.speed * 3.6),
        lap: world.environment.laps.computeLap(car.group.position),
        distance: Math.floor(world.environment.laps.totalDistance)
      });
    } else {
      cameraRig.idle(dt);
    }

    // Optional day/night cycle (bonus)
    world.environment.updateTimeOfDay(dt);
  });

  world.start();
}

function resetGame() {
  started = false;
  car.reset({ position: { x: 0, y: 0.15, z: 0 }, heading: 0 });
  cameraRig.snap();
  ui.reset();
}

init();
