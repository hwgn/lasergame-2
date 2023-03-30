// play the game at https://hendrikwagner.de/play/
export { setup, draw, windowResized, mouseReleased };

let editMode = false;

const TILE_PADDING = 20;
const BOTTOM_OFFSET = 100;

const tiles = [];
let tileTypes = {};
let boardManager;

function setup(p5 = this, canvasParentRef = undefined) {
  p5.createCanvas(p5.windowWidth, p5.windowHeight).parent(canvasParentRef);
  p5.pixelDensity(2);
  editMode = false;

  p5.imageMode(p5.CENTER);
  p5.textAlign(p5.CENTER);

  tileTypes = initTiles(p5);

  for (let x = 0; x < 10; x++) {
    for (let y = 0; y < 10; y++) {
      tiles.push(new Tile(tileTypes.floor, x, y));
    }
  }
  tiles.push(new Mirror(0, 0, 0));

  boardManager = new BoardManager(p5);
}

function draw(p5 = this) {
  if(p5.width < 300 || p5.height < 300) {
    p5.background(255, 0, 0);
    p5.textSize(10);
    p5.fill(255);
    p5.text("Please resize your window to a larger size.", p5.width / 2, p5.height / 2);
    return;
  }

  p5.background(0);
  p5.fill(255);
  p5.rect(100, 100, 200, 200);
  p5.rect(p5.width - 300, 100, 200, 200);
  p5.rect(100, p5.height - 300, 200, 200);
  p5.rect(p5.width - 300, p5.height - 300, 200, 200);

  boardManager.execute(TILE_PADDING,
    TILE_PADDING,
    p5.width - TILE_PADDING,
    p5.height - (BOTTOM_OFFSET + TILE_PADDING));
}

function windowResized(p5 = this) {
  p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
}

function mouseReleased(p5 = this) {
  boardManager.handleClick(p5.mouseX, p5.mouseY);
}

class Tile {
  constructor(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
  }

  show(p5) {
    const data = { ...boardManager.posOfTile(this.x, this.y), size: boardManager.getTileSize() };
    p5.image(
      this.type.image,
      data.x,
      data.y,
      data.size,
      data.size
    );
  }

  handleClick(pos) {
    if (this.x !== pos.x || this.y !== pos.y) return;
    if (editMode) {
      this.type = tileTypes.wall;
    }
  }
}

class Mirror extends Tile {
  constructor(x, y, rotation) {
    super(tileTypes.mirror, x, y);
    this.rotation = rotation;
  }

  show(p5) {
    p5.push();
    const data = { ...boardManager.posOfTile(this.x, this.y), size: boardManager.getTileSize() };
    p5.translate(data.x, data.y);
    p5.rotate(this.rotation * p5.PI / 2);
    p5.image(
      this.type.image,
      0,
      0,
      data.size,
      data.size
    );
    p5.pop();
  }

  handleClick(pos) {
    if (this.x !== pos.x || this.y !== pos.y) return;
    this.rotation = (this.rotation + 1) % 4;
  }
}

class TileType {
  constructor(name, image) {
    this.name = name;
    this.image = image;
  }
}

function initTiles(p5) {
  return {
    floor: new TileType("floor", p5.loadImage(require("./resources/img/floor_0.png"))),
    wall: new TileType("wall", p5.loadImage(require("./resources/img/stone_clean.png"))),
    mirror: new TileType("mirror", p5.loadImage(require("./resources/img/mirror_0.png")))
  };
}

class BoardManager {
  constructor(p5) {
    this.p5 = p5;
    this.reset();
  }

  reset() {
    this.maxTiles = this.getMaxTiles();
  }

  /**
   * Draws the game board.
   * @param x1 left border
   * @param y1 top border
   * @param x2 right border
   * @param y2 bottom border
   */
  execute(x1, y1, x2, y2) {
    this.b = { x1, y1, x2, y2 };
    this.drawBoard();
  }

  drawBoard() {
    const { x1, y1, x2, y2 } = this.b;
    const p5 = this.p5;

    p5.push();
    p5.translate(x1 + ((x2 - x1) / 2), y1 + ((y2 - y1) / 2));

    tiles.forEach((tile) => {
      tile.show(p5);
    });

    p5.pop();
  }

  getMaxTiles() {
    return tiles.reduce((m, p) => {
      return {
        x: this.p5.max(m.x, p.x),
        y: this.p5.max(m.y, p.y)
      };
    }, { x: 0, y: 0 });
  }

  handleClick(x, y) {
    const pos = this.getTileIndex(x, y);
    if (!pos) return;

    console.log(pos);
    tiles.forEach((tile) => {
      tile.handleClick(pos);
    });
  }

  getTileSize() {
    return this.p5.min((this.b.x2 - this.b.x1) / this.maxTiles.x, (this.b.y2 - this.b.y1) / this.maxTiles.y, 50);
  }

  /**
   * Returns the position of a tile in the grid, with 0,0 being the center of the screen
   * @param x x index of the tile
   * @param y y index of the tile
   * @returns {{x: number, y: number}} actual position of the tile, with 0,0 being the center of the screen
   */
  posOfTile(x, y) {
    const tileSize = this.getTileSize();
    return {
      x: (x - this.maxTiles.x * 0.5) * tileSize,
      y: (y - this.maxTiles.y * 0.5) * tileSize
    };
  }

  /**
   * Returns the index of a tile given true x and y coordinates
   * @param x x coordinate
   * @param y y coordinate
   * @returns {*}
   */
  getTileIndex(x, y) {
    const { x1, y1, x2, y2 } = this.b;
    if (x < x1 || x > x2 || y < y1 || y > y2) return null;

    const tileSize = this.getTileSize();
    const xIndex = Math.floor((x - x1) / tileSize) + this.maxTiles.x / 2;
    const yIndex = Math.floor((y - y1) / tileSize) + this.maxTiles.y / 2;
    return { x: xIndex, y: yIndex };
  }
}
