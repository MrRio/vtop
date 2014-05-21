util = require 'util'
tty = require 'tty'
{EventEmitter} = require 'events'
_ = require 'underscore'
_.mixin require 'underscore.string'

# ===============================================================[ TermUI ]====
module.exports = T = new class TermUI extends EventEmitter
  constructor: ->

    if tty.isatty process.stdin
      tty.setRawMode true
      process.stdin.resume()

      process.stdin.on 'keypress', @handleKeypress
      process.stdin.on 'data', @handleData

      if process.listeners('SIGWINCH').length is 0
        process.on 'SIGWINCH', @handleSizeChange

      @handleSizeChange()

      @enableMouse()
      @isTerm = true
    else
      @isTerm = false

  C: { k: 0, r: 1, g: 2, y: 3, b: 4, m: 5, c: 6, w: 7, x: 9 }

  S: { normal: 0, bold: 1, underline: 4, blink: 5, inverse: 8 }

  SYM: {
    star: '\u2605',
    check: '\u2714',
    x: '\u2718',
    triUp: '\u25b2',
    triDown: '\u25bc',
    triLeft: '\u25c0',
    triRight: '\u25b6',
    fn: '\u0192',
    arrowUp: '\u2191',
    arrowDown: '\u2193',
    arrowLeft: '\u2190',
    arrowRight: '\u2192'
  }

  handleSizeChange: =>
    winsize = process.stdout.getWindowSize()
    @width = winsize[1]
    @height = winsize[0]
    @emit 'resize', {w: @width, h: @height}

  out: (buf) ->
    if @isTerm
      process.stdout.write(buf)
    this

  hideCursor: ->
    @out '\x1b[?25l'

  showCursor: ->
    @out '\x1b[?25h'

  clear: ->
    @out '\x1b[2J'
    @home
    this

  pos: (x, y) ->
    x = if x < 0 then @width - x else x
    y = if y < 0 then @height - y else y
    x = Math.max(Math.min(x, @width), 1)
    y = Math.max(Math.min(y, @height), 1)
    @out "\x1b[#{y};#{x}H"
    this

  home: ->
    @pos 1, 1
    this

  end: ->
    @pos 1, -1
    this

  fg: (c) ->
    @out "\x1b[3#{c}m"
    this

  bg: (c) ->
    @out "\x1b[4#{c}m"
    this

  hifg: (c) ->
    @out "\x1b[38;5;#{c}m"
    this

  hibg: (c) ->
    @out "\x1b[48;5;#{c}m"
    this

  enableMouse: ->
    @out '\x1b[?1000h'
    @out '\x1b[?1002h'
    this

  disableMouse: ->
    @out '\x1b[?1000l'
    @out '\x1b[?1002l'
    this

  eraseLine: ->
    @out '\x1b[2K'
    this

  handleKeypress: (c, key) =>
    if (key && key.ctrl && key.name == 'c')
      @quit()
    else
      @emit 'keypress', c, key

  handleData: (d) =>
    eventData = {}
    buttons = [ 'left', 'middle', 'right' ]

    if d[0] is 0x1b and d[1] is 0x5b && d[2] is 0x4d # mouse event

      switch (d[3] & 0x60)

        when 0x20 # button
          if (d[3] & 0x3) < 0x3
            event = 'mousedown'
            eventData.button = buttons[ d[3] & 0x3 ]
          else
            event = 'mouseup'

        when 0x40 # drag
          event = 'drag'
          if (d[3] & 0x3) < 0x3
            eventData.button = buttons[ d[3] & 0x3 ]

        when 0x60 # scroll
          event = 'wheel'
          if d[3] & 0x1
            eventData.direction = 'down'
          else
            eventData.direction = 'up'

      eventData.shift = (d[3] & 0x4) > 0
      eventData.x = d[4] - 32
      eventData.y = d[5] - 32

      @emit event, eventData
      @emit 'any', event, eventData

  quit: ->
    @fg(@C.x).bg(@C.x)
    @disableMouse()
    @showCursor()
    tty.setRawMode(false)
    process.exit()


# ===============================================================[ Widget ]====
class T.Widget extends EventEmitter
  constructor: (@options = {}) ->
    @bounds = {
      x: @options.bounds?.x or 0
      y: @options.bounds?.y or 0
      w: @options.bounds?.w or 0
      h: @options.bounds?.h or 0
    }

    T.Widget.instances.unshift this

  draw: ->

  hitTest: (x, y) ->
    (@bounds.x <= x <= (@bounds.x + @bounds.w - 1)) and
    (@bounds.y <= y <= (@bounds.y + @bounds.h - 1))

T.Widget.instances = []

T.on 'any', (event, eventData) ->
  for widget in T.Widget.instances
    if widget.hitTest eventData.x, eventData.y
      eventData.target = widget
      widget.emit event, eventData

# ===============================================================[ Button ]====
class T.Button extends T.Widget
  constructor: (opts) ->
    super(opts)

    @fg = @options.fg ? T.C.w
    @bg = @options.fg ? T.C.b

    @label = @options.label ? ''

    # labelAnchor values correspond to the locations of the numbers on a
    # standard keyboard numpad
    # 7 8 9
    # 4 5 6
    # 1 2 3
    @labelAnchor = @options.labelAnchor ? 5

  draw: ->
    T.fg(@fg).bg(@bg).pos(@bounds.x, @bounds.y)

    align = ['lpad', 'rpad', 'center'][@labelAnchor % 3]
    labelStr = _[align] @label, @bounds.w, ' '

    if @bounds.h > 1
      emptyStr = _.pad ' ', @bounds.w, ' '

    switch ((@labelAnchor-1) / 3) | 0
      when 0 then labelRow = @bounds.y + @bounds.h - 1
      when 1 then labelRow = @bounds.y + (@bounds.h / 2) | 0
      when 2 then labelRow = @bounds.y

    for y in [(@bounds.y)..(@bounds.y + @bounds.h - 1)]
      T.pos @bounds.x, y
      if y is labelRow
        T.out labelStr
      else
        T.out emptyStr
    T.fg(T.C.x).bg(T.C.x).end()
