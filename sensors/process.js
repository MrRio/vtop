/**
 * 
 * Process monitor sensor
 *
 * (c) 2014 James Hall
 */

var os = require('os'),
	fs = require('fs'),
	child_process = require('child_process'),
	ps = require('current-processes');

var plugin = {
	/**
	 * This appears in the title of the graph
	 */
	title: 'Process List',
	description:
		'This returns a process list, grouped by executable name. CPU % is divided by the number of cores. ' +
		'100% CPU Usage is all cores being maxed out. Unlike other tools that define the maximum as 800% for 8 cores for example.',
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

	sort: 'cpu',

	columns: ['Command', 'CPU %', 'Count', 'Memory %'],
	currentValue: [{
		'Command': 'Google Chrome',
		'Count': '4',
		'CPU %': '0.4',
		'Memory %': '1'
	}, {
		'Command': 'Sublime Text 2',
		'Count': '1',
		'CPU %': '0.1',
		'Memory': '5'
	}],

	// comm, count calced, cp, pmem

	/**
	 * Grab the current value for the table
	 */
	poll: function() {
		var stats = {};
		// @todo If you can think of a better way of getting process stats,
		// then please feel free to send me a pull request. This is version 0.1
		// and needs some love.
		ps.get(function(err, processes) {
			for (var p in processes) {
				var process = processes[p];
				// If already exists, then add them together
				if (typeof stats[process.name] !== 'undefined') {
					stats[process.name] = {
						cpu: parseFloat(stats[process.name].cpu, 10) + parseFloat(process.cpu),
						mem: parseFloat(stats[process.name].mem, 10) + parseFloat(process.mem),
						comm: process.name,
						count: parseInt(stats[process.name].count, 10) + 1
					};
				} else {
					stats[process.name] = {
						cpu: process.cpu,
						mem: process.mem,
						comm: process.name,
						count: 1
					};
				}
			}
			var statsArray = [];
			for (var stat in stats) {
				// Divide by nuber of CPU cores
				var cpuRounded = parseFloat(stats[stat].cpu / os.cpus().length).toFixed(1);
				var memRounded = parseFloat(stats[stat].mem).toFixed(1);
				statsArray.push({
					'Command': stats[stat].comm,
					'Count': stats[stat].count,
					'CPU %': cpuRounded,
					'Memory %':  memRounded,
					'cpu': stats[stat].cpu,
					'mem': stats[stat].mem // exact cpu for comparison
				});
			}
			statsArray.sort(function(a, b) {
				return parseFloat(b[plugin.sort]) - parseFloat(a[plugin.sort]);
			});

			plugin.currentValue = statsArray;
		});
	}
};

module.exports = exports = plugin;