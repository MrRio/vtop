# node-bresenham

[Bresenham's line algorithm](http://en.wikipedia.org/wiki/Bresenham%27s_line_algorithm)
in node.

## Install

```
$ npm install bresenham
```

## Usage

### bresenham(x0, y0, x1, y1, fn)

Calls `fn` with points between `(x0, y0)` `(x1, y1)`.
The points have integer coordinates.

The algorithm uses no floating point arithmetics,
so it's considered to be fast. But JS numbers are not
integers, so I'm not sure whether this is a faster
approach than the naive algorithm or not.

## License

MIT
