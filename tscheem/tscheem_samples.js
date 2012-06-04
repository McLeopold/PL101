var TScheem = TScheem || {};
TScheem.samples = {

  'factorial': [
    [
      '(begin',
      '  (= factorial',
      '    (fn x',
      '      (if (== x 0)',
      '          1',
      '          (* x (factorial (- x 1))))))',
      '',
      '  (factorial 5) ;; 120',
      ')'
    ].join('\n')
  , []
  , 120
  ],

  'account': [
    [
      '(begin',
      '  (= foo',
      '    (fn (n)',
      '      (fn (i) (begin',
      '        (set! n (+ n i))',
      '        n))))',
      '',
      '  (= bar (foo 7))',
      '',
      '  (alert (bar 5))',
      '  (alert (bar 3))',
      ')',
    ].join('\n')
  , []
  , 15
  ]

};
if (typeof module !== "undefined") { module.exports = TScheem.samples; }