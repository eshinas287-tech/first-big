export class UI {
  constructor() {
    this.speedEl = document.getElementById('speed');
    this.lapEl = document.getElementById('lap');
    this.distanceEl = document.getElementById('distance');
    this.startBtn = document.getElementById('startBtn');
    this.resetBtn = document.getElementById('resetBtn');

    this._onStart = () => {};
    this._onReset = () => {};

    this.startBtn.addEventListener('click', () => this._onStart());
    this.resetBtn.addEventListener('click', () => this._onReset());
  }

  onStart(handler) { this._onStart = handler; }
  onReset(handler) { this._onReset = handler; }

  update({ speedKmh, lap, distance }) {
    this.speedEl.textContent = speedKmh.toFixed(0);
    this.lapEl.textContent = lap;
    this.distanceEl.textContent = distance;
  }

  reset() {
    this.update({ speedKmh: 0, lap: 0, distance: 0 });
  }
}
