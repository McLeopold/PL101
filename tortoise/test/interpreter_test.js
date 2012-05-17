if (typeof module !== 'undefined') {
  var chai = require('chai');
  var Tortoise = {
    interpreter: require('../scheem_interpreter.js'),
    samples: require('../samples.js')
  };
}
var assert = chai.assert;
var expect = chai.expect;
var evalTortoise = Tortoise.interpreter.evalTortoise;
var evalTortoiseString = Tortoise.interpreter.evalTortoiseString;

suite('Tortoise Errors', function () {
  suite('set!', function () {
    test('not defined', function () {
      expect(function () {
        evalTortoise(['set!', 'x', 5], {});
      }).to.throw();
    });
  });
  suite('quote', function () {
    test('nothing', function () {
      expect(function () {
        evalTortoise(['quote'], {});
      }).to.throw();
    });
    test('extra', function () {
      expect(function () {
        evalTortoise(['quote', 1, 2], {});
      }).to.throw();
    });
  });
});

suite('Tortoise Run', function () {
  suite('parse and eval', function () {
    test('simple', function () {
      assert.equal(
        evalTortoiseString('(+ 1 2)', {}),
        3
      );
    });
    for (var name in Tortoise.samples) { if (Tortoise.samples.hasOwnProperty(name)){
      test(name, function () {
        assert.deepEqual(
          evalTortoiseString(Tortoise.samples[name][0]),
          Tortoise.samples[name][1]
        );
      });
    }}
  });
});

suite('Tortoise Interpreter', function () {
  suite('alert', function () {
    test('alert', function () {
      assert.deepEqual(
        evalTortoise(['alert', 42], {}),
        42
      );
    });
  });

  suite('function', function () {
    test('((lambda x x) 5)', function () {
      assert.deepEqual(
        evalTortoise([['lambda', 'x', 'x'], 5], {}),
        5
      );
    });
    test('((lambda x (+ x 1)) 5)', function () {
      assert.deepEqual(
        evalTortoise([['lambda', 'x', ['+', 'x', 1]], 5], {}),
        6
      );
    });
    test('(((lambda x (lambda y (+ x y))) 5) 3)', function () {
      assert.deepEqual(
        evalTortoise([[['lambda', 'x', ['lambda', 'y', ['+', 'x', 'y']]],
                    5], 3], {}),
        8
      );
    });
    test('((lambda (x y) (+ x y)) 5 3)', function () {
      assert.deepEqual(
        evalTortoise([['lambda', ['x', 'y'], ['+', 'x', 'y']], 5, 3], {}),
        8
      );
    });
    test('((lambda () 42))', function () {
      assert.deepEqual(
        evalTortoise([['lambda', [], 42]], {}),
        42
      );
    });

    test('unknown function', function () {
      expect(function () {
        evalTortoise(['unknown'], {});

      }).to.throw();
    });

    test('assert-args-0 with 0 arg', function () {
      assert.deepEqual(
        evalTortoise(['assert-args-0'], {}),
        '#t'
      );
    });
    test('assert-args-0 with 1 arg', function () {
      assert.deepEqual(
        evalTortoise(['assert-args-0', 1]),
        '#f'
      );
    });
    test('assert-args-1 with 1 arg', function () {
      assert.deepEqual(
        evalTortoise(['assert-args-1', 1], {}),
        '#t'
      );
    });
    test('assert-args-1 with 3 arg', function () {
      assert.deepEqual(
        evalTortoise(['assert-args-1', 1, 2, 3]),
        '#f'
      );
    });
    test('assert-args-1 with 0 arg', function () {
      assert.deepEqual(
        evalTortoise(['assert-args-1']),
        '#f'
      );
    });
    test('assert-args-2 with 2 arg', function () {
      assert.deepEqual(
        evalTortoise(['assert-args-2', 1, 2], {}),
        '#t'
      );
    });
    test('assert-args-2 with 1 arg', function () {
      assert.deepEqual(
        evalTortoise(['assert-args-2', 1]),
        '#f'
      );
    });
    test('assert-args-2 with 0 arg', function () {
      assert.deepEqual(
        evalTortoise(['assert-args-2']),
        '#f'
      );
    });
  });

  suite('binding', function () {
    test('let-one', function () {
      assert.deepEqual(
        evalTortoise(['let-one', 'x', 5, ['+', 'x', 3]], {}),
        8
      );
    });
    test('let', function () {
      assert.deepEqual(
        evalTortoise(['let', [['x', 1], ['y', 2]], ['+', 'x', 'y']], {}),
        3
      );
    })
  });

  suite('quote', function() {
    test('a number', function() {
      assert.deepEqual(
        evalTortoise(['quote', 3], {}),
        3
      );
    });
    test('an atom', function() {
      assert.deepEqual(
        evalTortoise(['quote', 'dog'], {}),
        'dog'
      );
    });
    test('a list', function() {
      assert.deepEqual(
        evalTortoise(['quote', [1, 2, 3]], {}),
        [1, 2, 3]
      );
    });
  });

  suite('math', function() {
    test('addition', function() {
      assert.equal(
        evalTortoise(['+', 2, 3], {}),
        5
      );
    });
    test('subtraction', function () {
      assert.equal(
        evalTortoise(['-', 3, 2], {}),
        1
      );
    });
    test('multiplication', function () {
      assert.equal(
        evalTortoise(['*', 2, 3], {}),
        6
      );
    });
    test('division', function () {
      assert.equal(
        evalTortoise(['/', 6, 2], {}),
        3
      );
    });
  });

  suite('environment', function () {
    test('define', function () {
      var env = {};
      evalTortoise(['define', 'x', 5], env);
      assert.deepEqual(
        env,
        {name: 'x',
         value: 5,
         outer: {}}
      );
    });
    test('set!', function () {
      var env = {name: 'x',
                 value: 5,
                 outer: {}};
      evalTortoise(['set!', 'x', 7], env);
      assert.deepEqual(
        env,
        {name: 'x',
         value: 7,
         outer: {}}
      );
    });
    test('reference', function () {
      var env = {name: 'x',
                 value: 5,
                 outer: {}};
      assert.deepEqual(
        evalTortoise(['+', 'x', 0], env),
        5
      );
    });
  });

  suite('imperative', function () {
    test('begin', function () {
      assert.deepEqual(
        evalTortoise(['begin',
                    ['define', 'x', 5],
                    ['+', 'x', 7]], {}),
        12
      );
    });
  });

  suite('conditional', function () {
    test('equal true', function () {
      assert.equal(
        evalTortoise(['=', 5, 5], {}),
        '#t'
      )
    });
    test('equal false', function () {
      assert.equal(
        evalTortoise(['=', 2, 3], {}),
        '#f'
      );
    });
    test('less than true', function () {
      assert.equal(
        evalTortoise(['<', 5, 7], {}),
        '#t'
      )
    });
    test('less than false', function () {
      assert.equal(
        evalTortoise(['<', 3, 2], {}),
        '#f'
      );
    });
  });

  suite('branch', function () {
    test('if true', function () {
      assert.equal(
        evalTortoise(['if', ['quote', '#t'], 1, 2], {}),
        1
      );
    });
    test('if false', function () {
      assert.equal(
        evalTortoise(['if', ['quote', '#f'], 1, 2], {}),
        2
      );
    });
  });

  suite('list processing', function () {
    test('cons', function () {
      assert.deepEqual(
        evalTortoise(['cons', 1, ['quote', [2, 3]]], {}),
        [1, 2, 3]
      );
    });
    test('car', function () {
      assert.deepEqual(
        evalTortoise(['car', ['quote', [1, 2, 3]]], {}),
        1
      );
    });
    test('cdr', function () {
      assert.deepEqual(
        evalTortoise(['cdr', ['quote', [1, 2, 3]]], {}),
        [2, 3]
      );
    });
  });
});
