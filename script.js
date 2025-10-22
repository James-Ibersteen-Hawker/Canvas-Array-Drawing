class Game {
  LUT_SRC;
  CANVAS;
  constructor(LUT_SRC, CANVAS) {
    const outSelf = this;
    this.COLORTREE;
    this.sprites = [];
    this.alpha = [];
    this.config = null;
    (this.LUT = []), (this.LUT_LUT = new Map());
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
        this.TREE = this.make(this.DATA);
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
      search(point, set = this.TREE) {
        let [x, y, z] = point;
        const clamp = (v, min, max) => ((v > min ? v : min) < max ? v : max);
        x = clamp(x, this.xRange[0], this.xRange[1]);
        y = clamp(y, this.yRange[0], this.yRange[1]);
        z = clamp(z, this.zRange[0], this.zRange[1]);
        let includes = null;
        for (let i = 0; i < set.length; i++) {
          const xR = set[i].xRange;
          const yR = set[i].yRange;
          const zR = set[i].zRange;
          if (
            x >= xR[0] &&
            x <= xR[1] &&
            y >= yR[0] &&
            y <= yR[1] &&
            z >= zR[0] &&
            z <= zR[1]
          ) {
            includes = set[i];
            break;
          }
        }
        if (!includes) includes = this.PREVIOUS || set[0];
        this.PREVIOUS = includes;
        if (!includes.SUB) return this.closest([x, y, z], includes.CLOUD);
        else return this.search([x, y, z], includes.SUB);
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
    this.Quadtree = class {
      constructor(dataset) {
        const self = this;
        this.DATA = dataset;
        this.LeafThreshold = 4;
        this.PREVIOUS = undefined;
        this.xRange = [Infinity, -Infinity];
        this.yRange = [Infinity, -Infinity];
        this.DATA.forEach(([x, y]) => {
          this.xRange[0] = Math.min(this.xRange[0], x);
          this.xRange[1] = Math.max(this.xRange[1], x);
          this.yRange[0] = Math.min(this.yRange[0], y);
          this.yRange[1] = Math.max(this.yRange[1], y);
        });
        this.Node = class {
          constructor() {
            this.SUB = null;
            this.xRange = [Infinity, -Infinity];
            this.yRange = [Infinity, -Infinity];
            this.CLOUD = [];
          }
          divide() {
            let [mX, mxX] = this.xRange;
            let [mY, mxY] = this.yRange;
            this.CLOUD.forEach(([x, y]) => {
              (mX = Math.min(mX, x)), (mxX = Math.max(mxX, x));
              (mY = Math.min(mY, y)), (mxY = Math.max(mxY, y));
            });
            this.xRange = [mX, mxX];
            this.yRange = [mY, mxY];
            if (this.CLOUD.length < self.LeafThreshold) return false;
            this.SUB = self.make(this.CLOUD, [...this.xRange, ...this.yRange]);
          }
        };
        this.TREE = this.make(this.DATA);
      }
      make(set, [xR1, xR2, yR1, yR2] = new Array(6).fill(undefined)) {
        let [mX, mY] = set[0];
        let [mxX, mxY] = set[0];
        if ([xR1, xR2, yR1, yR2].every((e) => e !== undefined)) {
          [mX, mxX, mY, mxY] = [xR1, xR2, yR1, yR2];
        } else {
          for (const [x, y] of set) {
            (mX = Math.min(mX, x)), (mxX = Math.max(mxX, x));
            (mY = Math.min(mY, y)), (mxY = Math.max(mxY, y));
          }
        }
        const dX = (mxX + mX) / 2;
        const dY = (mxY + mY) / 2;
        const Nodes = new Array(4).fill(null).map(() => new this.Node());
        set.forEach(([x, y]) => {
          const index = (x > dX ? 1 : 0) | (y > dY ? 2 : 0);
          Nodes[index].CLOUD.push([x, y]);
        });
        return Nodes.filter((Node) => {
          if (Node.CLOUD.length > 0) {
            Node.divide();
            return true;
          } else return false;
        });
      }
      search(point, set = this.TREE) {
        let [x, y] = point;
        const clamp = (v, min, max) => ((v > min ? v : min) < max ? v : max);
        x = clamp(x, this.xRange[0], this.xRange[1]);
        y = clamp(y, this.yRange[0], this.yRange[1]);
        let includes = null;
        for (let i = 0; i < set.length; i++) {
          const xR = set[i].xRange;
          const yR = set[i].yRange;
          if (x >= xR[0] && x <= xR[1] && y >= yR[0] && y <= yR[1]) {
            includes = set[i];
            break;
          }
        }
        if (!includes) includes = this.PREVIOUS || set[0];
        this.PREVIOUS = includes;
        if (!includes.SUB) return this.closest([x, y], includes.CLOUD);
        else return this.search([x, y], includes.SUB);
      }
      closest(point, set) {
        this.PREVIOUS = undefined;
        let match = set[0];
        let matchDist = Infinity;
        const compare = outSelf.RGBto24bit(point);
        for (let i = 0; i < set.length; i++) {
          const x = set[i][0],
            y = set[i][1];
          if (outSelf.RGBto24bit(set[i]) === compare) return point;
          else {
            const distance = (x - point[0]) ** 2 + (y - point[1]) ** 2;
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
      constructor(name, x, y) {
        this._x = x;
        this._y = y;
        this.name = name;
        this.tree = {};
        this.parts = {};
      }
      render() {
        const { x, y } = this;
      }
      move() {}
      get x() {
        return this._x;
      }
      get y() {
        return this._y;
      }
      set x(v) {
        this.move();
        this._x = v;
      }
      set y(v) {
        this.move();
        this._y = v;
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
    try {
      alert("result" + this.COLORTREE.search([255, 31, 31]));
    } catch (error) {
      alert(error);
    }
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
        for (const { name: part, sub, home, costumes } of parts) {
          Sprite.costumes[part] = new this.Part(home, sub, 0, 0);
          for (const { name: costume, count: c, anchors: a } of costumes) {
            const frames = await Promise.all(
              Array.from(
                { length: c },
                (_, i) => `Sprites/${name}/${part}/${costume}${i}.png`
              ).map(async (path) => {
                const [result, w] = await self.imgCorrect(path);
                const output = self.findAnchor(a, result, w, home);
                if (output.length > 0) return new self.Frame(result, output, w);
                throw new Error(`${path} is missing an anchor of anchors ${a}`);
              })
            );
            Sprite.costumes[part][costume] = new self.Costume(costume);
            Sprite.costumes[part][costume].frames = frames;
          }
        }
        this.sprites.push(Sprite);
      })
    );
    this.sprites[0].costumes.leftArm.punch.frames[0].render();
  }
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
      result.push([arr[i], [x, y]]);
      if (home === color) result.home = [x, y];
    }
    return result;
  }
  RGBto24bit([r, g, b]) {
    return (r << 16) | (g << 8) | b;
  }
}
