'use strict'
/**
 * CPU Usage sensor
 *
 * (c) 2014 James Hall
 */
'use strict'

const os = require('os-utils')
const plugin = {
  /**
   * This appears in the title of the graph
   */
  title: 'CPU Usage',
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
  /**
   * Grab the current value, from 0-100
   */
  poll () {
    os.cpuUsage(v => {
      plugin.currentValue = (Math.floor(v * 100))
      plugin.initialized = true
    })
  }
}

module.exports = exports = plugin
