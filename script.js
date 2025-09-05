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
    const converter = (n) => {
      n = n.split(" ");
      return (n[0] << 16) | (n[1] << 8) | n[2];
    };
    this.LUT = new Array(list.length)
      .fill(null)
      .map((_, i) => converter(list[i]));
    document.getElementById("temp-display").textContent = this.LUT;
  }
}

let myGame = new Game("/Xterm.txt");
