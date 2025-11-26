"use strict";
let spriteToTest;
class Game {
  LUT_SRC;
  CANVAS;
  constructor(LUT_SRC, CANVAS) {
    const outSelf = this;
    this.COLORTREE;
    this.sprites = [];
    this.alpha = [];
    this.alphaKey;
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
          [mX, mxX, mY, mxY, mZ, mxZ] = [xR1, xR2, yR1, yR2, zR1, zR2];
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
        let bestDist = Infinity;
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
              const xD = (xR[0] + xR[1]) / 2;
              const yD = (yR[0] + yR[1]) / 2;
              const zD = (zR[0] + zR[1]) / 2;
              const testDist = (xD - x) ** 2 + (yD - y) ** 2 + (zD - z) ** 2;
              if (testDist < bestDist) {
                bestDist = testDist;
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
        this.tree = sub;
        this.parts = [];
        this.partsRef = null;
        this.topPart = null;
      }
      init() {
        this.partsRef = new Map(this.parts.map((e) => [e.name, e]));
        this.initParts(this.tree);
      }
      initParts(part = this.tree) {
        const { name, sub, z } = part;
        let count = 0;
        const here = this.partsRef.get(name);
        here.z = z;
        for (const sPart of sub) {
          if (!sPart.sub) {
            count++;
            continue;
          }
          here.under.push(this.partsRef.get(sPart.name));
          this.initParts(sPart);
        }
        if (count === sub.length) return;
      }
      render() {
        const self = this;
        self.topPart = self.partsRef.get(self.tree.name);
        const queue = [
          new outSelf.PartQueueContainer(
            self.x,
            self.y,
            self.topPart.z,
            self.topPart
          ),
        ];
        queue.push(...self.topPart.queue(self.x, self.y).flat(Infinity));
        queue.sort((a, b) => a.z - b.z);
        queue.forEach((e) => e.render());
      }
    };
    this.Part = class {
      constructor(x, y, name, home) {
        (this.x = x), (this.y = y);
        (this.z = null), (this.w = null);
        (this.name = name), (this.home = home);
        (this.under = []), (this.costumes = []);
        (this.anchors = null), (this.pxls = null);
        (this.currentCostume = null), (this.costumeRef = null);
      }
      init() {
        this.costumeRef = new Map(this.costumes.map((e) => [e.name, e]));
      }
      set(name) {
        this.currentCostume = this.costumeRef.get(name);
      }
      queue(xOffset = 0, yOffset = 0) {
        const returnArr = [];
        if (this.under.length > 0) {
          this.under.forEach((e) => {
            const [_, [parentAnchorX, parentAnchorY]] = this.anchors.find(
              ([color]) =>
                outSelf.RGBto24bit(e.home) === outSelf.RGBto24bit(color)
            ) || [null, [0, 0]]; //find the correct anchor on the PARENT to anchor the CHILD
            const [childAnchorX, childAnchorY] = [e.x, e.y];
            let resultArr = e.queue(
              parentAnchorX + xOffset - childAnchorX,
              parentAnchorY + yOffset - childAnchorY
            );
            resultArr = resultArr.flat(Infinity);
            returnArr.push(...resultArr);
            returnArr.push(
              new outSelf.PartQueueContainer(
                parentAnchorX + xOffset,
                parentAnchorY + yOffset,
                e.z,
                e
              )
            );
          });
        }
        return returnArr;
      }
      render(xOffset, yOffset) {
        for (let i = 0; i < this.pxls.length; i++) {
          const x = (i % this.w) + xOffset - this.x;
          const y = Math.floor(i / this.w) + yOffset - this.y;
          if (
            outSelf.RGBto24bit(outSelf.LUT[this.pxls[i]]) !==
            outSelf.RGBto24bit(outSelf.alpha)
          ) {
            outSelf.CTX.fillStyle = `rgb(${outSelf.LUT[this.pxls[i]].join(
              ","
            )})`;
            outSelf.CTX.fillRect(x, y, 1, 1);
          }
        }
      }
    };
    this.Costume = class {
      constructor(name, count, parent) {
        this.name = name;
        this.count = count;
        this.frames = [];
        this.index = 0;
        this.current = null;
        this.parent = parent;
      }
      next() {
        this.current = this.frames[this.index];
        this.index = (this.index + 1) % this.frames.length;
        let homeAnchor = this.current.home;
        if (homeAnchor === null) homeAnchor = new Array(2).fill(0);
        this.parent.x = homeAnchor[0];
        this.parent.y = homeAnchor[1];
        this.parent.pxls = this.current.pxls;
        this.parent.w = this.current.w;
        this.parent.anchors = this.current.anchors;
      }
    };
    this.Frame = class {
      constructor(pxls, anchors, w, home) {
        this.pxls = pxls;
        this.anchors = anchors;
        this.w = w;
        this.home = home;
      }
    };
    this.PartQueueContainer = class {
      constructor(xOffset, yOffset, z, part) {
        this.xOffset = xOffset;
        this.yOffset = yOffset;
        this.z = z;
        this.part = part;
      }
      render() {
        this.part.render(this.xOffset, this.yOffset);
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
  async imgCorrect(context, imgsrc) {
    const image = new Image();
    image.src = imgsrc;
    await image.decode();
    const { width: w, height: h } = image;
    const canvas = new OffscreenCanvas(w, h);
    const inCTX = canvas.getContext("2d");
    const output = new context.Uint8(w * h, w);
    inCTX.drawImage(image, 0, 0, w, h);
    const data = inCTX.getImageData(0, 0, w, h).data;
    inCTX.clearRect(0, 0, w, h);
    for (let i = 0, incr = 0; i < data.length; i += 4, incr++) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      let a = data[i + 3];
      const color = [r, g, b];
      let result;
      if (a === 255)
        result = context.RGBto24bit(context.COLORTREE.search(color));
      else result = context.RGBto24bit(context.alpha);
      const finalColor = context.LUT_LUT.get(result);
      output[incr] = finalColor;
    }
    return [output, w, h];
  }
  async SpritesInit() {
    const [self, config] = [this, this.config];
    const count = 6;
    const timeOut = 50;
    const Batch = {
      queue: [],
      async send() {
        const temp = [...this.queue];
        this.queue = [];
        clearTimeout(this.timer);
        await Promise.all(temp.map((e) => e()));
      },
      queueIn(v) {
        this.queue.push(v);
        if (this.queue.length >= count) this.send();
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.send(), timeOut);
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
            const [result, w] = await self.imgCorrect(self, inself.path);
            const [output, home] = self.findAnchor(
              inself.anchors,
              result,
              w,
              inself.home
            );
            if (output.length > 0)
              resolve(new self.Frame(result, output, w, home));
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
        const Sprite = new self.Sprite(20, 20, name, tree);
        await Promise.all(
          parts.map(async ({ name: part, home, costumes }) => {
            const Part = new self.Part(0, 0, part, home);
            await Promise.all(
              costumes.map(async ({ name: costume, count, anchors }) => {
                const Costume = new self.Costume(costume, count, Part);
                Part.costumes.push(Costume);
                const frames = Array.from(
                  { length: count },
                  (_, i) => `Sprites/${name}/${part}/${costume}${i}.png`
                );
                const fixed = await Promise.all(
                  frames.map(async (frame, i) => {
                    try {
                      const result = await new Request(
                        frame,
                        anchors,
                        home
                      ).run();
                      return { r: result, num: i };
                    } catch (error) {
                      throw new Error(error);
                    }
                  })
                );
                fixed.sort((a, b) => a.num - b.num);
                Costume.frames.push(...fixed.map((e) => e.r));
              })
            );
            Part.init();
            Sprite.parts.push(Part);
          })
        );
        Sprite.init();
        self.sprites.push(Sprite);
      })
    );
    spriteToTest = self.sprites[0];

    spriteToTest.partsRef.get("leftArm").set("punch");
    spriteToTest.partsRef.get("rightArm").set("punch");
    spriteToTest.partsRef.get("body").set("neutral");
    spriteToTest.partsRef.get("legs").set("idle");
    spriteToTest.partsRef.get("head").set("idle");
    spriteToTest.partsRef.get("leftArm").currentCostume.next();
    spriteToTest.partsRef.get("rightArm").currentCostume.next();
    spriteToTest.partsRef.get("body").currentCostume.next();
    spriteToTest.partsRef.get("legs").currentCostume.next();
    spriteToTest.partsRef.get("head").currentCostume.next();
    spriteToTest.render();
    console.log(spriteToTest);
    window.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "ArrowUp":
          spriteToTest.y--;
          break;
        case "ArrowLeft":
          spriteToTest.x--;
          break;
        case "ArrowDown":
          spriteToTest.y++;
          break;
        case "ArrowRight":
          spriteToTest.x++;
          break;
      }
      spriteToTest.parts.forEach((e) => e.currentCostume.next());
      this.CTX.clearRect(0, 0, 500, 500);
      spriteToTest.render();
    });
  }
  findAnchor(colors, arr, w, h) {
    const result = [];
    let homeFound = null;
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
      if (home === color) homeFound = [x, y];
    }
    return [result, homeFound];
  }
  RGBto24bit([r, g, b]) {
    return (r << 16) | (g << 8) | b;
  }
  async play() {}
}
