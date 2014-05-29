/**
 * CPU Usage sensor
 *
 * (c) 2014 James Hall
 */

var os = require('os-utils');

var plugin = {
	/**
	 * This appears in the title of the graph
	 */
	title: 'CPU Usage',
	/**
	 * The default interval time in ms that this plugin should be polled.
	 * More costly benchmarks should be polled less frequently.
	 */
	interval: 100,
	/**
	 * Grab the current value, from 0-100
	 */
	poll: function(callback) {
		os.cpuUsage(function(v){
			callback(Math.floor(v * 100));
		});
	}
};

exports = plugin;