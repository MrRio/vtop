/**
 * vtop – Velocity Top
 *
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
	var blessed = require('blessed');
	var program = blessed.program();
	var os = require("os");

	/**
	 * Instance of blessed screen
	 */
	var screen;

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

	// @todo: move this into charts array
	// This is an instance of Blessed Box
	var graph;
	var graph2;

	// Private functions

	/**
	 * Draw header
	 * @param  {string} left  This is the text to go on the left
	 * @param  {string} right This is the text for the right
	 * @return {void}
	 */
	var drawHeader = function() {
		var header = blessed.text({
			top: 'top',
			left: 'left',
			width: '50%',
			height: '1',
			fg: '#a537fd',
			content: ' {bold}vtop{/bold}{white-fg} for ' + os.hostname() + '{/white-fg}',
			tags: true
		});
		var date = blessed.text({
			top: 'top',
			left: '50%',
			width: '50%',
			height: '1',
			align: 'right',
			content: '',
			tags: true
		});
		screen.append(header);
		screen.append(date);

		var updateTime = function() {
			var time = new Date();
			date.setContent(time.getHours() + ':' + ('0' + time.getMinutes()).slice(-2) + ':' + ('0' + time.getSeconds()).slice(-2) + ' ');
			screen.render();
		};

		updateTime();
		setInterval(updateTime, 1000);
	};

	var drawFooter = function() {
		var footerRight = blessed.text({
			bottom: '0',
			left: '50%',
			width: '50%',
			align: 'right',
			content: '(c) 2014 James Hall - http://parall.ax/vtop ',
			fg: 'white'
		});
		screen.append(footerRight);
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

	var drawChart = function(chartKey) {
		var chart = charts[chartKey];
		var c = chart.chart;
		c.clear();

		charts[chartKey].values[position] = charts[chartKey].plugin.currentValue;

		var computeValue = function(input) {
			return chart.height - Math.floor(((chart.height + 1) / 100) * input) - 1;
		};

		for (var pos in charts[chartKey].values) {
			var p = parseInt(pos, 10) + (chart.width - charts[chartKey].values.length);
			if (p > 0 && computeValue(charts[chartKey].values[pos]) > 0) {
				c.set(p, computeValue(charts[chartKey].values[pos]));
			}

			for (var y = computeValue(charts[chartKey].values[pos]); y < chart.height; y ++) {
				if (p > 0 && y > 0) {
					c.set(p, y);
				}
			}
		}
		// Add percentage to top right of the chart by splicing it into the braille data
		var textOutput = c.frame().split("\n");
		var percent = '   ' + chart.plugin.currentValue;
		textOutput[0] = textOutput[0].slice(0, textOutput[0].length - 4) + '{white-fg}' + percent.slice(-3) + '%{/white-fg}';

		return textOutput.join("\n");
	};

	/**
	 * Overall draw function, this should poll and draw results of 
	 * the loaded sensors.
	 */
	var draw = function() {
		position ++;

		var chartKey = 0;
		graph.setContent(drawChart(chartKey));
		graph2.setContent(drawChart(chartKey + 1));

		screen.render();

		for (var plugin in charts) {
			charts[plugin].plugin.poll();
		}
	};

	// Public function (just the entry point)
	return {

		init: function() {

			// Create a screen object.
			screen = blessed.screen();

			// Configure 'q', esc, Ctrl+C for quit
			screen.on('keypress', function(ch, key) {
				if (key.name === 'q' || key.name === 'escape' || (key.name == 'c' && key.ctrl === true)) {
					return process.exit(0);
				}
			});

			drawHeader();
			drawFooter();

			graph = blessed.box({
				top: 1,
				left: 'left',
				width: '100%',
				height: '50%',
				content: 'test',
				fg: '#a537fd',
				tags: true,
				border: {
					type: 'line',
					fg: '#00ebbe'
				}
			});

			screen.append(graph);

			var graph2appended = false;

			var createBottom = function() {
				if (graph2appended) {
					screen.remove(graph2);
					screen.remove(processList);
				}
				graph2appended = true;
				graph2 = blessed.box({
					top: graph.height + 1,
					left: 'left',
					width: '50%',
					height: graph.height - 1,
					content: 'test',
					fg: '#a537fd',
					tags: true,
					border: {
						type: 'line',
						fg: '#00ebbe'
					}
				});
				screen.append(graph2);


				processList = blessed.box({
					top: graph.height + 1,
					left: '50%',
					width: screen.width - graph2.width,
					height: graph.height - 1,
					label: ' Process List ',
					keys: true,
					mouse: true,
					border: {
						type: 'line',
						fg: '#00ebbe'
					}
				});
				screen.append(processList);
			};

			screen.on('resize', function() {
				createBottom();
			});
			createBottom();

			screen.append(graph);
			screen.append(processList);

			// Render the screen.
			screen.render();

			var setupCharts = function() {
				// @todo: Fix these drunken magic numbers
				size.pixel.width = (graph.width - 2) * 2;
				size.pixel.height = (graph.height - 2) * 4;

				var plugins = ['cpu', 'memory'];

				for (var plugin in plugins) {
					var width, height;
					// @todo Refactor this
					if (plugins[plugin] == 'cpu') {
						width = (graph.width - 3) * 2;
						height = (graph.height - 2) * 4;
					}
					if (plugins[plugin] == 'memory') {
						width = (graph2.width - 3) * 2;
						height = ((graph2.height - 2) * 4);
					}
					// If we're reconfiguring a plugin, then preserve the already recorded values
					var values;
					if (typeof charts[plugin] != 'undefined' && typeof charts[plugin].values != 'undefined') {
						values = charts[plugin].values;
					} else {
						values = [];
					}
					charts[plugin] = {
						chart: new canvas(width, height),
						values: values,
						plugin: require('./sensors/' + plugins[plugin] + '.js'),
						width: width,
						height: height
					};
					charts[plugin].plugin.poll();
				}
				// @TODO Make this less hard-codey
				graph.setLabel(' ' + charts[0].plugin.title + ' ');
				graph2.setLabel(' ' + charts[1].plugin.title + ' ');
			};

			setupCharts();
			screen.on('resize', setupCharts);
			setInterval(draw, 100);
		}
	};
}();

App.init();