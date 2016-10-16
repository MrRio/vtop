/**
 * Memory Usage sensor
 *
 * (c) 2014 James Hall
 */

var os = require('os-utils')
var _os = require('os')
var child = require('child_process')

var plugin = {
  /**
   * This appears in the title of the graph
   */
  title: 'Memory Usage',
  /**
   * The type of sensor
   * @type {String}
   */
  type: 'chart',
  /**
   * The default interval time in ms that this plugin should be polled.
   * More costly benchmarks should be polled less frequently.
   */
  interval: 200,

  initialized: false,

  currentValue: 0,

  isLinux: _os.platform().indexOf('linux') !== -1,

  /**
   * Grab the current value, from 0-100
   */
  poll: function () {
    var computeUsage = function (used, total) {
      return Math.round(100 * (used / total))
    }

    if (plugin.isLinux) {
      child.exec('free -m', function (err, stdout, stderr) {
        if (err) {
          console.error(err)
        }
        var data = stdout.split('\n')[1].replace(/[\s\n\r]+/g, ' ').split(' ')

        var used = parseInt(data[2])
        var total = parseInt(data[1])
        plugin.currentValue = computeUsage(used, total)
      })
    } else {
      plugin.currentValue = Math.round((1 - os.freememPercentage()) * 100)
    }

    plugin.initialized = true
  }
}

module.exports = exports = plugin
