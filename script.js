"use strict";
class Game {
  LUT_SRC;
  CANVAS;
  constructor(LUT_SRC, CANVAS) {
    this.LUT = [];
    this.COLORTREE;
    this.CANVAS = CANVAS;
    this.CTX = this.CANVAS.getContext("2d");
    this.Octree = class Octree {
      constructor(dataset) {
        this.DATA = dataset;
        this.LeafThreshold = 4;
        this.TREE = this.make(this.DATA);
        this.PREVIOUS = undefined;
        this.xRange = [Infinity, -Infinity];
        this.yRange = [Infinity, -Infinity];
        this.zRange = [Infinity, -Infinity];
        this.DATA.forEach(([x, y, z]) => {
          this.xRange[0] = Math.min(this.xRange[0], x);
          this.xRange[1] = Math.max(this.xRange[1], x);
          this.yRange[0] = Math.min(this.yRange[0], y);
          this.yRange[1] = Math.max(this.yRange[1], y);
          this.zRange[0] = Math.min(this.zRange[0], z);
          this.zRange[1] = Math.max(this.zRange[1], z);
        });
      }
      make(set, [xR1, xR2, yR1, yR2, zR1, zR2] = new Array(6).fill(undefined)) {
        const self = this;
        let [mX, mY, mZ, mxX, mxY, mxZ] = [...set[0], ...set[0]];
        if ([xR1, xR2, yR1, yR2, zR1, zR2].every((e) => e !== undefined)) {
          [mX, mxX, mY, mxY, mxZ, mxZ] = [xR1, xR2, yR1, yR2, zR1, zR2];
        } else {
          set.forEach(([x, y, z]) => {
            (mX = Math.min(mX, x)), (mxX = Math.max(mxX, x));
            (mY = Math.min(mY, y)), (mxY = Math.max(mxY, y));
            (mZ = Math.min(mZ, z)), (mxZ = Math.max(mxZ, z));
          });
        }
        const dX = (mxX - mX) / 2 + mX;
        const dY = (mxY - mY) / 2 + mY;
        const dZ = (mxZ - mZ) / 2 + mZ;
        class Node {
          constructor() {
            const inSelf = this;
            this.SUB = null;
            this.xRange = [Infinity, -Infinity];
            this.yRange = [Infinity, -Infinity];
            this.zRange = [Infinity, -Infinity];
            this.CLOUD = new Proxy([], {
              get(target, property) {
                if (property === "push") {
                  return function (...args) {
                    if (args.every((e) => e.length === 3)) {
                      let [mX, mxX] = inSelf.xRange;
                      let [mY, mxY] = inSelf.yRange;
                      let [mZ, mxZ] = inSelf.zRange;
                      args.forEach(([x, y, z]) => {
                        (mX = Math.min(mX, x)), (mxX = Math.max(mxX, x));
                        (mY = Math.min(mY, y)), (mxY = Math.max(mxY, y));
                        (mZ = Math.min(mZ, z)), (mxZ = Math.max(mxZ, z));
                      });
                      inSelf.xRange = [mX, mxX];
                      inSelf.yRange = [mY, mxY];
                      inSelf.zRange = [mZ, mxZ];
                    }
                    return Array.prototype.push.apply(target, args);
                  };
                } else return Reflect.get(target, property);
              },
            });
          }
          divide() {
            if (this.CLOUD.length < self.LeafThreshold) return false;
            this.SUB = self.make(this.CLOUD, [
              ...this.xRange,
              ...this.yRange,
              ...this.zRange,
            ]);
          }
        }
        let Nodes = new Array(8).fill(null).map(() => new Node());
        set.forEach(([x, y, z]) => {
          const index = (x > dX ? 1 : 0) | (y > dY ? 2 : 0) | (z > dZ ? 4 : 0);
          Nodes[index].CLOUD.push([x, y, z]);
        });
        Nodes = Nodes.filter((Node) => {
          if (Node.CLOUD.length > 0) {
            Node.divide();
            return true;
          } else return false;
        });
        return Nodes;
      }
      search(point, set = this.TREE) {
        let [x, y, z] = point;
        x = Math.max(this.xRange[0], Math.min(this.xRange[1], x));
        y = Math.max(this.yRange[0], Math.min(this.yRange[1], y));
        z = Math.max(this.zRange[0], Math.min(this.zRange[1], z));
        for (let i = 0; i < set.length; i++) {
          const { xRange, yRange, zRange } = set[i];
          if (
            x >= xRange[0] &&
            x <= xRange[1] &&
            y >= yRange[0] &&
            y <= yRange[1] &&
            z >= zRange[0] &&
            z <= zRange[1]
          ) {
            if (!set[i].SUB) return this.closest([x, y, z], set[i].CLOUD);
            else if (set[i].SUB) {
              this.PREVIOUS = set[i];
              return this.search([x, y, z], set[i].SUB);
            }
          } else if (this.PREVIOUS)
            return this.closest([x, y, z], this.PREVIOUS.CLOUD);
        }
        const { xRange, yRange, zRange } = set[0];
        x = Math.max(xRange[0], Math.min(xRange[1], x));
        y = Math.max(yRange[0], Math.min(yRange[1], y));
        z = Math.max(zRange[0], Math.min(zRange[1], z));
        if (!set[0].SUB) return this.closest([x, y, z], set[0].CLOUD);
        else return this.search([x, y, z], set[0].SUB);
      }
      closest(point, set) {
        this.PREVIOUS = undefined;
        let match = set[0];
        let matchDist = null;
        const [iX, iY, iZ] = point;
        set.forEach(([x, y, z]) => {
          const distance = Math.sqrt(
            Math.pow(x - iX, 2) + Math.pow(y - iY, 2) + Math.pow(z - iZ, 2)
          );
          if (!matchDist) matchDist = distance;
          else if (distance < matchDist) {
            matchDist = distance;
            match = [x, y, z];
          }
        });
        return match;
      }
    };
    this.Quadtree = class Quadtree {
      constructor(dataset) {
        this.DATA = dataset;
        this.LeafThreshold = 4;
        this.TREE = this.make(this.DATA);
        this.PREVIOUS = null;
        this.xRange = [Infinity, -Infinity];
        this.yRange = [Infinity, -Infinity];
        this.DATA.forEach(([x, y]) => {
          this.xRange[0] = Math.min(this.xRange[0], x);
          this.xRange[1] = Math.max(this.xRange[1], x);
          this.yRange[0] = Math.min(this.yRange[0], y);
          this.yRange[1] = Math.max(this.yRange[1], y);
        });
      }
      make(set, [xR1, xR2, yR1, yR2] = new Array(4).fill(undefined)) {
        const self = this;
        let [mX, mY, mxX, mxY] = [...set[0], ...set[0]];
        if ([xR1, xR2, yR1, yR2].every((e) => e !== undefined)) {
          [mX, mxX, mY, mxY] = [xR1, xR2, yR1, yR2];
        } else {
          set.forEach(([x, y]) => {
            (mX = Math.min(mX, x)), (mxX = Math.max(mxX, x));
            (mY = Math.min(mY, y)), (mxY = Math.max(mxY, y));
          });
        }
        const dX = (mxX - mX) / 2 + mX;
        const dY = (mxY - mY) / 2 + mY;
        class Node {
          constructor() {
            const inSelf = this;
            this.SUB = null;
            this.xRange = [Infinity, -Infinity];
            this.yRange = [Infinity, -Infinity];
            this.CLOUD = new Proxy([], {
              get(target, property) {
                if (property === "push") {
                  return function (...args) {
                    if (args.every((e) => e.length === 2)) {
                      let [mX, mxX] = inSelf.xRange;
                      let [mY, mxY] = inSelf.yRange;
                      args.forEach(([x, y]) => {
                        (mX = Math.min(mX, x)), (mxX = Math.max(mxX, x));
                        (mY = Math.min(mY, y)), (mxY = Math.max(mxY, y));
                      });
                      inSelf.xRange = [mX, mxX];
                      inSelf.yRange = [mY, mxY];
                    }
                    return Array.prototype.push.apply(target, args);
                  };
                } else return Reflect.get(target, property);
              },
            });
          }
          divide() {
            if (this.CLOUD.length < self.LeafThreshold) return false;
            this.SUB = self.make(this.CLOUD, [...this.xRange, ...this.yRange]);
          }
        }
        let Nodes = new Array(4).fill(null).map(() => new Node());
        set.forEach(([x, y]) => {
          const index = (x > dX ? 1 : 0) | (y > dY ? 2 : 0);
          Nodes[index].CLOUD.push([x, y]);
        });
        Nodes = Nodes.filter((Node) => {
          if (Node.CLOUD.length > 0) {
            Node.divide();
            return true;
          } else return false;
        });
        return Nodes;
      }
      search(point, set = this.TREE) {
        let [x, y] = point;
        x = Math.max(this.xRange[0], Math.min(this.xRange[1], x));
        y = Math.max(this.yRange[0], Math.min(this.yRange[1], y));
        for (let i = 0; i < set.length; i++) {
          const { xRange, yRange } = set[i];
          if (
            x >= xRange[0] &&
            x <= xRange[1] &&
            y >= yRange[0] &&
            y <= yRange[1]
          ) {
            if (!set[i].SUB) return this.closest([x, y], set[i].CLOUD);
            else if (set[i].SUB) {
              this.PREVIOUS = set[i];
              return this.search([x, y], set[i].SUB);
            }
          } else if (this.PREVIOUS)
            return this.closest([x, y], this.PREVIOUS.CLOUD);
        }
        const { xRange, yRange } = set[0];
        x = Math.max(xRange[0], Math.min(xRange[1], x));
        y = Math.max(yRange[0], Math.min(yRange[1], y));
        if (!set[0].SUB) return this.closest([x, y], set[0].CLOUD);
        else return this.search([x, y], set[0].SUB);
      }
      closest(point, set) {
        this.PREVIOUS = undefined;
        let match = set[0];
        let matchDist = null;
        const [iX, iY] = point;
        set.forEach(([x, y]) => {
          const distance = Math.sqrt(Math.pow(x - iX, 2) + Math.pow(y - iY, 2));
          if (!matchDist) matchDist = distance;
          else if (distance < matchDist) {
            matchDist = distance;
            match = [x, y];
          }
        });
        return match;
      }
    };
    this.Uint8 = class Uint8 extends Uint8Array {
      constructor(arg) {
        super(arg);
        this.GET = (y, x) => this[y * h + x];
      }
    };
    this.init(LUT_SRC);
  }
  async init(LUT) {
    await this.LUT_init(LUT);
    this.COLORTREE = new this.Octree(this.LUT);
    log(this.COLORTREE.search([50, 30, 10]));
  }
  async LUT_init(LUT) {
    const text = await (await fetch(LUT)).text();
    const list = text.replace(/\r?\n/g, "//").split("//");
    this.LUT = Array.from({ length: list.length }, (_, i) =>
      list[i].split(" ").map((e) => Number(e))
    );
  }
}

let myGame = new Game("/Xterm.txt", document.getElementById("canvas"));
function log(arg) {
  document.getElementById("temp-display").textContent = arg;
}
