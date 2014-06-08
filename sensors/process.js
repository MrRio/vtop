/**
 * 
 * Process monitor sensor
 *
 * (c) 2014 James Hall
 */

var os = require('os-utils');

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

	columns: ['Command', 'Count', 'CPU', 'Memory'],
	currentValue: [{
		'Command': 'Google Chrome',
		'Count': '4',
		'CPU': '0.4%',
		'Memory': '100 MB'
	}, {
		'Command': 'Sublime Text 2',
		'Count': '1',
		'CPU': '0.1%',
		'Memory': '200MB'
	}],


	/**
	 * Grab the current value for the table
	 */
	poll: function() {
		
	}
};

module.exports = exports = plugin;