/**
 * 
 * Process monitor sensor
 *
 * (c) 2014 James Hall
 */

var os = require('os-utils'),
	fs = require('fs'),
	process = require('child_process');

var plugin = {
	/**
	 * This appears in the title of the graph
	 */
	title: 'Process List',
	/**
	 * The type of sensor
	 * @type {String}
	 */
	type: 'table',
	/**
	 * The default interval time in ms that this plugin should be polled.
	 * More costly benchmarks should be polled less frequently.
	 */
	interval: 2000,

	columns: ['Command', 'CPU %', 'Count', 'Memory'],
	currentValue: [{
		'Command': 'Google Chrome',
		'Count': '4',
		'CPU %': '0.4',
		'Memory': '100 MB'
	}, {
		'Command': 'Sublime Text 2',
		'Count': '1',
		'CPU %': '0.1',
		'Memory': '200MB'
	}],

	// comm, count calced, cp, pmem

	/**
	 * Grab the current value for the table
	 */
	poll: function() {
		var stats = {};
		var ps = process.exec('ps -eo %cpu,%mem,comm', function (error, stdout, stderr) {
			var lines = stdout.split("\n");
			// Ditch the first line
			lines[0] = '';
			for (var line in lines) {
				var currentLine = lines[line].trim();
				//console.log(currentLine);
				var words = currentLine.split(" ");
				if (typeof words[0] !== 'undefined' && typeof words[1] !== 'undefined' ) {
					var cpu = words[0];
					var mem = words[2];
					var offset = cpu.length + mem.length + 3;
					var comm = currentLine.slice(offset);
					comm = comm.split('/');
					comm = comm[comm.length - 1];
					// If already exists, then add them together
					if (typeof stats[comm] !== 'undefined') {
						stats[comm] = {
							cpu: parseFloat(stats[comm].cpu) + parseFloat(cpu),
							mem: parseFloat(stats[comm].mem) + parseFloat(mem),
							comm: comm,
							count: parseInt(stats[comm].count) + 1
						};
					} else {
						stats[comm] = {
							cpu: cpu,
							mem: mem,
							comm: comm,
							count: 1
						};
					}
				}
			}
			var statsArray = new Array();
			for (var stat in stats) {
				var cpuRounded = parseFloat(stats[stat].cpu).toFixed(1);
				statsArray.push({
					'Command': stats[stat].comm,
					'Count': stats[stat].count,
					'CPU %': cpuRounded,
					'Memory':  stats[stat].mem,
					'cpu': stats[stat].cpu // exact cpu for comparison
				});
			}
			statsArray.sort(function(a, b) {
				return b.cpu - a.cpu;
			});
			plugin.currentValue = statsArray;
		});
	}
};


module.exports = exports = plugin;