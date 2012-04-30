if (typeof module !== 'undefined') {
  var chai = require('chai');
  var Scheem = {
    interpreter: require('../scheem-interpreter.js')
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
    })
  });
});

suite('Scheem Interpreter', function () {
  suite('quote', function() {
    test('a number', function() {
      assert.deepEqual(
        evalScheem(['quote', 3], {}),
        3
      );
    });
    test('an atom', function() {
      assert.deepEqual(
        evalScheem(['quote', 'dog'], {}),
        'dog'
      );
    });
    test('a list', function() {
      assert.deepEqual(
        evalScheem(['quote', [1, 2, 3]], {}),
        [1, 2, 3]
      );
    });
  });

  suite('math', function() {
    test('addition', function() {
      assert.equal(
        evalScheem(['+', 2, 3], {}),
        5
      );
    });
    test('subtraction', function () {
      assert.equal(
        evalScheem(['-', 3, 2], {}),
        1
      );
    });
    test('multiplication', function () {
      assert.equal(
        evalScheem(['*', 2, 3], {}),
        6
      );
    });
    test('division', function () {
      assert.equal(
        evalScheem(['/', 6, 2], {}),
        3
      );
    });
  });

  suite('environment', function () {
    test('define', function () {
      var env = {};
      evalScheem(['define', 'x', 5], env);
      assert.deepEqual(
        env,
        {x: 5}
      );
    });
    test('set!', function () {
      var env = {x: 5};
      evalScheem(['set!', 'x', 7], env);
      assert.deepEqual(
        env,
        {x: 7}
      );
    });
    test('reference', function () {
      var env = {x: 5};
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
                    ['define', 'x', 5],
                    ['+', 'x', 7]], {}),
        12
      );
    });
  });

  suite('conditional', function () {
    test('equal true', function () {
      assert.equal(
        evalScheem(['=', 5, 5], {}),
        '#t'
      )
    });
    test('equal false', function () {
      assert.equal(
        evalScheem(['=', 2, 3], {}),
        '#f'
      );
    });
    test('less than true', function () {
      assert.equal(
        evalScheem(['<', 5, 7], {}),
        '#t'
      )
    });
    test('less than false', function () {
      assert.equal(
        evalScheem(['<', 3, 2], {}),
        '#f'
      );
    });
  });

  suite('branch', function () {
    test('if true', function () {
      assert.equal(
        evalScheem(['if', ['quote', '#t'], 1, 2], {}),
        1
      );
    });
    test('if false', function () {
      assert.equal(
        evalScheem(['if', ['quote', '#f'], 1, 2], {}),
        2
      );
    });
  });

  suite('list processing', function () {
    test('cons', function () {
      assert.deepEqual(
        evalScheem(['cons', 1, ['quote', [2, 3]]], {}),
        [1, 2, 3]
      );
    });
    test('car', function () {
      assert.deepEqual(
        evalScheem(['car', ['quote', [1, 2, 3]]], {}),
        1
      );
    });
    test('cdr', function () {
      assert.deepEqual(
        evalScheem(['cdr', ['quote', [1, 2, 3]]], {}),
        [2, 3]
      );
    });
  });
});