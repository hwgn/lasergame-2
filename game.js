export function setup(p5 = this, canvasParentRef = undefined) {
  p5.createCanvas(p5.windowWidth, p5.windowHeight).parent(canvasParentRef);
  p5.pixelDensity(2);

}

export function draw(p5 = this) {
  p5.background(0);
  p5.fill(255);
  p5.rect(100, 100, 200, 200);
  p5.rect(p5.width - 300, 100, 200, 200);
  p5.rect(100, p5.height - 300, 200, 200);
  p5.rect(p5.width - 300, p5.height - 300, 200, 200);
}