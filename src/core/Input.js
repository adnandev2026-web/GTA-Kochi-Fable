// Keyboard + mouse (pointer lock) + mobile touch joystick & laptop trackpad input.

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pressed = new Set();
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.wheel = 0;
    this.locked = false;
    this.enabled = true;
    this.deviceMode = 'desktop';
    this.allowPointerLock = true;
    this.sensitivity = 0.0023;
    this.lastMouseMove = 0;

    // Virtual mobile controls
    this.virtualMoveX = 0;
    this.virtualMoveY = 0;
    this.virtualSprint = false;
    this._touchLookId = null;
    this._touchLastX = 0;
    this._touchLastY = 0;

    this._onKeyDown = (e) => {
      if (e.repeat || !this.enabled) return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const block = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'F1'];
      if (block.includes(e.code)) e.preventDefault();
      this.keys.add(e.code);
      this.pressed.add(e.code);
    };
    this._onKeyUp = (e) => {
      this.keys.delete(e.code);
    };
    this._onBlur = () => this.keys.clear();
    this._onPointerLock = () => {
      this.locked = document.pointerLockElement === this.canvas;
    };
    this._onMouseMove = (e) => {
      if (!this.enabled) return;
      if (!this.locked && !this.dragging) return;
      this.mouseDX += e.movementX || 0;
      this.mouseDY += e.movementY || 0;
      this.lastMouseMove = performance.now();
    };
    this._onMouseDown = (e) => {
      if (!this.enabled) return;
      if (e.button === 0 && this.allowPointerLock) this.requestLock();
      this.dragging = true;
    };
    this._onMouseUp = () => {
      this.dragging = false;
    };
    this._onWheel = (e) => {
      this.wheel += Math.sign(e.deltaY);
      e.preventDefault();
    };
    this._onContextMenu = (e) => e.preventDefault();

    // Touch look directly on canvas for Mobile / Touch Laptop
    this._onTouchStart = (e) => {
      if (!this.enabled) return;
      for (const t of e.changedTouches) {
        if (this._touchLookId === null && t.clientX > window.innerWidth * 0.35) {
          this._touchLookId = t.identifier;
          this._touchLastX = t.clientX;
          this._touchLastY = t.clientY;
        }
      }
    };
    this._onTouchMove = (e) => {
      if (!this.enabled || this._touchLookId === null) return;
      for (const t of e.changedTouches) {
        if (t.identifier === this._touchLookId) {
          const dx = t.clientX - this._touchLastX;
          const dy = t.clientY - this._touchLastY;
          this._touchLastX = t.clientX;
          this._touchLastY = t.clientY;
          this.mouseDX += dx * 1.8;
          this.mouseDY += dy * 1.4;
          this.lastMouseMove = performance.now();
        }
      }
    };
    this._onTouchEnd = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === this._touchLookId) this._touchLookId = null;
      }
    };

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('blur', this._onBlur);
    document.addEventListener('pointerlockchange', this._onPointerLock);
    document.addEventListener('mousemove', this._onMouseMove);
    canvas.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mouseup', this._onMouseUp);
    canvas.addEventListener('wheel', this._onWheel, { passive: false });
    canvas.addEventListener('contextmenu', this._onContextMenu);
    canvas.addEventListener('touchstart', this._onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', this._onTouchMove, { passive: true });
    canvas.addEventListener('touchend', this._onTouchEnd, { passive: true });
  }

  setDeviceMode(mode) {
    this.deviceMode = mode || 'desktop';
    if (this.deviceMode === 'mobile') {
      this.allowPointerLock = false;
      this.sensitivity = 0.0036;
      this.exitLock();
    } else if (this.deviceMode === 'laptop') {
      this.allowPointerLock = true;
      this.sensitivity = 0.0033;
    } else {
      this.allowPointerLock = true;
      this.sensitivity = 0.0023;
    }
  }

  setVirtualAxes(mx, my, sprint = false) {
    this.virtualMoveX = mx;
    this.virtualMoveY = my;
    this.virtualSprint = sprint;
  }

  triggerKey(code, isDown = true) {
    if (isDown) {
      this.keys.add(code);
      this.pressed.add(code);
    } else {
      this.keys.delete(code);
    }
  }

  requestLock() {
    if (this.locked || !this.enabled || !this.allowPointerLock) return;
    try {
      const p = this.canvas.requestPointerLock?.();
      if (p && p.catch) p.catch(() => {});
    } catch {
      /* pointer lock is optional */
    }
  }

  exitLock() {
    if (document.pointerLockElement) document.exitPointerLock();
  }

  down(code) {
    return this.keys.has(code);
  }

  hit(code) {
    return this.pressed.has(code);
  }

  get moveX() {
    const k = (this.down('KeyD') || this.down('ArrowRight') ? 1 : 0) - (this.down('KeyA') || this.down('ArrowLeft') ? 1 : 0);
    return Math.abs(this.virtualMoveX) > 0.05 ? this.virtualMoveX : k;
  }

  get moveY() {
    const k = (this.down('KeyW') || this.down('ArrowUp') ? 1 : 0) - (this.down('KeyS') || this.down('ArrowDown') ? 1 : 0);
    return Math.abs(this.virtualMoveY) > 0.05 ? this.virtualMoveY : k;
  }

  get sprint() {
    return this.virtualSprint || this.down('ShiftLeft') || this.down('ShiftRight');
  }

  endFrame() {
    this.pressed.clear();
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.wheel = 0;
  }

  dispose() {
    this.exitLock();
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('blur', this._onBlur);
    document.removeEventListener('pointerlockchange', this._onPointerLock);
    document.removeEventListener('mousemove', this._onMouseMove);
    this.canvas.removeEventListener('mousedown', this._onMouseDown);
    window.removeEventListener('mouseup', this._onMouseUp);
    this.canvas.removeEventListener('wheel', this._onWheel);
    this.canvas.removeEventListener('contextmenu', this._onContextMenu);
    this.canvas.removeEventListener('touchstart', this._onTouchStart);
    this.canvas.removeEventListener('touchmove', this._onTouchMove);
    this.canvas.removeEventListener('touchend', this._onTouchEnd);
  }
}
