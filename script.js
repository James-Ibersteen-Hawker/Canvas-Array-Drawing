class Game {
  LUT_SRC;
  CANVAS;
  constructor(LUT_SRC, CANVAS) {
    const outSelf = this;
    this.COLORTREE;
    this.sprites = [];
    this.alpha = [];
    this.config = null;
    this.LUT = [];
    this.LUT_LUT = new Map();
    (this.CANVAS = CANVAS), (this.CTX = this.CANVAS.getContext("2d"));
    this.Octree = class {
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
        if (set.some(([x, y, z]) => x === iX && y === iY && z === iZ))
          return point;
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
    this.Quadtree = class {
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
    this.Uint8 = class extends Uint8Array {
      constructor(arg, w) {
        super(arg);
        this.GET = (y, x) => this[y * w + x];
      }
    };
    this.Sprite = class {
      constructor(name, x, y) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.costumes = {};
      }
    };
    this.Frame = class {
      constructor(pxls, anchors, w) {
        this.pxls = pxls;
        this.anchors = anchors;
        this.w = w;
        this.init();
      }
      init() {}
      render(ix = 0, iy = 0) {
        this.pxls.forEach((e, i) => {
          if (outSelf.LUT[e].join("-") !== outSelf.alpha.join("-")) {
            const x = (i % this.w) + ix;
            const y = Math.floor(i / this.w) + iy;
            outSelf.CTX.fillStyle = `rgb(${outSelf.LUT[e].join(",")})`;
            outSelf.CTX.fillRect(x, y, 1, 1);
          }
        });
      }
    };
    this.Costume = class {
      constructor(name) {
        this.name = name;
        this.frames = [];
      }
      next() {}
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
  }
  async imgCorrect(imgsrc) {
    const image = new Image();
    image.src = imgsrc;
    await new Promise((resolve) => (image.onload = resolve));
    const w = image.width;
    const h = image.height;
    const output = new this.Uint8(w * h, w);
    const input = new Uint32Array(w * h);
    this.CTX.drawImage(image, 0, 0, w, h);
    const data = this.CTX.getImageData(0, 0, w, h).data;
    const alphaIndexes = new Set();
    for (let i = 0, incr = 0; i < data.length; i += 4, incr++) {
      let r = Number(data[i]);
      let g = Number(data[i + 1]);
      let b = Number(data[i + 2]);
      if (Number(data[i + 3]) < 255) alphaIndexes.add(incr);
      const color = ((r << 16) | (g << 8) | b) >>> 0;
      input[incr] = color;
    }
    input.forEach((rgbNum, i) => {
      if (!alphaIndexes.has(i)) {
        const x = (rgbNum >> 16) & 0xff;
        const y = (rgbNum >> 8) & 0xff;
        const z = rgbNum & 0xff;
        const result = this.COLORTREE.search([x, y, z]);
        const color = this.LUT.findIndex(
          (e) => e[0] === result[0] && e[1] === result[1] && e[2] === result[2]
        );
        output[i] = color;
      } else {
        const result = this.alpha;
        const color = this.LUT.findIndex(
          (e) => e[0] === result[0] && e[1] === result[1] && e[2] === result[2]
        );
        output[i] = color;
      }
    });
    this.CTX.clearRect(0, 0, w, h);
    return [output, w, h];
  }
  async SpritesInit() {
    const [self, config] = [this, this.config];
    await Promise.all(
      config.sprites.map(async ({ name, tree, parts }) => {
        const Sprite = new self.Sprite(name, 0, 0);
        for (const { name: partName, sub, costumes } of parts) {
          Sprite.costumes[partName] = {};
          for (const { name: costumeName, count: c, anchors: a } of costumes) {
            Sprite.costumes[partName][costumeName] = new self.Costume(
              costumeName
            );
            const frames = Array.from(
              { length: c },
              (_, i) => `Sprites/${name}/${partName}/${costumeName}${i}.png`
            );
            const fixedFrames = await Promise.all(
              frames.map(async (e) => {
                const [result, w] = await self.imgCorrect(e);
                const output = self.findAnchor(a, result, w);
                if (output.length === 0)
                  throw new Error(`${e} is missing an anchor of anchors ${a}`);
                return new self.Frame(result, output, w);
              })
            );
            Sprite.costumes[partName][costumeName].frames = fixedFrames;
          }
        }
        this.sprites.push(Sprite);
      })
    );
    try {
      this.sprites[0].costumes.leftArm.punch.frames[0].render();
    } catch (error) {
      alert(error);
    }
  }
  findAnchor(colors, arr, w) {
    const result = [];
    const self = this;
    const anchors = new Set(
      colors.map((color) => self.RGBto24bit(self.COLORTREE.search(color)))
    );
    for (let i = 0; i < arr.length; i++) {
      const color = this.RGBto24bit(this.LUT[arr[i]]);
      if (!anchors.has(color)) continue;
      const x = i % w;
      const y = Math.floor(i / w);
      result.push([arr[i], [x, y].join("-")]);
    }
    return result;
  }
  RGBto24bit([r, g, b]) {
    return (r << 16) | (g << 8) | b;
  }
}
