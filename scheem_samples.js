var Scheem = Scheem || {};
Scheem.samples = (function () {
  var samples = {
    'factorial': [[
      '(begin',
      '  (define factorial',
      '    (lambda x',
      '      (if (= x 0)',
      '          1',
      '          (* x (factorial (- x 1))))))',
      '',
      '  (factorial 5) ;; 120',
      ')'
    ], 120],
    'account': [[
      '(begin',
      '  (define foo',
      '    (lambda (n)',
      '      (lambda (i) (begin',
      '        (set! n (+ n i))',
      '        n))))',
      '',
      '  (define bar (foo 7))',
      '',
      '  (alert (bar 5))',
      '  (alert (bar 3))',
      ')',
    ], 15]
  };
  for (var name in samples) { if (samples.hasOwnProperty(name)) {
    samples[name][0] = samples[name][0].join('\n');
  }}
  return samples;
}());
if (typeof module !== "undefined") { module.exports = Scheem.samples; }