const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
// const screen = new Array(canvas.offsetHeight)
//   .fill(null)
//   .map(() => new Array(canvas.offsetHeight).fill(0xffff00));
// function HEX() {}
// function RENDER() {
//   screen.forEach((e, i) =>
//     e.forEach((a, q) => {
//       ctx.fillStyle = `#${a.toString(16).padStart(6, 0)}`;
//       ctx.fillRect(q, i, 1, 1);
//       ctx.stroke();
//     })
//   );
// }

// RENDER();

function INIT(w, h) {
  class Uint8 extends Uint8Array {
    constructor(arg) {
      super(arg);
      this.GET = (y, x) => this[y * h + x];
    }
  }
  const SCREEN = new Uint8(w * h).fill(0).map((_, i) => 0 + i);
  console.log(SCREEN);
  console.log(SCREEN.GET(25, 25));
}

INIT(50, 50);
