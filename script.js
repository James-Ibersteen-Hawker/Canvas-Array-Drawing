"use strict";
class Game {
  LUT_SRC;
  CANVAS;
  constructor(LUT_SRC, CANVAS) {
    const outSelf = this;
    this.COLORTREE;
    this.sprites = [];
    this.alpha = [];
    this.config = null;
    (this.LUT = []), (this.LUT_LUT = []);
    (this.CANVAS = CANVAS), (this.CTX = this.CANVAS.getContext("2d"));
    this.Octree = class {
      constructor(dataset) {
        const self = this;
        this.DATA = dataset;
        this.LeafThreshold = 4;
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
        this.Node = class {
          constructor() {
            this.SUB = null;
            this.xRange = [Infinity, -Infinity];
            this.yRange = [Infinity, -Infinity];
            this.zRange = [Infinity, -Infinity];
            this.CLOUD = [];
          }
          divide() {
            let [mX, mxX] = this.xRange;
            let [mY, mxY] = this.yRange;
            let [mZ, mxZ] = this.zRange;
            this.CLOUD.forEach(([x, y, z]) => {
              (mX = Math.min(mX, x)), (mxX = Math.max(mxX, x));
              (mY = Math.min(mY, y)), (mxY = Math.max(mxY, y));
              (mZ = Math.min(mZ, z)), (mxZ = Math.max(mxZ, z));
            });
            this.xRange = [mX, mxX];
            this.yRange = [mY, mxY];
            this.zRange = [mZ, mxZ];
            if (this.CLOUD.length < self.LeafThreshold) return false;
            this.SUB = self.make(this.CLOUD, [
              ...this.xRange,
              ...this.yRange,
              ...this.zRange,
            ]);
          }
        };
        this.SUB = this.make(this.DATA);
      }
      make(set, [xR1, xR2, yR1, yR2, zR1, zR2] = new Array(6).fill(undefined)) {
        let [mX, mY, mZ] = set[0];
        let [mxX, mxY, mxZ] = set[0];
        if ([xR1, xR2, yR1, yR2, zR1, zR2].every((e) => e !== undefined)) {
          [mX, mxX, mY, mxY, mxZ, mxZ] = [xR1, xR2, yR1, yR2, zR1, zR2];
        } else {
          for (const [x, y, z] of set) {
            (mX = Math.min(mX, x)), (mxX = Math.max(mxX, x));
            (mY = Math.min(mY, y)), (mxY = Math.max(mxY, y));
            (mZ = Math.min(mZ, z)), (mxZ = Math.max(mxZ, z));
          }
        }
        const dX = (mxX + mX) / 2;
        const dY = (mxY + mY) / 2;
        const dZ = (mxZ + mZ) / 2;
        const Nodes = new Array(8).fill(null).map(() => new this.Node());
        set.forEach(([x, y, z]) => {
          const index = (x > dX ? 1 : 0) | (y > dY ? 2 : 0) | (z > dZ ? 4 : 0);
          Nodes[index].CLOUD.push([x, y, z]);
        });
        return Nodes.filter((Node) => {
          if (Node.CLOUD.length > 0) {
            Node.divide();
            return true;
          } else return false;
        });
      }
      search(point, set = this) {
        let [x, y, z] = point;
        const clamp = (v, min, max) => ((v > min ? v : min) < max ? v : max);
        x = clamp(x, set.xRange[0], set.xRange[1]);
        y = clamp(y, set.yRange[0], set.yRange[1]);
        z = clamp(z, set.zRange[0], set.zRange[1]);
        let closeX = Infinity;
        let closeY = Infinity;
        let closeZ = Infinity;
        let includes = null;
        if (set.SUB) {
          for (let i = 0; i < set.SUB.length; i++) {
            const xR = set.SUB[i].xRange;
            const yR = set.SUB[i].yRange;
            const zR = set.SUB[i].zRange;
            if (
              x >= xR[0] &&
              x <= xR[1] &&
              y >= yR[0] &&
              y <= yR[1] &&
              z >= zR[0] &&
              z <= zR[1]
            ) {
              includes = set.SUB[i];
              break;
            } else {
              const xD = (xR[0] + xR[1]) / 2 - x;
              const yD = (yR[0] + yR[1]) / 2 - y;
              const zD = (zR[0] + zR[1]) / 2 - z;
              if (xD < closeX && yD < closeY && zD < closeZ) {
                closeX = xD;
                closeY = yD;
                closeZ = zD;
                includes = set.SUB[i];
              }
            }
          }
        }
        if (!includes) includes = this.PREVIOUS || set.SUB[1];
        this.PREVIOUS = includes;
        if (!includes.SUB) return this.closest([x, y, z], includes.CLOUD);
        else return this.search([x, y, z], includes);
      }
      closest(point, set) {
        this.PREVIOUS = undefined;
        let match = set[0];
        let matchDist = Infinity;
        const compare = outSelf.RGBto24bit(point);
        for (let i = 0; i < set.length; i++) {
          const x = set[i][0],
            y = set[i][1],
            z = set[i][2];
          if (outSelf.RGBto24bit(set[i]) === compare) return point;
          else {
            const distance =
              (x - point[0]) ** 2 + (y - point[1]) ** 2 + (z - point[2]) ** 2;
            if (distance < matchDist) {
              matchDist = distance;
              match = set[i];
            }
          }
        }
        return match;
      }
    };
    //this.Quadtree
    this.Uint8 = class extends Uint8Array {
      constructor(arg, w) {
        super(arg);
        this.GET = (y, x) => this[y * w + x];
      }
    };
    this.Sprite = class {
      constructor(x, y, name, sub) {
        this.x = x;
        this.y = y;
        this.name = name;
        this.sub = sub;
        this.parts = [];
      }
    }; //parent, knows x,y, holds a list of currently requested costumes
    this.Part = class {
      constructor(x, y, name, home, sub) {
        this.x = x;
        this.y = y;
        this.name = name;
        this.sub = sub;
        this.home = home;
        this.costumes = [];
      }
    }; //knows x,y, holds a constantly updating anchor reference??
    this.Costume = class {
      constructor(name, count) {
        this.name = name;
        this.count = count;
        this.frames = [];
        this.index = 0;
        this.current = null;
      }
      next() {
        this.current = this.frames[this.index];
        this.index > this.frames.length - 1 ? (this.index = 0) : this.index++;
        const homeAnchor = this.current.home;
      }
    }; //intermediary, knows the current frame, can change frames, and sends anchor reference updates
    this.Frame = class {
      constructor(pxls, anchors, w, home) {
        this.pxls = pxls;
        this.anchors = anchors;
        this.w = w;
        this.home = home;
      }
    };
    this.init(LUT_SRC);
  }
  async init(LUT) {
    this.config = await (await fetch("/Sprites/sprites.json")).text();
    this.config = JSON.parse(this.config);
    this.alpha = this.config.alpha;
    await this.LUT_init(LUT);
    this.CTX.imageSmoothingEnabled = false;
    this.COLORTREE = new this.Octree(this.LUT);
    // await this.SpritesInit();
    console.time();
    await this.SpritesInit();
  }
  async LUT_init(LUT) {
    const text = await (await fetch(LUT)).text();
    const list = text.replace(/\r?\n/g, "//").split("//");
    this.LUT = Array.from({ length: list.length }, (_, i) =>
      list[i].split(" ").map((e) => Number(e))
    );
    this.LUT_LUT = new Map(
      Array.from(this.LUT, (e, i) => [this.RGBto24bit(e), i])
    );
  }
  async imgCorrect(imgsrc) {
    const image = new Image();
    image.src = imgsrc;
    await image.decode();
    const { width: w, height: h } = image;
    const output = new this.Uint8(w * h, w);
    this.CTX.drawImage(image, 0, 0, w, h);
    const data = this.CTX.getImageData(0, 0, w, h).data;
    for (let i = 0, incr = 0; i < data.length; i += 4, incr++) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      let a = data[i + 3];
      const color = [r, g, b];
      let result;
      if (a === 255) result = this.RGBto24bit(this.COLORTREE.search(color));
      else result = this.RGBto24bit(this.alpha);
      const finalColor = this.LUT_LUT.get(result);
      output[incr] = finalColor;
    }
    this.CTX.clearRect(0, 0, w, h);
    return [output, w, h];
  }
  async SpritesInit() {
    const [self, config] = [this, this.config];
    const count = 6;
    const timeOut = 100;
    const Batch = {
      queue: [],
      send() {
        const temp = [...this.queue];
        this.queue = [];
        temp.forEach(async (e) => e());
        clearTimeout(this.timer);
      },
      queueIn(v) {
        this.queue.push(v);
        if (this.queue.length >= count) this.send();
        clearTimeout(this.timer);
        this.timer = setTimeout(this.send(), timeOut);
      },
    };
    class Request {
      constructor(path, anchors, home) {
        this.path = path;
        this.anchors = anchors;
        this.home = home;
      }
      async run() {
        const inself = this;
        return new Promise(async (resolve, reject) => {
          Batch.queueIn(async function () {
            const [result, w] = await self.imgCorrect(inself.path);
            const output = self.findAnchor(
              inself.anchors,
              result,
              w,
              inself.home
            );
            if (output.length > 0)
              resolve(new self.Frame(result, output, w, output.home));
            else
              reject(
                `${inself.path} is missing an anchor of anchors ${inself.anchors}`
              );
          });
        });
      }
    }
    await Promise.all(
      config.sprites.map(async ({ name, tree, parts }) => {
        await Promise.all(
          parts.map(async ({ name: part, home, sub, costumes }) => {
            await Promise.all(
              costumes.map(async ({ name: costume, count, anchors }) => {
                const frames = Array.from(
                  { length: count },
                  (_, i) => `/Sprites/${name}/${part}/${costume}${i}.png`
                );
                await Promise.all(
                  frames.map(async (frame) => {
                    const result = await new Request(
                      frame,
                      anchors,
                      home
                    ).run();
                  })
                );
              })
            );
          })
        );
      })
    );
    console.timeEnd();
  }
  // async SpritesInit() {
  //   const [self, config] = [this, this.config];
  //   await Promise.all(
  //     config.sprites.map(async ({ name, tree, parts }) => {
  //       const Sprite = new self.Sprite(0, 0, name, tree);
  //       for (const { name: partName, home, costumes } of parts) {
  //         const Part = new this.Part(0, 0, partName, home);
  //         for (const { name: costumeName, count, anchors } of costumes) {
  //           const Costume = new this.Costume(costumeName);
  //           Costume.frames = await Promise.all(
  //             Array.from(
  //               { length: count },
  //               (_, i) => `Sprites/${name}/${partName}/${costumeName}${i}.png`
  //             ).map(async (path) => {
  //               const [result, w] = await self.imgCorrect(path);
  //               const anchorResults = self.findAnchor(anchors, result, w, home);
  //               if (anchorResults.length > 0)
  //                 return new self.Frame(result, anchorResults, w);
  //               throw new Error(
  //                 `${path} is missing an anchor of anchors ${anchors}`
  //               );
  //             })
  //           );
  //           Part.costumes.push(Costume);
  //         }
  //         Sprite.parts.push(Part);
  //       }
  //       console.log(Sprite);
  //       this.sprites.push(Sprite);
  //     })
  //   );
  //   console.timeEnd();
  // }
  findAnchor(colors, arr, w, h) {
    const result = [];
    const self = this;
    const anchors = new Set(
      colors.map((color) => self.RGBto24bit(self.COLORTREE.search(color)))
    );
    const home = self.RGBto24bit(self.COLORTREE.search(h));
    for (let i = 0; i < arr.length; i++) {
      const color = this.RGBto24bit(this.LUT[arr[i]]);
      if (!anchors.has(color)) continue;
      const x = i % w;
      const y = Math.floor(i / w);
      result.push([this.LUT[arr[i]], [x, y]]);
      if (home === color) result.home = [x, y];
    }
    return result;
  }
  RGBto24bit([r, g, b]) {
    return (r << 16) | (g << 8) | b;
  }
}
