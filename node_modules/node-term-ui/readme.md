TermUI
======

TermUI is a library for Node.js that makes it easier to create rich console
interfaces.

## General Usage

### Rendering

  - `out(text)` - prints text to the screen from the current cursor position
  - `clear()` - clears the screen
  - `pos(x,y)` - positions the cursor
  - `home()` - sends the cursor to the top left corner
  - `end()` - sends the cursor to the bottom right corner
  - `fg(color)` - sets the foreground color
  - `bg(color)` - sets the background color
  - `hifg(color)` - sets the foreground color for 256 color terminals
  - `hibg(color)` - sets the background color for 256 color terminals
  - `enableMouse()` - enables mouse event handling
  - `disableMouse()` - disables mouse event handling
  - `eraseLine()` - erases the entire line that the cursor is on
  - `hideCursor()` - hides the cursor
  - `showCursor()` - shows the cursor

The following will print "Hello, world!" at 10, 20 in the terminal in white text
on a red background:

```coffeescript
  TermUI.pos(10,20).fg(TermUI.C.w).bg(TermUI.C.w).out("Hello, world!")
```

As you can see, pretty much everything is chainable.

### Handy Rendering Shortcuts
The `C` object contains definitions for common colors so that you don't have
to remember the numeric values.

  - k: black
  - r: red
  - g: green
  - y: yellow
  - b: blue
  - m: magenta
  - c: cyan
  - w: white
  - x: the terminal's default color

The `S` object is similar: it contains the text style definitions -- normal,
bold, underline, blink, and inverse.

The `SYM` object contains shortcuts for some handy UTF8 characters: star, check
x, triUp, triDown, triLeft, triRight, fn, arrowUp, arrowDown, arrowLeft, and
arrowRight.

### Events
`resize` is fired when the user resizes their terminal. The listener receives
an object with 'w' and 'h' properties set to the new width and height of the
terminal.

`keypress` is fired when a key is pressed. This works just like the `keypress`
event on `process.stdin`

`mousedown, mouseup, drag, wheel` are all the mouse events that are fired. The
receiver is sent an object that contains which button was pressed, which direction
the wheel scrolled, the x/y location, and whether or not shift was pressed.


## Widgets

### Button

Buttons are simply clickable rectangular areas that can have a label on them.
Here's how to use one...

```coffeescript
	TermUI = require 'TermUI'

	TermUI.enableMouse()

	button = new TermUI.Button
		bounds:
			x: 0
			y: 0
			w: 30
			h: 3
			label: 'I am a banana!'
			labelAnchor: 5

	button.on 'mousedown', ->
		button.bg = TermUI.C.y
		button.draw()

	button.on 'mouseup', ->
		button.bg = TermUI.C.b
		button.draw()

	button.draw()
```
