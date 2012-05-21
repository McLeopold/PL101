var Scheem = Scheem || {};
Scheem.samples = (function () {
  var samples = {
    'forward': [[
      'forward(10);'
    ], undefined],
    'left': [[
      'left(90);'
    ], undefined],
    'rose': [[
      'repeat(18) {',
      '  right(20);',
      '  repeat(36) {',
      '    forward(20);',
      '    right(10);',
      '  }',
      '}'
    ], undefined],
    'square': [[
      'define square(x) {',
      '  repeat(4) {',
      '    forward(x);',
      '    right(90);',
      '  }',
      '}',
      '',
      'square(100);',
      'square(20);'
    ], undefined],
    'spiral': [[
      'define spiral(size) {',
      '  if (size < 30) {',
      '    forward(size);',
      '    right(15);',
      '    var newsize;',
      '    newsize := size * 1.02;',
      '    spiral(newsize);',
      '  }',
      '}',
      '',
      'spiral(5);'
    ], undefined],
    'tree': [[
      'define curve(angle1, angle2, scale, size, count) {',
      '  define draw_curve(size, count) {',
      '    if (count > 0) {',
      '      push();',
      '      forward(size);',
      '      left(angle1);',
      '      draw_curve(size * scale, count - 1);',
      '      right(angle2);',
      '      draw_curve(size * scale * scale, count - 1);',
      '      pop();',
      '    }',
      ' }',
      '  draw_curve(size, count);',
      '}',
      '',
      'up();',
      'backward(150);',
      'down();',
      'curve(33, 90, 0.80, 99, 9);'
    ], undefined],
  };
  for (var name in samples) { if (samples.hasOwnProperty(name)) {
    samples[name][0] = samples[name][0].join('\n');
  }}
  return samples;
}());
if (typeof module !== "undefined") { module.exports = Scheem.samples; }