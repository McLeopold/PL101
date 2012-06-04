if (typeof module !== 'undefined') {
  var chai = require('chai');
  var TScheem = {
    interpreter: require('../tscheem_interpreter.js'),
    samples: require('../tscheem_samples.js')
  };
}
var assert = chai.assert;
var expect = chai.expect;
var evalTScheem = TScheem.interpreter.evalTScheem;
var evalTScheemString = TScheem.interpreter.evalTScheemString;
var typeTScheemString = TScheem.interpreter.typeTScheemString;
var basetype = TScheem.interpreter.basetype;
var arrowtype = TScheem.interpreter.arrowtype;

suite('TScheem Type Checker', function(){
  suite('base types', function(){
    test('integer', function(){
      assert.deepEqual(
        typeTScheemString('1'),
        basetype('number')
      );
    });
    test('boolean', function(){
      assert.deepEqual(
        typeTScheemString('#t'),
        basetype('boolean')
      );
    });
    test('identifier', function(){
      assert.deepEqual(
        typeTScheemString('x', {bindings: {},
                                types: {'x': basetype('number')},
                                outer: {}}),
        basetype('number')
      );
    });
    test('function', function(){
      assert.deepEqual(
        typeTScheemString('+'),
        arrowtype(basetype('number'), arrowtype(basetype('number'), basetype('number')))
      );
    });
    test('define', function(){
      assert.deepEqual(
        typeTScheemString('(begin (define x number 5) x)'),
        basetype('number')
      );
    });
  });
  suite('bad types', function(){
    test('((+ 2) #f)', function () {
      expect(function () {
        typeTScheemString('((+ 1) #f)');
      }).to.throw();
    });
    test('((+ #t) 2)', function () {
      expect(function () {
        typeTScheemString('((+ 1) #f)');
      }).to.throw();
    });
  });
});    