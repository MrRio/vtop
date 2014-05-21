var bresenham = require('../');

describe('Bresenham', function() {
  it('should call the callback once with one point', function() {
    var called = 0;
    bresenham(0, 0, 0, 0, function() { called++; });
    called.should.equal(1);
  });
  it('should call the callback with every point', function() {
    var called = 0;
    bresenham(0, 0, 5, 0, function() { called++; });
    called.should.equal(6);
  });
});
