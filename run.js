process.stdin.resume();
process.stdin.setEncoding('utf8');
var util = require('util');


var Canvas = require('drawille');
var line = require('bresenham');

var size = require('window-size');

var width = Math.floor(size.width / 2) * 4;
var height = Math.floor((size.height) / 16) * 36;
var drawInterval = 100;

var c = new Canvas(width, height);
var m = new Canvas(width, height);


var i = 0;

String.prototype.repeat = function( num )
{
    return new Array( Math.round(num) + 1 ).join( this );
}

var drawHeader = function(left, right) {
  console.log(left + ' '.repeat(size.width - (left.length + right.length)) + right);
}

var drawFooter = function(){
    var period = ((drawInterval * size.width) / 1000);
    var ticks = [];
    for (var i = 5; i > 0; i--) {
      var tick = ((period / 5) * i).toFixed(1) + 's';
      ticks.push(tick);
    }
    period += 's';
    var contentLength = (ticks.join('') + period).length;
    var spaces = size.width - contentLength;
    var output = '';

    output += ticks[0];
    for (var i = 1; i <= ticks.length - 1; i++) {
      output += ' '.repeat(spaces / (ticks.length)) + ticks[i];
    }
    console.log(output + ' '.repeat(size.width - output.length - 3) + '0s');
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
}, 1000);

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

  setTimeout(draw, drawInterval);

  for (var i = 0; i < 5; i ++) {
    console.log('');
  }
  console.log('Parastats v0.0.1');

  cpuPositions[position] = height - Math.floor((height / 100) * currentCpuUsage) - 1;

  for (var pos in cpuPositions) {
    var p2 = parseInt(pos) + (width - cpuPositions.length);
    if (p2 < 1 || cpuPositions[pos] < 0) {
      continue;
    }
    c.set(p2, cpuPositions[pos]);
  }

  drawHeader('CPU', currentCpuUsage + '%');
  console.log(c.frame());
  drawFooter();

  memPositions[position] = height - Math.floor((height / 100) * currentMemUsage) - 1;

  for (var pos in memPositions) {
    var p2 = parseInt(pos) + (width - cpuPositions.length);
    if (p2 < 1 || memPositions[pos] < 0) {
      continue;
    }

    m.set(p2, memPositions[pos]);
  }

  drawHeader('Memory', currentMemUsage + '%');
  console.log(m.frame());
  drawFooter();
}
 
draw();


// Listen for key presses

  process.stdin.on('data', function (text) {
    console.log('received data:', util.inspect(text));
    var intervalInput = parseInt(text);
    if (intervalInput) {
      cpuPositions.length = 0;
      memPositions.length = 0;
      drawInterval = (text / size.width) * 1000;
    }

  });

