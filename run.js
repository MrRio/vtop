var Canvas = require('drawille');
var line = require('bresenham');

var size = require('window-size');

var width = Math.floor(size.width / 2) * 4;
var height = Math.floor((size.height) / 16) * 36;


var c = new Canvas(width, height);
var m = new Canvas(width, height);


var i = 0;

String.prototype.repeat = function(num) {
  return new Array(num + 1).join(this);
};

var drawHeader = function(left, right) {
  console.log(left + ' '.repeat(size.width - (left.length + right.length)) + right);
};


var os  = require('os-utils');

var currentCpuUsage = 0;
setInterval(function() {
  os.cpuUsage(function(v){
    currentCpuUsage = Math.floor(v * 100);
  });
}, 100);

var currentMemUsage = 0;
setInterval(function() {
  currentMemUsage = 100 - Math.floor(os.freememPercentage() * 100);
}, 100);

var position = 0;
var cpuPositions = [];
var memPositions = [];

function draw() {
  c.clear();

  for (y = 0; y < height; y ++) {
    c.set(0, y);
    c.set(width - 1, y);
  }

  for (x = 0; x < width; x ++) {
    c.set(x, 0);
    c.set(x, height - 1);
  }

  m.clear();

  for (y = 0; y < height; y ++) {
    m.set(0, y);
    m.set(width - 1, y);
  }

  for (x = 0; x < width; x ++) {
    m.set(x, 0);
    m.set(x, height - 1);
  }

  position = position + 1;

  setTimeout(draw, 100);

  for (var i = 0; i < 5; i ++) {
    console.log('');
  }
  console.log('vtop');

  cpuPositions[position] = height - Math.floor((height / 100) * currentCpuUsage) - 1;

  for (var pos in cpuPositions) {
    var p2 = parseInt(pos, 10) + (width - cpuPositions.length);
    if (p2 < 1 || cpuPositions[pos] < 0) {
      continue;
    }
    c.set(p2, cpuPositions[pos]);
    for (var y = cpuPositions[pos]; y < height; y ++) {
      c.set(p2, y);
    }
  }

  drawHeader('CPU', currentCpuUsage + '%');
  console.log(c.frame());

  memPositions[position] = height - Math.floor((height / 100) * currentMemUsage) - 1;

  for (var pos in memPositions) {
    var p2 = parseInt(pos, 10) + (width - cpuPositions.length);
    if (p2 < 1 || memPositions[pos] < 0) {
      continue;
    }

    m.set(p2, memPositions[pos]);
    for (var y = memPositions[pos]; y < height; y ++) {
      m.set(p2, y);
    }
  }

  drawHeader('Memory', currentMemUsage + '%');
  console.log(m.frame());

}

draw();
