/**
 * Memory Usage sensor
 *
 * (c) 2014 James Hall
 */
'use strict'

const os = require('os-utils')
const _os = require('os')
const child = require('child_process')

const plugin = {
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

  isLinux: _os.platform().includes('linux'),

  /**
   * Grab the current value, from 0-100
   */
  poll () {
    const computeUsage = (used, total) => Math.round(100 * (used / total))

    if (plugin.isLinux) {
      child.exec('free -m', (err, stdout, stderr) => {
        if (err) {
          console.error(err)
        }
        const data = stdout.split('\n')[1].replace(/[\s\n\r]+/g, ' ').split(' ')
        const used = parseInt(data[2], 10)
        const total = parseInt(data[1], 10)
        plugin.currentValue = computeUsage(used, total)
      })
    } else {
      plugin.currentValue = Math.round((1 - os.freememPercentage()) * 100)
    }

    plugin.initialized = true
  }
}

module.exports = exports = plugin
