export class Input {
  constructor() {
    this.keys = new Set();
    this.cameraDistanceToggle = false;

    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (e.code === 'KeyC') {
        this.cameraDistanceToggle = !this.cameraDistanceToggle;
      }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
  }

  get throttle() {
    return (this.keys.has('KeyW') || this.keys.has('ArrowUp')) ? 1 : 0;
  }
  get brake() {
    return (this.keys.has('Space') || this.keys.has('KeyS') || this.keys.has('ArrowDown')) ? 1 : 0;
  }
  get steerLeft() {
    return (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) ? 1 : 0;
  }
  get steerRight() {
    return (this.keys.has('KeyD') || this.keys.has('ArrowRight')) ? 1 : 0;
  }
}
