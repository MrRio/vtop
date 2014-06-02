/**
 * vtop – Velocity Top
 
 *
 * http://parall.ax/products/velocity
 * 
 * Because `top` just ain't cutting it anymore.
 *
 * (c) 2014 James Hall, Parallax Agency Ltd
 *
 * @license MIT
 */

var App = function() {

	// Load in required libs
	var canvas = require('drawille');
	var windowSize = require('window-size');

	// Private variables
	var position = 0;

	var size = {
		pixel: {
			width: 0,
			height: 0
		},
		character: {
			width: 0,
			height: 0
		}
	};

	// Private functions

	/**
	 * Draws the header
	 */
	var drawHeader = function(left, right) {
		var output = left;
		output += stringRepeat(' ', size.character.width - (left.length + right.length));
		output += right;
		console.log(output);
	};


	/**
	 * Repeats a string
	 * @var string The string to repeat
	 * @var integer The number of times to repeat
	 */
	var stringRepeat = function(string, num) {
		return new Array(num + 1).join(string);
	};

	var charts = [];
	var position = 0;


	var drawChart = function(chartKey) {
		var chart = charts[chartKey];
		var c = chart.chart;
		c.clear();

		for (y = 0; y < size.pixel.height; y ++) {
			c.set(0, y);
			c.set(size.pixel.width - 1, y);
		}

		for (x = 0; x < size.pixel.width; x ++) {
			c.set(x, 0);
			c.set(x, size.pixel.height - 1);
		}

		charts[chartKey].currentValue = 50;
		charts[chartKey].values[position] = size.pixel.height - Math.floor((size.pixel.height / 100) * charts[chartKey].currentValue) - 1;

		for (var pos in charts[chartKey].values) {
			var p2 = parseInt(pos, 10) + (size.pixel.width - charts[chartKey].values.length);
			if (p2 < 1 || charts[chartKey].values[pos] < 0) {
				continue;
			}
			c.set(p2, charts[chartKey].values[pos]);
			for (var y = charts[chartKey].values[pos]; y < size.pixel.height; y ++) {
				c.set(p2, y);
			}
		}
		drawHeader(chart.plugin.title, '50%');
		console.log(c.frame());
	}

	/**
	 * Overall draw function, this should poll and draw results of 
	 * the loaded sensors.
	 */
	var draw = function() {
		position ++;

		for (var i = 0; i < 5; i ++) {
			console.log('');
		}
		console.log('vtop');

		var chartKey = 0;
		drawChart(chartKey);
		drawChart(chartKey + 1);
	}

	// Public function (just the entry point)
	return {

		init: function() {
			size.character.width = windowSize.width;
			size.character.height = windowSize.height;

			// @todo: Fix these drunken magic numbers
			size.pixel.width = Math.floor(size.character.width / 2) * 4;
			size.pixel.height = Math.floor((size.character.height) / 16) * 36;

			var plugins = ['cpu', 'memory'];

			for (var plugin in plugins) {
				charts[plugin] = {
					chart: new canvas(size.pixel.width, size.pixel.height),
					values: [],
					plugin: require('./sensors/' + plugins[plugin] + '.js')
				}
			}

			setInterval(draw, 100);
		}
	};
}();

App.init();