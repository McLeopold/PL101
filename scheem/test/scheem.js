var PEG = require('pegjs')
  , fs = require('fs')
  , should = require('should')
  , parse
;

describe('Scheem', function(){
  before(function(done){
    fs.readFile('scheem.peg', 'ascii', function(err, data) {
      parse = PEG.buildParser(data).parse;
      done();
    });
  });

  describe('simple', function(){
    it('should return an atom for "a"', function(){
      parse("a").should.eql('a');
    });
    it('should return a list for "(a b c)"', function(){
      parse("(a b c)").should.eql(['a', 'b', 'c']);
    });
    it('should return a nested list for "(a (b))"', function(){
      parse("(a(b))").should.eql(['a', ['b']]);
    })
  });

  describe('whitespace', function(){
    it('should parse " ( a  b ) " successfully', function(){
      parse(" ( a  b ) ").should.be.ok;
    });
    it('should parse "( \\n a \\n b \\n ) " successfully', function(){
      parse("( \n a \n b \n ) ").should.be.ok;
    });
  });

  describe('quote', function(){
    it('should parse "\'x" as (quote x)', function(){
      parse("'x").should.eql(['quote', 'x']);
    });
    it('should parse "\'(1 2) as (quote (1 2))', function(){
      parse("'(1 2)").should.eql(['quote', ['1', '2']]);
    });
  });
  
  describe('comment', function(){
    it('should parse ";;a\\n(1 ;;b\\n;;c 3\\n2\\n;; )\\n)" as (1 2)', function(){
      parse(";;a\n(1 ;;b\n;;c 3\n2\n;; )\n)").should.eql(['1', '2']);
    });
  });
});