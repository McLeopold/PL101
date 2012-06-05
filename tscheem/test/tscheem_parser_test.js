if (typeof module !== 'undefined') {
  var chai = require('chai');
  var parse = require('../tscheem_parser.js').parse;
} else {
  var parse = TScheem.parser.parse;
}
var assert = chai.assert;
var expect = chai.expect;

suite('TScheem Parser', function(){
  suite('simple', function(){
    test('atom', function(){
      assert.deepEqual(
        parse("a"),
        'a'
      );
    });
    test('integer', function(){
      assert.deepEqual(
        parse("1"),
        1
      );
    });
    test('atomlist', function(){
      assert.deepEqual(
        parse("(f x)"),
        ['f', 'x']
      );
    });
  });
  suite('curry', function(){
    test('list of 3', function(){
      assert.deepEqual(
        parse("(f x y)"),
        [['f', 'x'], 'y']
      );
    });
  });
});