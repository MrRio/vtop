T = require '../TermUI'
T.enableMouse()
T.hideCursor()

T.clear()

# First Row
b7 = new T.Button
  bounds:
    x: 1
    y: 1
    w: 20
    h: 3
  label: 'hello 7'
  labelAnchor: 7
b7.draw()

b8 = new T.Button
  bounds:
    x: 22
    y: 1
    w: 20
    h: 3
  label: 'hello 8'
  labelAnchor: 8
b8.draw()

b9 = new T.Button
  bounds:
    x: 43
    y: 1
    w: 20
    h: 3
  label: 'hello 9'
  labelAnchor: 9
b9.draw()


# Second Row
b4 = new T.Button
  bounds:
    x: 1
    y: 5
    w: 20
    h: 3
  label: 'hello 4'
  labelAnchor: 4
b4.draw()

b5 = new T.Button
  bounds:
    x: 22
    y: 5
    w: 20
    h: 3
  label: 'hello 5'
  labelAnchor: 5
b5.draw()

b5.on 'mousedown', ->
  b5.bg = T.C.y
  b5.draw()

b5.on 'mouseup', ->
  b5.bg = T.C.b
  b5.draw()


b6 = new T.Button
  bounds:
    x: 43
    y: 5
    w: 20
    h: 3
  label: 'hello 6'
  labelAnchor: 6
b6.draw()


# Third Row
b1 = new T.Button
  bounds:
    x: 1
    y: 9
    w: 20
    h: 3
  label: 'hello 1'
  labelAnchor: 1
b1.draw()

b2 = new T.Button
  bounds:
    x: 22
    y: 9
    w: 20
    h: 3
  label: 'hello 2'
  labelAnchor: 2
b2.draw()

b3 = new T.Button
  bounds:
    x: 43
    y: 9
    w: 20
    h: 3
  label: 'hello 3'
  labelAnchor: 3
b3.draw()
