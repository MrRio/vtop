/**
 * vtop – Velocity Top
 *
 * http://parall.ax/vtop
 *
 * Because `top` just ain't cutting it anymore.
 *
 * (c) 2014 James Hall, Parallax Agency Ltd
 *
 * @license MIT
 */

var App = function() {

	// Load in required libs
	var canvas = require('drawille'),
		blessed = require('blessed'),
		program = blessed.program(),
		os = require('os'),
		cli = require('commander'),
		upgrade = require('./upgrade.js'),
		VERSION = require('./package.json').version,
		child_process = require('child_process'),
		glob = require("glob"),
		themes = "";

	var files = glob.sync(__dirname + "/themes/*.json");
	for (var i = 0; i < files.length; i++) {
		var theme_name = files[i].replace(__dirname + '/themes/', '').replace('.json', '');
		themes += theme_name + '|';
	}
	themes = themes.slice(0, -1);

	// Set up the commander instance and add the required options
	cli
		.option('-t, --theme  [name]', 'set the vtop theme [' + themes + ']', 'parallax')
		.option('--quit-after [seconds]', 'Quits vtop after interval', '0')
		.version(VERSION)
		.parse(process.argv);

	/**
	 * Instance of blessed screen, and the charts object
	 */
	var screen,
		charts = [],
		loadedTheme,
		intervals = [];

	var upgradeNotice = false,
		disableTableUpdate = false,
		disableTableUpdateTimeout = setTimeout(function() {}, 0);

	var graph_scale = 1;

	// Private variables

	/**
	 * This is the number of data points drawn
	 * @type {Number}
	 */
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
	var graph, graph2, processList, processListSelection;

	// Private functions

	/**
	 * Draw header
	 * @param  {string} left  This is the text to go on the left
	 * @param  {string} right This is the text for the right
	 * @return {void}
	 */
	var drawHeader = function() {
		var headerText, headerTextNoTags;
		if (upgradeNotice) {
			upgradeNotice = upgradeNotice + '';
			headerText = ' {bold}vtop{/bold}{white-fg} for ' + os.hostname() + ' {red-bg} Press \'u\' to upgrade to v' + upgradeNotice + ' {/red-bg}{/white-fg}';
			headerTextNoTags = ' vtop for ' + os.hostname() + '  Press \'u\' to upgrade to v' + upgradeNotice + ' ';
		} else {
			headerText = ' {bold}vtop{/bold}{white-fg} for ' + os.hostname() + ' ';
			headerTextNoTags = ' vtop for ' + os.hostname() + ' ';
		}

		var header = blessed.text({
			top: 'top',
			left: 'left',
			width: headerTextNoTags.length,
			height: '1',
			fg: loadedTheme.title.fg,
			content: headerText,
			tags: true
		});
		var date = blessed.text({
			top: 'top',
			right: 0,
			width: 9,
			height: '1',
			align: 'right',
			content: '',
			tags: true
		});
		screen.append(header);
		screen.append(date);

		var zeroPad = function(input) {
			return ('0' + input).slice(-2);
		};

		var updateTime = function() {
			var time = new Date();
			date.setContent(zeroPad(time.getHours()) + ':' + zeroPad(time.getMinutes()) + ':' + zeroPad(time.getSeconds()) + ' ');
			screen.render();
		};

		updateTime();
		setInterval(updateTime, 1000);
	};

	/**
	 * Draw the footer
	 *
	 * @todo This appears to break on some viewports
	 */
	var drawFooter = function() {

		var commands = {
			'dd': 'Kill process',
			'j': 'Down',
			'k': 'Up',
			'g': 'Jump to top',
			'G': 'Jump to bottom',
			'c': 'Sort by CPU',
			'm': 'Sort by Mem'
		};
		var text = '';
		for (var c in commands) {
			var command = commands[c];
			text += '  {white-bg}{black-fg}' + c + '{/black-fg}{/white-bg} ' + command;
		}

		var footerRight = blessed.text({
			bottom: '0',
			left: '0%',
			width: '100%',
			align: 'right',
			tags:true,
			content: text + '    http://parall.ax/vtop ',
			fg: loadedTheme.footer.fg
		});
		screen.append(footerRight);
	};

	/**
	 * Repeats a string
	 * @var string The string to repeat
	 * @var integer The number of times to repeat
	 * @return {string} The repeated chars as a string.
	 */
	var stringRepeat = function(string, num) {
		if (num < 0) {
			return '';
		}
		return new Array(num + 1).join(string);
	};

	/**
	 * This draws a chart
	 * @param  {int} chartKey The key of the chart.
	 * @return {string}       The text output to draw.
	 */
	var drawChart = function(chartKey) {
		var chart = charts[chartKey];
		var c = chart.chart;
		c.clear();

		if (! charts[chartKey].plugin.initialized) {
			return false;
		}

		var dataPointsToKeep = 5000;

		charts[chartKey].values[position] = charts[chartKey].plugin.currentValue;

		var computeValue = function(input) {
			return chart.height - Math.floor(((chart.height + 1) / 100) * input) - 1;
		};

		if (position > dataPointsToKeep) {
			delete charts[chartKey].values[position - dataPointsToKeep];
		}

		for (var pos in charts[chartKey].values) {

			if (graph_scale >= 1 || (graph_scale < 1 && pos % (1 / graph_scale) == 0)) {
				var p = parseInt(pos, 10) + (chart.width - charts[chartKey].values.length);
				// calculated x-value based on graph_scale
				var x = (p * graph_scale) + ((1 - graph_scale) * chart.width);

				// draws top line of chart
				if (p > 1 && computeValue(charts[chartKey].values[pos - 1]) > 0) {
					c.set(x, computeValue(charts[chartKey].values[pos - 1]));
				}

				// Start deleting old data points to improve performance
				// @todo: This is not be the best place to do this

				// fills all area underneath top line
				for (var y = computeValue(charts[chartKey].values[pos - 1]); y < chart.height; y ++) {
					if (graph_scale > 1 && p > 0 && y > 0) {
						var current = computeValue(charts[chartKey].values[pos - 1]),
							next = computeValue(charts[chartKey].values[pos]),
							diff = (next - current) / graph_scale;

						// adds columns between data if graph is zoomed in, takes average where data is missing to make smooth curve
						for (var i = 0; i < graph_scale; i++) {
							c.set(x + i, y + (diff * i));
							for (var j = y + (diff * i); j < chart.height; j++) {
								c.set(x + i, j);
							}
						}
					} else if (graph_scale <= 1) {
						// magic number used to calculate when to draw a value onto the chart
						var allowedPValues = (charts[chartKey].values.length - ((graph_scale * charts[chartKey].values.length) + 1)) * -1;
						c.set(x, y);
					}
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
	 * Draws a table.
	 * @param  {int} chartKey The key of the chart.
	 * @return {string}       The text output to draw.
	 */
	var drawTable = function(chartKey) {
		var chart = charts[chartKey];
		var columnLengths = {};

		// Clone the column array
		var columns = chart.plugin.columns.slice(0);
		columns.reverse();
		var i = 0;
		var removeColumn = false;
		var lastItem = columns[columns.length - 1];

		var minimumWidth = 12;
		var padding = 1;

		if (chart.width > 50) {
			padding = 2;
		}

		if (chart.width > 80) {
			padding = 3;
		}
		// Keep trying to reduce the number of columns
		do {
			var totalUsed = 0;
			var firstLength = 0;
			var totalColumns = columns.length;
			// Allocate space for each column in reverse order
			for (var column in columns) {
				var item = columns[column];
				i ++;
				// If on the last column (actually first because of array order)
				// then use up all the available space
				if (item == lastItem) {
					columnLengths[item] = chart.width - totalUsed;
					firstLength = columnLengths[item];
				} else {
					columnLengths[item] = item.length + padding;
				}
				totalUsed += columnLengths[item];
			}
			if (firstLength < minimumWidth && columns.length > 1) {
				totalUsed = 0;
				columns.shift();
				removeColumn = true;
			} else {
				removeColumn = false;
			}
		} while (removeColumn);

		// And back again
		columns.reverse();
		var titleOutput = '{bold}';
		for (var headerColumn in columns) {
			var colText = ' ' + columns[headerColumn];
			titleOutput += (colText + stringRepeat(' ', columnLengths[columns[headerColumn]] - colText.length));
		}
		titleOutput += '{/bold}' + "\n";

		var bodyOutput = [];
		for (var row in chart.plugin.currentValue) {
			var currentRow = chart.plugin.currentValue[row];
			var rowText = '';
			for (var bodyColumn in columns) {
				var colText = ' ' + currentRow[columns[bodyColumn]];
				rowText += (colText + stringRepeat(' ', columnLengths[columns[bodyColumn]] - colText.length)).slice(0, columnLengths[columns[bodyColumn]]);
			}
			bodyOutput.push(rowText);
		}
		return {
			title: titleOutput,
			body: bodyOutput,
			processWidth: columnLengths[columns[0]]
		};
	};

	// This is set to the current items displayed
	var currentItems = [];
	var processWidth = 0;
	/**
	 * Overall draw function, this should poll and draw results of
	 * the loaded sensors.
	 */
	var draw = function() {
		position ++;

		var chartKey = 0;
		graph.setContent(drawChart(chartKey));
		graph2.setContent(drawChart(chartKey + 1));

		if (! disableTableUpdate) {
			var table = drawTable(chartKey + 2);
			processList.setContent(table.title);

			// If we keep the stat numbers the same immediately, then update them
			// after, the focus will follow. This is a hack.

			var existingStats = {};
			// Slice the start process off, then store the full stat,
			// so we can inject the same stat onto the new order for a brief render
			// cycle.
			for (var stat in currentItems) {
				var thisStat = currentItems[stat];
				existingStats[thisStat.slice(0, table.processWidth)] = thisStat;
			}
			processWidth = table.processWidth;
			// Smush on to new stats
			var tempStats = [];
			for (var stat in table.body) {
				var thisStat = table.body[stat];
				tempStats.push(existingStats[thisStat.slice(0, table.processWidth)]);
			}
			// Move cursor position with temp stats
			processListSelection.setItems(tempStats);

			// Update the numbers
			processListSelection.setItems(table.body);

			processListSelection.focus();

			currentItems = table.body;
		}


		screen.render();
	};

	// Public function (just the entry point)
	return {

		init: function() {
			var theme;
			if (typeof process.theme != 'undefined') {
				theme = process.theme;
			} else {
				theme = cli.theme;
			}
			/**
			 * Quits running vtop after so many seconds
			 * This is mainly for perf testing.
			 */
			if (cli['quitAfter'] !== '0') {
				setTimeout(function() {
					process.exit(0);
				}, parseInt(cli['quitAfter']) * 1000);
			}

			try {
				loadedTheme = require('./themes/' + theme + '.json');
			} catch(e) {
				console.log('The theme \'' + theme + '\' does not exist.');
				process.exit(1);
			}
			// Create a screen object.
			screen = blessed.screen();

			// Configure 'q', esc, Ctrl+C for quit
			var upgrading = false;

			var doCheck = function() {
				upgrade.check(function(v) {
					upgradeNotice = v;
					drawHeader();
				});
			};

			doCheck();
			// Check for updates every 5 minutes
			//setInterval(doCheck, 300000);

			var lastKey = '';

			screen.on('keypress', function(ch, key) {

				if (key == 'up' || key == 'down' || key == 'k' || key == 'j') {
					// Disable table updates for half a second
					disableTableUpdate = true;
					clearTimeout(disableTableUpdateTimeout);
					disableTableUpdateTimeout = setTimeout(function() {
						disableTableUpdate = false;
					}, 1000);
				}

				if (
					upgrading === false &&
					(
						key.name === 'q' ||
						key.name === 'escape' ||
						(key.name === 'c' && key.ctrl === true)
					)
				) {
					return process.exit(0);
				}
				// dd killall
				// @todo: Factor this out
				if (lastKey == 'd' && key.name == 'd') {
					var selectedProcess = processListSelection.getItem(processListSelection.selected).content;
					selectedProcess = selectedProcess.slice(0, processWidth).trim();

					child_process.exec('killall "' + selectedProcess + '"', function (error, stdout, stderr) {
						//console.log('Killed!');
					});
				}

				if (key.name == 'c' && charts[2].plugin.sort != 'cpu') {
					charts[2].plugin.sort = 'cpu';
					charts[2].plugin.poll();
					setTimeout(function() {
						processListSelection.select(0);
					}, 200);
				}
				if (key.name == 'm' && charts[2].plugin.sort != 'mem') {
					charts[2].plugin.sort = 'mem';
					charts[2].plugin.poll();
					setTimeout(function() {
						processListSelection.select(0);
					}, 200);
				}
				lastKey = key.name;

				if (key.name === 'u' && upgrading === false) {
					upgrading = true;
					// Clear all intervals
					for (var interval in intervals) {
						clearInterval(intervals[interval]);
					}
					processListSelection.detach();
					program = blessed.program();
					program.clear();
					program.disableMouse();
					program.showCursor();
					program.normalBuffer();

					// @todo: show changelog  AND  smush existing data into it :D
					upgrade.install('vtop', [
						{
							'theme': theme
						}
					]);
				}

				if ((key.name =='left' || key.name == 'h') && graph_scale < 8) {
					graph_scale *= 2;
				} else if ((key.name =='right' || key.name == 'l') && graph_scale > 0.125) {
					graph_scale /= 2;
				}
			});

			drawHeader();

			//setInterval(drawHeader, 1000);
			drawFooter();

			graph = blessed.box({
				top: 1,
				left: 'left',
				width: '100%',
				height: '50%',
				content: '',
				fg: loadedTheme.chart.fg,
				tags: true,
				border: loadedTheme.chart.border
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
					height: graph.height - 2,
					content: '',
					fg: loadedTheme.chart.fg,
					tags: true,
					border: loadedTheme.chart.border
				});
				screen.append(graph2);

				processList = blessed.box({
					top: graph.height + 1,
					left: '50%',
					width: screen.width - graph2.width,
					height: graph.height - 2,
					keys: true,
					mouse: true,
					fg: loadedTheme.table.fg,
					tags: true,
					border: loadedTheme.table.border
				});
				screen.append(processList);


				processListSelection = blessed.list({
					height: processList.height - 3,
					top: 2,
					width: processList.width - 2,
					left: 1,
					keys: true,
					vi: true,
					search: function(jump) {
						// @TODO
						//jump('string of thing to jump to');
					},
					style: loadedTheme.table.items,
					mouse: true
				});
				processList.append(processListSelection);
				processListSelection.focus();
				screen.render();

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
				size.pixel.width = (graph.width - 2) * 2;
				size.pixel.height = (graph.height - 2) * 4;

				var plugins = ['cpu', 'memory', 'process'];

				for (var plugin in plugins) {
					var width, height, currentCanvas;
					// @todo Refactor this
					switch (plugins[plugin]) {
						case 'cpu':
							width = (graph.width - 3) * 2;
							height = (graph.height - 2) * 4;
							currentCanvas = new canvas(width, height);
							break;
						case 'memory':
							width = (graph2.width - 3) * 2;
							height = ((graph2.height - 2) * 4);
							currentCanvas = new canvas(width, height);
							break;
						case 'process':
							width = processList.width - 3;
							height = processList.height - 2;
							break;
					}

					// If we're reconfiguring a plugin, then preserve the already recorded values
					var values;
					if (typeof charts[plugin] != 'undefined' && typeof charts[plugin].values != 'undefined') {
						values = charts[plugin].values;
					} else {
						values = [];
					}
					charts[plugin] = {
						chart: currentCanvas,
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
				processList.setLabel(' ' + charts[2].plugin.title + ' ');

			};

			setupCharts();
			screen.on('resize', setupCharts);
			intervals.push(setInterval(draw, 100));

			// @todo Make this more sexy
			intervals.push(setInterval(charts[0].plugin.poll, charts[0].plugin.interval));
			intervals.push(setInterval(charts[1].plugin.poll, charts[1].plugin.interval));
			intervals.push(setInterval(charts[2].plugin.poll, charts[2].plugin.interval));

		}
	};
}();

App.init();
