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
      assert.equal(
        parse("a"),
        'a'
      );
    });
  });
});    