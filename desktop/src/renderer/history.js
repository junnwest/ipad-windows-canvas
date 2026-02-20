// Action types: 'add_stroke', 'erase_stroke', 'clear'
// Each action: { type, stroke?, strokeId? }

class ActionHistory {
  constructor() {
    this.actions = [];
    this.pointer = -1; // index of last applied action
  }

  push(action) {
    // Truncate any redo stack beyond current pointer
    this.actions.length = this.pointer + 1;
    this.actions.push(action);
    this.pointer++;
  }

  undo() {
    if (!this.canUndo()) return null;
    const action = this.actions[this.pointer];
    this.pointer--;
    return action;
  }

  redo() {
    if (!this.canRedo()) return null;
    this.pointer++;
    return this.actions[this.pointer];
  }

  canUndo() {
    return this.pointer >= 0;
  }

  canRedo() {
    return this.pointer < this.actions.length - 1;
  }

  // Rebuild active strokes by replaying actions from 0 to pointer
  getActiveStrokes() {
    const strokes = new Map();
    for (let i = 0; i <= this.pointer; i++) {
      const action = this.actions[i];
      switch (action.type) {
        case 'add_stroke':
          strokes.set(action.stroke.id, action.stroke);
          break;
        case 'erase_stroke':
          strokes.delete(action.strokeId);
          break;
        case 'clear':
          strokes.clear();
          break;
      }
    }
    return strokes;
  }

  reset() {
    this.actions = [];
    this.pointer = -1;
  }
}
