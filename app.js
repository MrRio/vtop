'use strict'

const App = ((() => {
  // Load in required libs
  const Canvas = require('drawille')
  const blessed = require('blessed')
  const os = require('os')
  const cli = require('commander')
  const upgrade = require('./upgrade.js')
  const VERSION = require('./package.json').version
  const childProcess = require('child_process')
  const glob = require('glob')
  const path = require('path')
  let themes = ''
  let program = blessed.program()

  const files = glob.sync(path.join(__dirname, 'themes', '*.json'))
  for (var i = 0; i < files.length; i++) {
    let themeName = files[i].replace(path.join(__dirname, 'themes') + path.sep, '').replace('.json', '')
    themes += `${themeName}|`
  }
  themes = themes.slice(0, -1)

  // Set up the commander instance and add the required options
  cli
    .option('-t, --theme  [name]', `set the vtop theme [${themes}]`, 'parallax')
    .option('--no-mouse', 'Disables mouse interactivity')
    .option('--quit-after [seconds]', 'Quits vtop after interval', '0')
    .option('--update-interval [milliseconds]', 'Interval between updates', '300')
    .version(VERSION)
    .parse(process.argv)

  /**
   * Instance of blessed screen, and the charts object
   */
  let screen
  const charts = []
  let loadedTheme
  const intervals = []

  let upgradeNotice = false
  let disableTableUpdate = false
  let disableTableUpdateTimeout = setTimeout(() => {}, 0)

  let graphScale = 1

  // Private variables

  /**
   * This is the number of data points drawn
   * @type {Number}
   */
  let position = 0

  const size = {
    pixel: {
      width: 0,
      height: 0
    },
    character: {
      width: 0,
      height: 0
    }
  }

  // @todo: move this into charts array
  // This is an instance of Blessed Box
  let graph

  let graph2
  let processList
  let processListSelection

  // Private functions

  /**
   * Draw header
   * @param  {string} left  This is the text to go on the left
   * @param  {string} right This is the text for the right
   * @return {void}
   */
  const drawHeader = () => {
    let headerText
    let headerTextNoTags
    if (upgradeNotice) {
      upgradeNotice = `${upgradeNotice}`
      headerText = ` {bold}vtop{/bold}{white-fg} for ${os.hostname()} {red-bg} Press 'u' to upgrade to v${upgradeNotice} {/red-bg}{/white-fg}`
      headerTextNoTags = ` vtop for ${os.hostname()}  Press 'u' to upgrade to v${upgradeNotice} `
    } else {
      headerText = ` {bold}vtop{/bold}{white-fg} for ${os.hostname()} `
      headerTextNoTags = ` vtop for ${os.hostname()} `
    }

    const header = blessed.text({
      top: 'top',
      left: 'left',
      width: headerTextNoTags.length,
      height: '1',
      fg: loadedTheme.title.fg,
      content: headerText,
      tags: true
    })
    const date = blessed.text({
      top: 'top',
      right: 0,
      width: 9,
      height: '1',
      align: 'right',
      content: '',
      tags: true
    })
    const loadAverage = blessed.text({
      top: 'top',
      height: '1',
      align: 'center',
      content: '',
      tags: true,
      left: Math.floor(program.cols / 2 - (28 / 2))
    })
    screen.append(header)
    screen.append(date)
    screen.append(loadAverage)

    const zeroPad = input => (`0${input}`).slice(-2)

    const updateTime = () => {
      const time = new Date()
      date.setContent(`${zeroPad(time.getHours())}:${zeroPad(time.getMinutes())}:${zeroPad(time.getSeconds())} `)
      screen.render()
    }

    const updateLoadAverage = () => {
      const avg = os.loadavg()
      loadAverage.setContent(`Load Average: ${avg[0].toFixed(2)} ${avg[1].toFixed(2)} ${avg[2].toFixed(2)}`)
      screen.render()
    }

    updateTime()
    updateLoadAverage()
    setInterval(updateTime, 1000)
    setInterval(updateLoadAverage, 1000)
  }

  /**
   * Draw the footer
   *
   * @todo This appears to break on some viewports
   */
  const drawFooter = () => {
    const commands = {
      'dd': 'Kill process',
      'j': 'Down',
      'k': 'Up',
      'g': 'Jump to top',
      'G': 'Jump to bottom',
      'c': 'Sort by CPU',
      'm': 'Sort by Mem'
    }
    let text = ''
    for (const c in commands) {
      const command = commands[c]
      text += `  {white-bg}{black-fg}${c}{/black-fg}{/white-bg} ${command}`
    }
    text += '{|}http://parall.ax/vtop'
    const footerRight = blessed.box({
      width: '100%',
      top: program.rows - 1,
      tags: true,
      fg: loadedTheme.footer.fg
    })
    footerRight.setContent(text)
    screen.append(footerRight)
  }

  /**
   * Repeats a string
   * @var string The string to repeat
   * @var integer The number of times to repeat
   * @return {string} The repeated chars as a string.
   */
  const stringRepeat = (string, num) => {
    if (num < 0) {
      return ''
    }
    return new Array(num + 1).join(string)
  }

  /**
   * This draws a chart
   * @param  {int} chartKey The key of the chart.
   * @return {string}       The text output to draw.
   */
  const drawChart = chartKey => {
    const chart = charts[chartKey]
    const c = chart.chart
    c.clear()

    if (!charts[chartKey].plugin.initialized) {
      return false
    }

    const dataPointsToKeep = 5000

    charts[chartKey].values[position] = charts[chartKey].plugin.currentValue

    const computeValue = input => chart.height - Math.floor(((chart.height + 1) / 100) * input) - 1

    if (position > dataPointsToKeep) {
      delete charts[chartKey].values[position - dataPointsToKeep]
    }

    for (const pos in charts[chartKey].values) {
      if (graphScale >= 1 || (graphScale < 1 && pos % (1 / graphScale) === 0)) {
        const p = parseInt(pos, 10) + (chart.width - charts[chartKey].values.length)
        // calculated x-value based on graphScale
        const x = (p * graphScale) + ((1 - graphScale) * chart.width)

        // draws top line of chart
        if (p > 1 && computeValue(charts[chartKey].values[pos - 1]) > 0) {
          c.set(x, computeValue(charts[chartKey].values[pos - 1]))
        }

        // Start deleting old data points to improve performance
        // @todo: This is not be the best place to do this

        // fills all area underneath top line
        for (let y = computeValue(charts[chartKey].values[pos - 1]); y < chart.height; y++) {
          if (graphScale > 1 && p > 0 && y > 0) {
            const current = computeValue(charts[chartKey].values[pos - 1])
            const next = computeValue(charts[chartKey].values[pos])
            const diff = (next - current) / graphScale

            // adds columns between data if graph is zoomed in, takes average where data is missing to make smooth curve
            for (let i = 0; i < graphScale; i++) {
              c.set(x + i, y + (diff * i))
              for (let j = y + (diff * i); j < chart.height; j++) {
                c.set(x + i, j)
              }
            }
          } else if (graphScale <= 1) {
            // magic number used to calculate when to draw a value onto the chart
            // @TODO: Remove this?
            // var allowedPValues = (charts[chartKey].values.length - ((graphScale * charts[chartKey].values.length) + 1)) * -1
            c.set(x, y)
          }
        }
      }
    }

    // Add percentage to top right of the chart by splicing it into the braille data
    const textOutput = c.frame().split('\n')
    const percent = `   ${chart.plugin.currentValue}`
    textOutput[0] = `${textOutput[0].slice(0, textOutput[0].length - 4)}{white-fg}${percent.slice(-3)}%{/white-fg}`

    return textOutput.join('\n')
  }

  /**
   * Draws a table.
   * @param  {int} chartKey The key of the chart.
   * @return {string}       The text output to draw.
   */
  const drawTable = chartKey => {
    const chart = charts[chartKey]
    const columnLengths = {}
    // Clone the column array
    const columns = chart.plugin.columns.slice(0)
    columns.reverse()
    let removeColumn = false
    const lastItem = columns[columns.length - 1]

    const minimumWidth = 12
    let padding = 1

    if (chart.width > 50) {
      padding = 2
    }

    if (chart.width > 80) {
      padding = 3
    }
    // Keep trying to reduce the number of columns
    do {
      let totalUsed = 0
      let firstLength = 0
      // var totalColumns = columns.length
      // Allocate space for each column in reverse order
      for (const column in columns) {
        const item = columns[column]
        i++
        // If on the last column (actually first because of array order)
        // then use up all the available space
        if (item === lastItem) {
          columnLengths[item] = chart.width - totalUsed
          firstLength = columnLengths[item]
        } else {
          columnLengths[item] = item.length + padding
        }
        totalUsed += columnLengths[item]
      }
      if (firstLength < minimumWidth && columns.length > 1) {
        totalUsed = 0
        columns.shift()
        removeColumn = true
      } else {
        removeColumn = false
      }
    } while (removeColumn)

    // And back again
    columns.reverse()
    let titleOutput = '{bold}'
    for (const headerColumn in columns) {
      var colText = ` ${columns[headerColumn]}`
      titleOutput += (colText + stringRepeat(' ', columnLengths[columns[headerColumn]] - colText.length))
    }
    titleOutput += '{/bold}' + '\n'

    const bodyOutput = []
    for (const row in chart.plugin.currentValue) {
      const currentRow = chart.plugin.currentValue[row]
      let rowText = ''
      for (const bodyColumn in columns) {
        let colText = ` ${currentRow[columns[bodyColumn]]}`
        rowText += (colText + stringRepeat(' ', columnLengths[columns[bodyColumn]] - colText.length)).slice(0, columnLengths[columns[bodyColumn]])
      }
      bodyOutput.push(rowText)
    }
    return {
      title: titleOutput,
      body: bodyOutput,
      processWidth: columnLengths[columns[0]]
    }
  }

  // This is set to the current items displayed
  let currentItems = []
  let processWidth = 0
  /**
   * Overall draw function, this should poll and draw results of
   * the loaded sensors.
   */
  const draw = () => {
    position++

    const chartKey = 0
    graph.setContent(drawChart(chartKey))
    graph2.setContent(drawChart(chartKey + 1))

    if (!disableTableUpdate) {
      const table = drawTable(chartKey + 2)
      processList.setContent(table.title)

      // If we keep the stat numbers the same immediately, then update them
      // after, the focus will follow. This is a hack.

      const existingStats = {}
      // Slice the start process off, then store the full stat,
      // so we can inject the same stat onto the new order for a brief render
      // cycle.
      for (var stat in currentItems) {
        var thisStat = currentItems[stat]
        existingStats[thisStat.slice(0, table.processWidth)] = thisStat
      }
      processWidth = table.processWidth
      // Smush on to new stats
      const tempStats = []
      for (let stat in table.body) {
        let thisStat = table.body[stat]
        tempStats.push(existingStats[thisStat.slice(0, table.processWidth)])
      }
      // Move cursor position with temp stats
      // processListSelection.setItems(tempStats);

      // Update the numbers
      processListSelection.setItems(table.body)

      processListSelection.focus()

      currentItems = table.body
    }

    screen.render()
  }

  // Public function (just the entry point)
  return {

    init () {
      let theme
      if (typeof process.theme !== 'undefined') {
        theme = process.theme
      } else {
        theme = cli.theme
      }
      /**
       * Quits running vtop after so many seconds
       * This is mainly for perf testing.
       */
      if (cli['quitAfter'] !== '0') {
        setTimeout(() => {
          process.exit(0)
        }, parseInt(cli['quitAfter'], 10) * 1000)
      }

      try {
        loadedTheme = require(`./themes/${theme}.json`)
      } catch (e) {
        console.log(`The theme '${theme}' does not exist.`)
        process.exit(1)
      }
      // Create a screen object.
      screen = blessed.screen()

      // Configure 'q', esc, Ctrl+C for quit
      let upgrading = false

      const doCheck = () => {
        upgrade.check(v => {
          upgradeNotice = v
          drawHeader()
        })
      }

      doCheck()
      // Check for updates every 5 minutes
      // setInterval(doCheck, 300000);

      let lastKey = ''

      screen.on('keypress', (ch, key) => {
        if (key === 'up' || key === 'down' || key === 'k' || key === 'j') {
          // Disable table updates for half a second
          disableTableUpdate = true
          clearTimeout(disableTableUpdateTimeout)
          disableTableUpdateTimeout = setTimeout(() => {
            disableTableUpdate = false
          }, 1000)
        }

        if (
          upgrading === false &&
          (
            key.name === 'q' ||
            key.name === 'escape' ||
            (key.name === 'c' && key.ctrl === true)
          )
        ) {
          return process.exit(0)
        }
        // dd killall
        // @todo: Factor this out
        if (lastKey === 'd' && key.name === 'd') {
          let selectedProcess = processListSelection.getItem(processListSelection.selected).content
          selectedProcess = selectedProcess.slice(0, processWidth).trim()

          childProcess.exec(`killall "${selectedProcess}"`, () => {})
        }

        if (key.name === 'c' && charts[2].plugin.sort !== 'cpu') {
          charts[2].plugin.sort = 'cpu'
          charts[2].plugin.poll()
          setTimeout(() => {
            processListSelection.select(0)
          }, 200)
        }
        if (key.name === 'm' && charts[2].plugin.sort !== 'mem') {
          charts[2].plugin.sort = 'mem'
          charts[2].plugin.poll()
          setTimeout(() => {
            processListSelection.select(0)
          }, 200)
        }
        lastKey = key.name

        if (key.name === 'u' && upgrading === false) {
          upgrading = true
          // Clear all intervals
          for (const interval in intervals) {
            clearInterval(intervals[interval])
          }
          processListSelection.detach()
          program = blessed.program()
          program.clear()
          program.disableMouse()
          program.showCursor()
          program.normalBuffer()

          // @todo: show changelog  AND  smush existing data into it :D
          upgrade.install('vtop', [
            {
              'theme': theme
            }
          ])
        }

        if ((key.name === 'left' || key.name === 'h') && graphScale < 8) {
          graphScale *= 2
        } else if ((key.name === 'right' || key.name === 'l') && graphScale > 0.125) {
          graphScale /= 2
        }
      })

      drawHeader()

      // setInterval(drawHeader, 1000);
      drawFooter()

      graph = blessed.box({
        top: 1,
        left: 'left',
        width: '100%',
        height: '50%',
        content: '',
        fg: loadedTheme.chart.fg,
        tags: true,
        border: loadedTheme.chart.border
      })

      screen.append(graph)

      let graph2appended = false

      const createBottom = () => {
        if (graph2appended) {
          screen.remove(graph2)
          screen.remove(processList)
        }
        graph2appended = true
        graph2 = blessed.box({
          top: graph.height + 1,
          left: 'left',
          width: '50%',
          height: graph.height - 2,
          content: '',
          fg: loadedTheme.chart.fg,
          tags: true,
          border: loadedTheme.chart.border
        })
        screen.append(graph2)

        processList = blessed.box({
          top: graph.height + 1,
          left: '50%',
          width: screen.width - graph2.width,
          height: graph.height - 2,
          keys: true,
          mouse: cli.mouse,
          fg: loadedTheme.table.fg,
          tags: true,
          border: loadedTheme.table.border
        })
        screen.append(processList)

        processListSelection = blessed.list({
          height: processList.height - 3,
          top: 1,
          width: processList.width - 2,
          left: 0,
          keys: true,
          vi: true,
          search (jump) {
            // @TODO
            // jump('string of thing to jump to');
          },
          style: loadedTheme.table.items,
          mouse: cli.mouse
        })
        processList.append(processListSelection)
        processListSelection.focus()
        screen.render()
      }

      screen.on('resize', () => {
        createBottom()
      })
      createBottom()

      screen.append(graph)
      screen.append(processList)

      // Render the screen.
      screen.render()

      const setupCharts = () => {
        size.pixel.width = (graph.width - 2) * 2
        size.pixel.height = (graph.height - 2) * 4

        const plugins = ['cpu', 'memory', 'process']

        for (const plugin in plugins) {
          let width
          let height
          let currentCanvas
          // @todo Refactor this
          switch (plugins[plugin]) {
            case 'cpu':
              width = (graph.width - 3) * 2
              height = (graph.height - 2) * 4
              currentCanvas = new Canvas(width, height)
              break
            case 'memory':
              width = (graph2.width - 3) * 2
              height = ((graph2.height - 2) * 4)
              currentCanvas = new Canvas(width, height)
              break
            case 'process':
              width = processList.width - 3
              height = processList.height - 2
              break
          }

          // If we're reconfiguring a plugin, then preserve the already recorded values
          let values
          if (typeof charts[plugin] !== 'undefined' && typeof charts[plugin].values !== 'undefined') {
            values = charts[plugin].values
          } else {
            values = []
          }
          charts[plugin] = {
            chart: currentCanvas,
            values,
            plugin: require(`./sensors/${plugins[plugin]}.js`),
            width,
            height
          }
          charts[plugin].plugin.poll()
        }
        // @TODO Make this less hard-codey
        graph.setLabel(` ${charts[0].plugin.title} `)
        graph2.setLabel(` ${charts[1].plugin.title} `)
        processList.setLabel(` ${charts[2].plugin.title} `)
      }

      setupCharts()
      screen.on('resize', setupCharts)
      intervals.push(setInterval(draw, parseInt(cli['updateInterval'], 10)))

      // @todo Make this more sexy
      intervals.push(setInterval(charts[0].plugin.poll, charts[0].plugin.interval))
      intervals.push(setInterval(charts[1].plugin.poll, charts[1].plugin.interval))
      intervals.push(setInterval(charts[2].plugin.poll, charts[2].plugin.interval))
    }
  }
})())

App.init()
