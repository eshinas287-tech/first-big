import * as THREE from 'three';

export class AssetLoader {
  constructor() {
    this.manager = new THREE.LoadingManager();
    this.audioListener = new THREE.AudioListener();
    this.skyboxTexture = null;
  }

  async preload() {
    // Skybox (CubeTexture)
    const loader = new THREE.CubeTextureLoader(this.manager);
    this.skyboxTexture = loader.load([
      '/src/assets/textures/skybox/px.jpg',
      '/src/assets/textures/skybox/nx.jpg',
      '/src/assets/textures/skybox/py.jpg',
      '/src/assets/textures/skybox/ny.jpg',
      '/src/assets/textures/skybox/pz.jpg',
      '/src/assets/textures/skybox/nz.jpg',
    ]);
  }

  async loadAudio(path, { loop = true, volume = 0.5 } = {}) {
    try {
      const audio = new THREE.Audio(this.audioListener);
      const loader = new THREE.AudioLoader(this.manager);
      const buffer = await loader.loadAsync(path);
      audio.setBuffer(buffer);
      audio.setLoop(loop);
      audio.setVolume(volume);
      return audio;
    } catch {
      return null;
    }
  }
}
