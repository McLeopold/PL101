if (typeof module !== 'undefined') {
  var chai = require('chai');
  var parse = require('../elephant_parser.js').parse;
} else {
  var parse = Elephant.parser.parse;
}
var assert = chai.assert;
var expect = chai.expect;

suite('Elephant Parser', function(){
  suite('simple', function(){
    test('atom', function(){
      assert.equal(
        parse("+(1 2)"),
        3
      );
    });
  });
});
