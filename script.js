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
    class OCTREE {
      constructor(level, dataset) {
        this.range_x = coords.length;
        this.range_y = coords.length;
        this.range_z = coords.length;
        this.level = level;
        this.dataset = dataset;
      }
      make() {
        //HOW??? I need to talk to Papa about JS and in theory
      }
      search(point) {
        //return closest match
      }
    }
    //level 0
    //how to make subranges without explicitly spelling it out???
    //256 / 8 => 32, 32 / 8 => 4, only 4 distances
  }
}

let myGame = new Game("/Xterm.txt");
function log(arg) {
  document.getElementById("temp-display").textContent = arg;
}
