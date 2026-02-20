class ToolState {
  constructor() {
    this.currentTool = 'pen';     // 'pen' | 'eraser'
    this.currentColor = '#000000';
    this.currentSize = 2;         // brush width in CSS px
    this.onChange = null;          // callback for UI updates

    this.colors = [
      '#000000', '#e53935', '#1e88e5', '#43a047',
      '#fb8c00', '#8e24aa', '#757575',
    ];
    this.sizes = [1, 2, 4, 8];
  }

  setTool(tool) {
    this.currentTool = tool;
    this._notify();
  }

  setColor(color) {
    this.currentColor = color;
    if (this.currentTool === 'eraser') {
      this.currentTool = 'pen';
    }
    this._notify();
  }

  setSize(size) {
    this.currentSize = size;
    this._notify();
  }

  _notify() {
    if (this.onChange) this.onChange();
  }
}
