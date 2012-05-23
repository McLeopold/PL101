if (typeof module !== 'undefined') {
  var chai = require('chai');
  var Scheem = {
    interpreter: require('../scheem_interpreter.js'),
    samples: require('../scheem_samples.js')
  };
}
var assert = chai.assert;
var expect = chai.expect;
var evalScheem = Scheem.interpreter.evalScheem;
var evalScheemString = Scheem.interpreter.evalScheemString;

suite('Scheem Errors', function () {
  suite('set!', function () {
    test('not defined', function () {
      expect(function () {
        evalScheem(['set!', 'x', 5], {});
      }).to.throw();
    });
  });
  suite('quote', function () {
    test('nothing', function () {
      expect(function () {
        evalScheem(['quote'], {});
      }).to.throw();
    });
    test('extra', function () {
      expect(function () {
        evalScheem(['quote', 1, 2], {});
      }).to.throw();
    });
  });
});

suite('Scheem Run', function () {
  suite('parse and eval', function () {
    test('simple', function () {
      assert.equal(
        evalScheemString('(+ 1 2)', {}),
        3
      );
    });
    for (var name in Scheem.samples) { if (Scheem.samples.hasOwnProperty(name)){
      test(name, function (name) {
        return function () {
          assert.deepEqual(
            evalScheemString(Scheem.samples[name][0]),
            Scheem.samples[name][1]
          );
        }
      }(name));
    }}
  });
});

suite('Scheem Interpreter', function () {
  suite('alert', function () {
    test('alert', function () {
      assert.deepEqual(
        evalScheem(['alert', 42]),
        42
      );
    });
  });

  suite('function', function () {
    test('((fn x x) 5)', function () {
      assert.deepEqual(
        evalScheem([['fn', 'x', 'x'], 5]),
        5
      );
    });
    test('((fn x (+ x 1)) 5)', function () {
      assert.deepEqual(
        evalScheem([['fn', 'x', ['+', 'x', 1]], 5]),
        6
      );
    });
    test('(((fn x (fn y (+ x y))) 5) 3)', function () {
      assert.deepEqual(
        evalScheem([[['fn', 'x', ['fn', 'y', ['+', 'x', 'y']]],
                    5], 3]),
        8
      );
    });
    test('((fn (x y) (+ x y)) 5 3)', function () {
      assert.deepEqual(
        evalScheem([['fn', ['x', 'y'], ['+', 'x', 'y']], 5, 3]),
        8
      );
    });
    test('((fn () 42))', function () {
      assert.deepEqual(
        evalScheem([['fn', [], 42]]),
        42
      );
    });

    test('unknown function', function () {
      expect(function () {
        evalScheem(['unknown']);

      }).to.throw();
    });

    test('assert-args-0 with 0 arg', function () {
      assert.deepEqual(
        evalScheem(['assert-args-0']),
        '#t'
      );
    });
    test('assert-args-0 with 1 arg', function () {
      assert.deepEqual(
        evalScheem(['assert-args-0', 1]),
        '#f'
      );
    });
    test('assert-args-1 with 1 arg', function () {
      assert.deepEqual(
        evalScheem(['assert-args-1', 1]),
        '#t'
      );
    });
    test('assert-args-1 with 3 arg', function () {
      assert.deepEqual(
        evalScheem(['assert-args-1', 1, 2, 3]),
        '#f'
      );
    });
    test('assert-args-1 with 0 arg', function () {
      assert.deepEqual(
        evalScheem(['assert-args-1']),
        '#f'
      );
    });
    test('assert-args-2 with 2 arg', function () {
      assert.deepEqual(
        evalScheem(['assert-args-2', 1, 2]),
        '#t'
      );
    });
    test('assert-args-2 with 1 arg', function () {
      assert.deepEqual(
        evalScheem(['assert-args-2', 1]),
        '#f'
      );
    });
    test('assert-args-2 with 0 arg', function () {
      assert.deepEqual(
        evalScheem(['assert-args-2']),
        '#f'
      );
    });
  });

  suite('binding', function () {
    test('let-one', function () {
      assert.deepEqual(
        evalScheem(['let-one', 'x', 5, ['+', 'x', 3]]),
        8
      );
    });
    test('let', function () {
      assert.deepEqual(
        evalScheem(['let', [['x', 1], ['y', 2]], ['+', 'x', 'y']]),
        3
      );
    })
  });

  suite('quote', function() {
    test('a number', function() {
      assert.deepEqual(
        evalScheem(['quote', 3]),
        3
      );
    });
    test('an atom', function() {
      assert.deepEqual(
        evalScheem(['quote', 'dog']),
        'dog'
      );
    });
    test('a list', function() {
      assert.deepEqual(
        evalScheem(['quote', [1, 2, 3]]),
        [1, 2, 3]
      );
    });
  });

  suite('math', function() {
    test('addition', function() {
      assert.equal(
        evalScheem(['+', 2, 3]),
        5
      );
    });
    test('subtraction', function () {
      assert.equal(
        evalScheem(['-', 3, 2]),
        1
      );
    });
    test('multiplication', function () {
      assert.equal(
        evalScheem(['*', 2, 3]),
        6
      );
    });
    test('division', function () {
      assert.equal(
        evalScheem(['/', 6, 2]),
        3
      );
    });
  });

  suite('environment', function () {
    test('=', function () {
      var env = {bindings: {}, outer: {}};
      evalScheem(['=', 'x', 5], env);
      assert.deepEqual(
        env,
        {bindings: {'x': 5},
         outer: {}}
      );
    });
    test('set!', function () {
      var env = {bindings: {'x': 5},
                 outer: {}};
      evalScheem(['set!', 'x', 7], env);
      assert.deepEqual(
        env,
        {bindings: {'x': 7},
         outer: {}}
      );
    });
    test('reference', function () {
      var env = {bindings: {'x': 5},
                 outer: {}};
      assert.deepEqual(
        evalScheem(['+', 'x', 0], env),
        5
      );
    });
  });

  suite('imperative', function () {
    test('begin', function () {
      assert.deepEqual(
        evalScheem(['begin',
                    ['=', 'x', 5],
                    ['+', 'x', 7]]),
        12
      );
    });
  });

  suite('conditional', function () {
    test('equal true', function () {
      assert.equal(
        evalScheem(['==', 5, 5]),
        '#t'
      )
    });
    test('equal false', function () {
      assert.equal(
        evalScheem(['==', 2, 3]),
        '#f'
      );
    });
    test('less than true', function () {
      assert.equal(
        evalScheem(['<', 5, 7]),
        '#t'
      )
    });
    test('less than false', function () {
      assert.equal(
        evalScheem(['<', 3, 2]),
        '#f'
      );
    });
  });

  suite('branch', function () {
    test('if true', function () {
      assert.equal(
        evalScheem(['if', ['quote', '#t'], 1, 2]),
        1
      );
    });
    test('if false', function () {
      assert.equal(
        evalScheem(['if', ['quote', '#f'], 1, 2]),
        2
      );
    });
  });

  suite('list processing', function () {
    test('cons', function () {
      assert.deepEqual(
        evalScheem(['cons', 1, ['quote', [2, 3]]]),
        [1, 2, 3]
      );
    });
    test('car', function () {
      assert.deepEqual(
        evalScheem(['car', ['quote', [1, 2, 3]]]),
        1
      );
    });
    test('cdr', function () {
      assert.deepEqual(
        evalScheem(['cdr', ['quote', [1, 2, 3]]]),
        [2, 3]
      );
    });
  });
});
