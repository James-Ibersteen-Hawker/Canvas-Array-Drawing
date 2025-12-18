"use strict";
let spriteToTest;
class Game {
  LUT_SRC;
  CANVAS;
  constructor(LUT_SRC, CANVAS, SPRITEJSON) {
    const outSelf = this;
    this.COLORTREE;
    this.SPRITEJSON = SPRITEJSON;
    this.sprites = [];
    this.alpha = [];
    this.alphaColor = null;
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
        this.GET = (y, x) => this[outSelf.xy2x(x, y, w)];
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
        return queue;
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
            ) || [null, [0, 0]];
            const [childAnchorX, childAnchorY] = [e.x, e.y];
            let resultArr = e.queue(
              parentAnchorX + xOffset - childAnchorX,
              parentAnchorY + yOffset - childAnchorY
            );
            resultArr = resultArr.flat(Infinity);
            returnArr.push(...resultArr);
            returnArr.push(
              new outSelf.PartQueueContainer(
                parentAnchorX + xOffset - e.x,
                parentAnchorY + yOffset - e.y,
                e.z,
                e
              )
            );
          });
        }
        return returnArr;
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
    };
    this.CW = this.CANVAS.clientWidth;
    this.CH = this.CANVAS.clientHeight;
    this.DisplayScreen = {
      width: outSelf.CW,
      height: outSelf.CH,
      chunksX: 0,
      chunksY: 0,
      chunkW: 16,
      chunkH: 16,
      output: new Uint8Array(outSelf.CW * outSelf.CH).fill(),
      comparison: new Uint8Array(outSelf.CW * outSelf.CH).fill(),
      chunks: [],
      noWriteIndex: new Uint8Array(outSelf.CW * outSelf.CH).fill(0),
      imgData: null,
      imgBuffer: null,
      overlay(pxlArr, arrW, arrX, arrY) {
        const W = this.width;
        const nonprint = outSelf.alphaColor;
        let X = arrX - 1;
        let Y = arrY - 1;
        for (let i = 0; i < pxlArr.length; i++) {
          X++;
          if (X === arrX + arrW) (X = arrX), Y++;
          if (pxlArr[i] === nonprint) continue; //no use printing alpha onto alpha
          const index = Y * W + X;
          if (this.output[index] !== nonprint) continue; //printable spot
          if (this.noWriteIndex[index] === 1) continue;
          const input = pxlArr[i];
          const comparison = this.comparison[index];
          const colorOutput = input === comparison ? nonprint : input;
          if (colorOutput === nonprint) this.noWriteIndex[index] = 1;
          this.comparison[index] = input;
          this.output[index] = colorOutput;
        }
      },
      render() {
        for (let i = 0; i < this.output.length; i++) {
          const X = i % this.width;
          const Y = Math.floor(i / this.width);
          if (this.output[i] === outSelf.alphaColor) continue;
          const color = outSelf.LUT[this.output[i]];
          const index = i * 4;
          this.output[i] = outSelf.alphaColor;
        }
        this.noWriteIndex.fill(0);
      },
      init() {
        const { chunkW, chunkH, width, height, output, comparison } = this;
        [output, comparison].forEach((e) => e.fill(outSelf.alphaColor));
        this.imgData = outSelf.CTX.createImageData(this.width, this.height);
        this.imgBuffer = this.imgData.data;
        this.chunksX = Math.ceil(width / chunkW);
        this.chunksY = Math.ceil(height / chunkH);
        for (let y = 0; y < this.chunksY; y++) {
          for (let x = 0; x < this.chunksX; x++) {
            const [startX, startY] = [chunkW * x, chunkH * y];
            const w = Math.min(chunkW, width - startX);
            const h = Math.min(chunkH, height - startY);
            const chunk = new outSelf.Chunk(startX, startY, w, h);
            this.chunks.push(chunk);
          }
        }
      },
    };
    this.Chunk = class {
      constructor(startX, startY, w, h) {
        this.startX = startX;
        this.startY = startY;
        this.w = w;
        this.h = h;
        this.dirty = false;
        this.range = this.init();
      }
      init() {
        const { startX: x, startY: y, w, h } = this;
        return {
          tL: [x, y],
          tR: [x + w, y],
          bL: [x, y + h],
          bR: [x + w, y + h],
        };
      }
    };
    this.init(LUT_SRC);
  }
  async init(LUT) {
    this.config = await (await fetch(this.SPRITEJSON)).json();
    this.alpha = this.config.alpha;
    await this.LUT_init(LUT);
    const { RGBto24bit: toNum } = this;
    this.alphaColor = this.LUT.findIndex((e) => toNum(e) === toNum(this.alpha));
    this.CTX.imageSmoothingEnabled = false;
    this.COLORTREE = new this.Octree(this.LUT);
    this.DisplayScreen.init();
    this.SpritesInit();
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
      const a = data[i + 3];
      const color = data.slice(i, i + 4);
      let result =
        a === 255
          ? context.RGBto24bit(context.COLORTREE.search(color))
          : context.RGBto24bit(context.alpha);
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
    spriteToTest.partsRef.get("shell").set("idle");
    spriteToTest.partsRef.get("rightArm").set("punch");
    spriteToTest.partsRef.get("body").set("idle");
    spriteToTest.partsRef.get("rightLeg").set("idle");
    spriteToTest.partsRef.get("leftLeg").set("idle");
    spriteToTest.partsRef.get("head").set("idle");
    spriteToTest.partsRef.get("leftArm").currentCostume.next();
    spriteToTest.partsRef.get("rightArm").currentCostume.next();
    spriteToTest.partsRef.get("body").currentCostume.next();
    spriteToTest.partsRef.get("rightLeg").currentCostume.next();
    spriteToTest.partsRef.get("leftLeg").currentCostume.next();
    spriteToTest.partsRef.get("head").currentCostume.next();
    spriteToTest.partsRef.get("shell").currentCostume.next();
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
      try {
        const spriteOutput = spriteToTest.render().reverse();
        spriteOutput.forEach((e) => {
          const part = e.part;
          const { pxls, w } =
            part.currentCostume.frames[part.currentCostume.index];
          self.DisplayScreen.overlay(pxls, w, e.xOffset, e.yOffset);
        });
        self.DisplayScreen.overlay(new Uint8Array(50 * 50).fill(212), 50, 8, 0);
        //pretty pink @ 213
        self.DisplayScreen.render();
      } catch (error) {
        alert(error);
      }
    });
  }
  findAnchor(colors, arr, w, h) {
    if (h === null) return [result, [0, 0]];
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
  async render() {}
  xy2x(x, y, w) {
    return y * w + x;
  }
}
