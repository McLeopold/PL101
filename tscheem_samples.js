var TScheem = TScheem || {};
TScheem.samples = {

  'factorial': [
    [
      '(begin',
      '  (define factorial (number -> number)',
      '    (lambda-one x number',
      '      (if ((== x) 0)',
      '          1',
      '          ((* x) (factorial (- x 1))))))',
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
      ' (define acc (number -> (number -> number))',
      '  (lambda-one n number',
      '              (lambda-one i number',
      '                          (begin',
      '                           (set! n (+ n i))',
      '                           n))))',
      '',
      ' (define act (acc 7))',
      '',
      ' (act 5)',
      ' (act 3)',
      ')',
    ].join('\n')
  , []
  , 15
  ]

};
if (typeof module !== "undefined") { module.exports = TScheem.samples; }