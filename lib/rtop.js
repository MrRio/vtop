var Canvas  = require('drawille'),
    blessed = require('blessed'),
    Remote  = require('./remote'),
    VERSION = require('../package.json').version;

var stats = ['cpu', 'mem'];

var loadedTheme = {
  title: { fg: '#767150' },
  chart: 
   { fg: '#66D9EF',
     border: { type: 'line', fg: '#272823' } },
  table: 
   { fg: 'fg',
     items: { selected: { bg: "#F92672", fg: 'fg' }, item: { fg: 'fg' } },
     border: { type: 'line', fg: '#272823' } },
  footer: { fg: 'fg' }
}

var Rtop = function() {

  var screen,
      program,
      hosts,
      boxes     = {},
      charts    = {},
      remotes   = {},
      intervals = [];

  var graph_scale = 1;

  var size = {
    pixel: {
      width  : 0,
      height : 0
    },
    character: {
      width  : 0,
      height : 0
    }
  };

  // Private functions

  /**
   * Draw header
   * @param  {string} left  This is the text to go on the left
   * @param  {string} right This is the text for the right
   * @return {void}
   */
  var drawHeader = function() {
    var headerText = ' {bold}rtop{/bold}{white-fg}';
    var headerTextNoTags = ' rtop ';

    var header = blessed.text({
      top     : 'top',
      left    : 'left',
      width   : headerTextNoTags.length,
      height  : '1',
      fg      : loadedTheme.title.fg,
      content : headerText,
      tags    : true
    });

    var date = blessed.text({
      top     : 'top',
      right   : 0,
      width   : 8,
      height  : '1',
      align   : 'right',
      content : '',
      tags    : true
    });

    screen.append(header);
    screen.append(date);

    var zeroPad = function(input) {
      return ('0' + input).slice(-2);
    };

    var updateTime = function() {
      var time = new Date();
      date.setContent(zeroPad(time.getHours()) + ':' + zeroPad(time.getMinutes()) + ':' + zeroPad(time.getSeconds()) + ' ');
      screen.render();
    };

    updateTime();
    setInterval(updateTime, 1000);
  };

  /**
   * Draw the footer
   *
   * @todo This appears to break on some viewports
   */
  var drawFooter = function() {

    var commands = {
      'q': 'Quit'
    };

    var text = '';
    for (var c in commands) {
      var command = commands[c];
      text += '  {white-bg}{black-fg}' + c + '{/black-fg}{/white-bg} ' + command;
    }

    var footerRight = blessed.text({
      bottom  : '0',
      left    : '0%',
      width   : '100%',
      align   : 'right',
      tags    : true,
      content : text + ' ',
      fg      : loadedTheme.footer.fg
    });

    screen.append(footerRight);
  };

  /**
   * Repeats a string
   * @var string The string to repeat
   * @var integer The number of times to repeat
   * @return {string} The repeated chars as a string.
   */
  var stringRepeat = function(string, num) {
    if (num < 0) {
      return '';
    }
    return new Array(num + 1).join(string);
  };

  var updateHost = function(host, message) {
    for (var stat in boxes[host]) {
      boxes[host][stat].setContent(message);
    }
  }

  /**
   * This draws a chart
   * @param  {int} chartKey The key of the chart.
   * @return {string}       The text output to draw.
   */
  var drawChart = function(chart) {
    var c = chart.chart;
    c.clear();

    var dataPointsToKeep = 5000,
        current_value    = chart.remote[chart.stat]();

    if (!current_value) {
      if (chart.values.length > 0) 
        return 'Disconnected!';
      else
        return 'Waiting for data...';
    }

    var position = ++chart.position;
    chart.values[position] = current_value;

    var computeValue = function(input) {
      return chart.height - Math.floor(((chart.height + 1) / 100) * input) - 1;
    };

    if (position > dataPointsToKeep) {
      delete chart.values[position - dataPointsToKeep];
    }

    for (var pos in chart.values) {

      if (graph_scale >= 1 || (graph_scale < 1 && pos % (1 / graph_scale) == 0)) {
        var p = parseInt(pos, 10) + (chart.width - chart.values.length);
        // calculated x-value based on graph_scale
        var x = (p * graph_scale) + ((1 - graph_scale) * chart.width);

        // draws top line of chart
        if (p > 1 && computeValue(chart.values[pos - 1]) > 0) {
          c.set(x, computeValue(chart.values[pos - 1]));
        }

        // Start deleting old data points to improve performance
        // @todo: This is not be the best place to do this

        // fills all area underneath top line
        for (var y = computeValue(chart.values[pos - 1]); y < chart.height; y ++) {
          if (graph_scale > 1 && p > 0 && y > 0) {
            var current = computeValue(chart.values[pos - 1]),
              next = computeValue(chart.values[pos]),
              diff = (next - current) / graph_scale;

            // adds columns between data if graph is zoomed in, takes average where data is missing to make smooth curve
            for (var i = 0; i < graph_scale; i++) {
              c.set(x + i, y + (diff * i));
              for (var j = y + (diff * i); j < chart.height; j++) {
                c.set(x + i, j);
              }
            }
          } else if (graph_scale <= 1) {
            // magic number used to calculate when to draw a value onto the chart
            var allowedPValues = (chart.values.length - ((graph_scale * chart.values.length) + 1)) * -1;
            c.set(x, y);
          }
        }
      }
    }

    // Add percentage to top right of the chart by splicing it into the braille data
    var textOutput = c.frame().split("\n");
    var percent    = '   ' + current_value;
    textOutput[0]  = textOutput[0].slice(0, textOutput[0].length - 4) + '{white-fg}' + parseInt(percent).toString().slice(-3) + '%{/white-fg}';

    return textOutput.join("\n");
  };

  /**
   * Overall draw function, this should poll and draw results of
   * the loaded sensors.
   */
  var draw = function() {
    for (var host in remotes) {
      if (remotes[host].connected) {
        stats.forEach(function(stat) {
          boxes[host][stat].setContent(drawChart(charts[host][stat]));
        })
      }
    }

    screen.render();
  };

  var drawBoxes = function() {
    hosts.forEach(drawHostBoxes);
  }

  var drawHostBoxes = function(host, index) {
    if (!boxes[host])
      boxes[host] = {};

    if (boxes[host].cpu)
      screen.remove(boxes[host].cpu);
    if (boxes[host].mem)
      screen.remove(boxes[host].mem);

    var width   = (100 / hosts.length),
        padding = index * width;

    boxes[host].cpu = blessed.box({
      top     : 1,
      left    : padding + '%',
      width   : width + '%',
      height  : '50%',
      content : ' Connecting... ',
      label   : ' ' + host + ' cpu',
      tags    : true,
      fg      : loadedTheme.chart.fg,
      border  : loadedTheme.chart.border
    });

    screen.append(boxes[host].cpu);

    boxes[host].mem = blessed.box({
      top     : boxes[host].cpu.height + 1,
      left    : padding + '%',
      width   : width + '%',
      height  : boxes[host].cpu.height - 2,
      content : ' Connecting... ',
      label   : ' ' + host + ' mem',
      tags    : true,
      fg      : loadedTheme.chart.fg,
      border  : loadedTheme.chart.border
    });

    screen.append(boxes[host].mem);
  };

  var setupCharts = function() {
    hosts.forEach(setupHostCharts);
  }

  var setupHostCharts = function(host) {

    var cpu_box = boxes[host].cpu;
    size.pixel.width  = (cpu_box.width - 2) * 2;
    size.pixel.height = (cpu_box.height - 2) * 4;

    stats.forEach(function(stat) {

      var box    = boxes[host][stat],
          width  = (box.width - 3) * 2,
          height = ((box.height - 2) * 4),
          canvas = new Canvas(width, height);

      if (!charts[host])
        charts[host] = {};

      // If we're reconfiguring a plugin, then preserve the already recorded values
      var values = charts[host][stat] ? charts[host][stat].values : [];

      var chart = {
        position : 0,
        stat   : stat, 
        host   : host,
        chart  : canvas,
        values : values,
        remote : remotes[host],
        width  : width,
        height : height
      };

      charts[host][stat] = chart;
    });

  };

  // Public function (just the entry point)
  return {

    exit: function() {
      var count = Object.keys(remotes),
          done  = function(err) { --count || process.exit() };

      for (var host in remotes) {
        remotes[host].stop(done);
      }
    },

    init: function(host_list, opts) {
      if (!host_list.length || host_list.length == 0)
        throw new Error('Invalid host list: ' + host_list);

      hosts   = host_list;
      screen  = blessed.screen();
      program = blessed.program();

      var lastKey = '';

      screen.on('keypress', function(ch, key) {
        last_key = key.name;

        if (key.name == 'q')
          Rtop.exit()
      });

      process.on('SIGINT', Rtop.exit);

      drawHeader();
      drawFooter();

      hosts.forEach(function(host) {
        remotes[host] = new Remote(host, opts);
        remotes[host].start(function(err) {
          updateHost(host, err ? err.message : 'Connected!');
        });
      })

      drawBoxes();
      screen.on('resize', drawBoxes);

      setupCharts();
      screen.on('resize', setupCharts);

      intervals.push(setInterval(draw, 700));
    }
  };

}();

exports.start = Rtop.init;
