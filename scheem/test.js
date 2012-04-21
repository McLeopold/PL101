var PEG = require('pegjs')
  , fs = require('fs')
  , parse
;

exports.setUp = function (callback) {
  if (!parse) {
    fs.readFile('scheem.peg', 'ascii', function(err, data) {
      parse = PEG.buildParser(data).parse;
      callback();
    });
  } else {
    callback();
  }
};

exports.tests = {
  simple: function (test) {
    test.deepEqual(parse("(a b c)"),
      [ 'a', 'b', 'c' ]
    );
    test.done();
  },
  nesting: function (test) {
    test.deepEqual(parse("(1 (2 (3)))"),
      [ '1',
        [ '2',
          [ '3' ]
        ]
      ]
    );
    test.done();
  },
  whitespace: function (test) {
    test.deepEqual(parse(" ( 1 ( 2 ) ) "),
      [ '1',
        [ '2' ]
      ]
    );
    test.done();
  },
  quote_atom: function (test) {
    test.deepEqual(parse("'x"),
      [ 'quote', 'x' ]
    )
    test.done();
  },
  quote_list: function (test) {
    test.deepEqual(parse("'(1 2 3)"),
      [ 'quote',
        [ '1', '2', '3' ]
      ]
    )
    test.done();
  },
  comment: function (test) {
    test.deepEqual(parse(";;a\n(1 ;;b\n;;c 3\n2\n;; )\n)"),
      [ '1', '2' ]
    );
    test.done();
  }
};