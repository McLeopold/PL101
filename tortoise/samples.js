var Scheem = Scheem || {};
Scheem.samples = (function () {
  var samples = {
    'factorial': [[
      '(begin',
      '  (define factorial',
      '    (lambda x',
      '      (if (= x 0)',
      '          1',
      '          (* x (factorial (-x 1))))))',
      '',
      '  (factorial 5) ;; 120',
      ')'
    ], 120],
    'account': [[
    ], undefined]
  };
  for (var name in samples) { if (samples.hasOwnProperty(name)) {
    samples[name] = samples[name].join('\n');
  }}
  return samples;
}());
if (typeof module !== "undefined") { module.exports = Scheem.samples; }