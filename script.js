"use strict";
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
class Uint8 extends Uint8Array {
  constructor(arg) {
    super(arg);
    this.GET = (y, x) => this[y * h + x];
  }
}
function INIT(w, h) {
  const SCREEN = new Uint8(w * h).fill(0);
  console.log(SCREEN);
}
INIT(50, 50);

class Game {
  LUT_SRC;
  constructor(LUT_SRC) {
    this.LUT = [];
    this.init(LUT_SRC);
  }
  init(LUT) {
    this.LUT_init(LUT);
  }
  async LUT_init(LUT) {
    const text = await (await fetch(LUT)).text();
    const list = text.replace(/\r?\n/g, "//").split("//");
    this.LUT = Array.from({ length: list.length }, (_, i) =>
      list[i].split(" ")
    );
    this.octree(this.LUT);
  }
  octree(coords) {
    class Octree {
      constructor(dataset) {
        this.max = dataset;
        this.DATA = dataset;
        this.TREE = null;
      }
      make(dataset) {
        log(dataset);
        let [mX, mY, mZ] = dataset[0];
        let [mxX, mxY, mxZ] = dataset[0];
        dataset.forEach(([x, y, z]) => {
          // alert(`${x}, ${y}, ${z}`);
          if (x < mX) mX = x;
          else if (x > mxX) mxX = x;
          if (y < mY) mY = y;
          else if (y > mxY) mxY = y;
          if (z < mZ) mZ = z;
          else if (z > mxZ) mxZ = z;
        });
        log(
          `mX,mY,mZ: ${mX}, ${mY}, ${mZ}, mxX,mxY,mxZ: ${mxX}, ${mxY}, ${mxZ}`
        );
      }
    }
    new Octree(coords).make(coords);
  }
}

let myGame = new Game("/Xterm.txt");
function log(arg) {
  document.getElementById("temp-display").textContent = arg;
}
