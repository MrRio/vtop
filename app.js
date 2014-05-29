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
		width: 0,
		height: 0
	};

	// Private functions

	/**
	 * Draws the header
	 */
	var drawHeader = function(left, right) {
		var output = left;
		output += stringRepeat(' ', size.width - (left.length + right.length));
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

	// Public function (just the entry point)
	return {

		init: function() {
			console.log(stringRepeat('.', 20));
		}
	};
}();

App.init();