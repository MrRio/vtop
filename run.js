var Canvas = require('drawille');
var line = require('bresenham');

var size = require('window-size');
var TermUI = require('node-term-ui');


var width = Math.floor(size.width / 2) * 4;
var height = Math.floor(size.height / 4) * 16;


var c = new Canvas(width, height);

var i = 0;
function draw() {
  c.clear();
  c.set(1, 1);
  c.set(1, 2);
  c.set(1, 3);

  for (y = 1; y < height; y ++) {
    c.set(1, y);
    c.set(width - 1, y);
  }

  for (x = 1; x < width; x ++) {
    c.set(x, 1);
    c.set(x, height - 1);
  }

  setTimeout(draw, 500);
  console.log(c.frame());
}

draw();
