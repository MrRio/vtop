/**
 *
 * Process monitor sensor
 *
 * (c) 2014 James Hall
 */
'use strict'

const os = require('os')
const childProcess = require('child_process')

const plugin = {
  /**
   * * This appears in the title of the graph
   */
  title: 'Process List',
  description: `
    This returns a process list, grouped by executable name. CPU % is divided by the number of cores.
    100% CPU Usage is all cores being maxed out. Unlike other tools that define the maximum as 800% for 8 cores for example.`,
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

  initialized: false,

  sort: 'cpu',

  columns: ['Command', 'PID  ', 'CPU %', 'Count', 'Memory %'],
  currentValue: [{
    'Command': 'Google Chrome',
    'PID': '1234',
    'Count': '4',
    'CPU %': '0.4',
    'Memory %': '1'
  }, {
    'Command': 'Sublime Text 2',
    'PID': '4321',
    'Count': '1',
    'CPU %': '0.1',
    'Memory': '5'
  }],

  /**
   * Grab the current value for the table
   */
  poll () {
    const stats = {}
    // @todo If you can think of a better way of getting process stats,
    // then please feel free to send me a pull request. This is version 0.1
    // and needs some love.
    childProcess.exec('ps -ewwwo pid,%cpu,%mem,comm', (error, stdout, stderr) => {
      if (error) {
        console.error(error)
      }
      const lines = stdout.split('\n')
      // Ditch the first line
      lines[0] = ''
      for (const line in lines) {
        const currentLine = lines[line].trim().replace(/\s+/g, ' ')
        const words = currentLine.split(' ')
        if (words.length == 4 && words.every(word => typeof word !== 'undefined')) {
          const pid = words[0]
          const cpu = words[1].replace(',', '.')
          const mem = words[2].replace(',', '.')
          const offset = pid.length + cpu.length + mem.length + 3
          let comm = currentLine.slice(offset)
          // If we're on Mac then remove the path
          if (/^darwin/.test(process.platform)) {
            comm = comm.split('/')
            comm = comm[comm.length - 1]
          } else {
            // Otherwise assume linux and remove the unnecessary /1 info like
            // you get on kworker
            comm = comm.split('/')
            comm = comm[0]
          }
          // If already exists, then add them together
          if (typeof stats[comm] !== 'undefined') {
            stats[comm] = {
              pid,
              cpu: parseFloat(stats[comm].cpu, 10) + parseFloat(cpu),
              mem: parseFloat(stats[comm].mem, 10) + parseFloat(mem),
              comm,
              count: parseInt(stats[comm].count, 10) + 1
            }
          } else {
            stats[comm] = {
              pid,
              cpu,
              mem,
              comm,
              count: 1
            }
          }
        }
      }
      const statsArray = []
      for (const stat in stats) {
        // Divide by number of CPU cores
        const cpuRounded = parseFloat(stats[stat].cpu / os.cpus().length).toFixed(1)
        const memRounded = parseFloat(stats[stat].mem).toFixed(1)
        statsArray.push({
          'Command': stats[stat].comm,
          'PID  ': stats[stat].pid,
          'Count': stats[stat].count,
          'CPU %': cpuRounded,
          'Memory %': memRounded,
          'cpu': stats[stat].cpu,
          'mem': stats[stat].mem // exact cpu for comparison
        })
      }
      statsArray.sort((a, b) => parseFloat(b[plugin.sort]) - parseFloat(a[plugin.sort]))

      plugin.currentValue = statsArray
      plugin.initialized = true
    })
  }
}
module.exports = exports = plugin
