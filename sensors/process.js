/**
 * 
 * Process monitor sensor
 *
 * (c) 2014 James Hall
 */

var os = require('os'),
	fs = require('fs'),
	child_process = require('child_process'),
	_ = require('lodash'),
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

		// This uses the https://github.com/branneman/current-processes
		// written by @branneman to factor this code out, and support multiple OS 
		// adapters.
		ps.get(function(err, processes) {
			var statsArray = [];

			//console.log(processes);
			for (var p in processes) {
				var process = processes[p];
				var cpuRounded = parseFloat(process.cpu / os.cpus().length).toFixed(1);
				var memRounded = parseFloat(process.mem).toFixed(1);
				statsArray.push({
					'Command': process.name,
					'Count': 1,
					'CPU %': cpuRounded,
					'Memory %':  memRounded,
					'cpu': process.cpu,
					'mem': process.mem // exact cpu for comparison
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
