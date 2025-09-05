"use strict";
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
function INIT(w, h) {
  class Uint8 extends Uint8Array {
    constructor(arg) {
      super(arg);
      this.GET = (y, x) => this[y * h + x];
    }
  }
  const SCREEN = new Uint8(w * h).fill(0);
}
INIT(50, 50);

