if (typeof module !== 'undefined') {
  var chai = require('chai');
  var parse = require('../scheem_parser.js').parse;
} else {
  var parse = Tortoise.parser.parse;
}
var assert = chai.assert;
var expect = chai.expect;

suite('Tortoise Parser', function(){
  suite('simple', function(){
    test('atom', function(){
      assert.equal(
        parse("a"),
        'a'
      );
    });
    test('should return a list for "(a b c)"', function(){
      assert.deepEqual(
        parse("(a b c)"),
        ['a', 'b', 'c']
      );
    });
    test('should return a nested list for "(a (b))"', function(){
      assert.deepEqual(
        parse("(a(b))"),
        ['a', ['b']]
      );
    })
  });

  suite('whitespace', function(){
    test('should parse " ( a  b ) " successfully', function(){
      assert.ok(
        parse(" ( a  b ) ")
      );
    });
    test('should parse "( \\n a \\n b \\n ) " successfully', function(){
      assert.ok(
        parse("( \n a \n b \n ) ")
      );
    });
  });

  suite('quote', function(){
    test('should parse "\'x" as (quote x)', function(){
      assert.deepEqual(
        parse("'x"),
        ['quote', 'x']
      );
    });
    test('should parse "\'(1 2) as (quote (1 2))', function(){
      assert.deepEqual(
        parse("'(1 2)"),
        ['quote', [1, 2]]
      );
    });
  });
  
  suite('comment', function(){
    test('should parse ";;a\\n(1 ;;b\\n;;c 3\\n2\\n;; )\\n)" as (1 2)', function(){
      assert.deepEqual(
        parse(";;a\n(1 ;;b\n;;c 3\n2\n;; )\n)"),
        [1, 2]
      );
    });
  });

  suite('integer', function () {
    test('parse', function () {
      assert.deepEqual(
        parse('(1)'),
        [1]
      );
    });
  });
});
