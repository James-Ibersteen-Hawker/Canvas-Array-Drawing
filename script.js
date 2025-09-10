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
      list[i].split(" ").map((e) => Number(e))
    );
    this.octree(this.LUT);
  }
  octree(coords) {
    class Octree {
      constructor(dataset) {
        this.max = dataset.length;
        this.DATA = dataset;
        this.TREE = this.make(this.DATA);
      }
      make(dataset) {
        if (!dataset || dataset.length <= 0 || !Array.isArray(dataset)) return;
        const self = this;
        let [mX, mY, mZ] = dataset[0];
        let [mxX, mxY, mxZ] = dataset[0];
        dataset.forEach(([x, y, z]) => {
          if (x < mX) mX = x;
          else if (x > mxX) mxX = x;
          if (y < mY) mY = y;
          else if (y > mxY) mxY = y;
          if (z < mZ) mZ = z;
          else if (z > mxZ) mxZ = z;
        });
        const dX = (mxX - mX) / 2 + mX;
        const dY = (mxY - mY) / 2 + mY;
        const dZ = (mxZ - mZ) / 2 + mZ;
        class Node {
          constructor(xInit, xFinal, yInit, yFinal, zInit, zFinal) {
            this.CLOUD = [];
            this.SUB = null;
            this.xRange = [xInit, xFinal];
            this.yRange = [yInit, yFinal];
            this.zRange = [zInit, zFinal];
            this.threshold = 4;
          }
          divide() {
            try {
              if (this.CLOUD.length <= this.threshold) return;
              else this.SUB = self.make(this.CLOUD);
            } catch (error) {
              alert(error);
            }
          }
        }
        const Super = {
          mX,
          mY,
          mZ,
          mxX,
          mxY,
          mxZ,
          dX,
          dY,
          dZ,
          Nodes: [
            new Node(mX, dX, mY, dY, mZ, dZ),
            new Node(dX + 0.001, mxX, mY, dY, mZ, dZ),
            new Node(mX, dX, dY + 0.001, mxY, mZ, dZ),
            new Node(dX + 0.001, mxX, dY + 0.001, mxY, mZ, dZ),
            new Node(mX, dX, mY, dY, dZ + 0.001, mxZ),
            new Node(mX, dX, dY + 0.001, mxY, dZ + 0.001, mxZ),
            new Node(dX + 0.001, mxX, mY, dY, dZ + 0.001, mxZ),
            new Node(dX + 0.001, mxX, dY + 0.001, mxY, dZ + 0.001, mxZ),
          ],
        };
        for (let i = 0; i < dataset.length; i++) {
          Nodeloop: for (let q = 0; q < Super.Nodes.length; q++) {
            const { xRange, yRange, zRange } = Super.Nodes[q];
            const [x, y, z] = dataset[i];
            if (
              x >= xRange[0] &&
              x <= xRange[1] &&
              y >= yRange[0] &&
              y <= yRange[1] &&
              z >= zRange[0] &&
              z <= zRange[1]
            ) {
              Super.Nodes[q].CLOUD.push(dataset[i]);
              break Nodeloop;
            }
          }
        }
        for (let i = 0; i < Super.Nodes.length; i++) {
          const node = Super.Nodes[i];
          if (node.CLOUD.length <= 0) continue;
          node.divide();
        }
        console.log(Super);
        return Super;
      }
    }
    new Octree(coords);
  }
}

let myGame = new Game("/Xterm.txt");
function log(arg) {
  document.getElementById("temp-display").textContent = arg;
}
