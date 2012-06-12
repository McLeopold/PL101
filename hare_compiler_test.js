if (typeof module !== 'undefined') {
  var chai = require('chai');
  var Hare = {
    parser: require('../hare_parser.js'),
    compiler: require('../hare_compiler.js'),
    samples: require('../hare_samples.js'),
  };
} else {
  var parse = Hare.parser.parse;
}
var assert = chai.assert;
var expect = chai.expect;
var parse = Hare.parser.parse;
var compileExpr = Hare.compiler.compileExpr;
var compileStatement = Hare.compiler.compileStatement;
var compileStatements = Hare.compiler.compileStatements;
var lookup = Hare.compiler.lookup;

suite('parse', function() {
    test('numbers', function() {
        assert.deepEqual(parse('42', 'number'), 42);
        assert.deepEqual(parse('-101', 'number'), -101);
        assert.deepEqual(parse('-101.25', 'number'), -101.25);
    });
    test('identifiers', function() {
        assert.deepEqual(parse('x', 'identifier'), 'x');
        assert.deepEqual(parse('forward', 'identifier'), 'forward');
    });
    test('expressions', function() {
        var res =
            {
               "tag": "+",
               "left": {
                  "tag": "ident",
                  "name": "x"
               },
               "right": {
                  "tag": "*",
                  "left": 2,
                  "right": {
                     "tag": "ident",
                     "name": "y"
                  }
               }
            };
        assert.deepEqual(parse('x+2*y', 'expression'), res);
        assert.deepEqual(parse('x + 2*y', 'expression'), res);
        assert.deepEqual(parse('x+ (2 *\ny)', 'expression'), res);
    });
    test('statement', function() {
        var res = { tag:"ignore", body:
            {
               "tag": "+",
               "left": {
                  "tag": "ident",
                  "name": "x"
               },
               "right": {
                  "tag": "*",
                  "left": 2,
                  "right": {
                     "tag": "ident",
                     "name": "y"
                  }
               }
            } };
        assert.deepEqual(parse('x + 2*y;', 'statement'), res);
    });
    test('statements', function() {
        var res = [ 
            { tag: 'ignore', body: 3 },
            { tag: 'ignore', body: 5 } ];
        assert.deepEqual(parse('3;\n5;', 'statements'), res);
    });
    test('function application', function() {
        var res;
        res = { tag: "call", name: "f", args: [] };
        assert.deepEqual(parse('f()', 'expression'), res);
        res = { tag: "call", name: "f", args: [3] };
        assert.deepEqual(parse('f(3)', 'expression'), res);
        res = { tag: "call", name: "f", args: [3, 5] };
        assert.deepEqual(parse('f(3, 5)', 'expression'), res);
    });
    test('less than', function() {
        var res =
            {
               "tag": "<",
               "left": {
                  "tag": "ident",
                  "name": "x"
               },
               "right": 20
            };
        assert.deepEqual(parse('x < 20', 'expression'), res);        
    });
    test('if', function() {
        var txt = 'if(x<20) {\n  x:=x+3;\n}';
        var res =
            [
               {
                  "tag": "if",
                  "expr": {
                     "tag": "<",
                     "left": {
                        "tag": "ident",
                        "name": "x"
                     },
                     "right": 20
                  },
                  "body": [
                     {
                        "tag": ":=",
                        "left": "x",
                        "right": {
                           "tag": "+",
                           "left": {
                              "tag": "ident",
                              "name": "x"
                           },
                           "right": 3
                        }
                     }
                  ]
               }
            ];
        assert.deepEqual(parse(txt), res);
    });
    test('var', function() {
        var res =
            [
               {
                  "tag": "var",
                  "name": "x"
               },
               {
                  "tag": ":=",
                  "left": "x",
                  "right": 3
               }
            ];
        assert.deepEqual(parse("var x;\nx := 3;\n", 'statements'), res);
    });
    test('define', function() {
        var txt = "define foo(x, y) {\n}";
        var res =
            [
               {
                  "tag": "define",
                  "name": "foo",
                  "args": [
                     "x",
                     "y"
                  ],
                  "body": []
               }
            ];
        assert.deepEqual(parse(txt, 'statements'), res);
    });
    test('repeat', function() {
        var txt = "repeat(4) {}";
        var res =
            [
               {
                  "tag": "repeat",
                  "expr": 4,
                  "body": []
               }
            ];
        assert.deepEqual(parse(txt, 'statements'), res);
    });
    test('spiral example', function() {
        var txt = (
            'define spiral(size) {' +
            '    if (size < 30) {' +
            '        fd(size);' +
            '        rt(15);' +
            '        var newsize;' +
            '        newsize := size * 1.02;' +
            '        spiral(newsize);' +
            '    }' +
            '}');
        var res =
             {
                  "tag": "define",
                  "name": "spiral",
                  "args": [
                     "size"
                  ],
                  "body": [
                     {
                        "tag": "if",
                        "expr": {
                           "tag": "<",
                           "left": {
                              "tag": "ident",
                              "name": "size"
                           },
                           "right": 30
                        },
                        "body": [
                           {
                              "tag": "ignore",
                              "body": {
                                 "tag": "call",
                                 "name": "fd",
                                 "args": [
                                    {
                                       "tag": "ident",
                                       "name": "size"
                                    }
                                 ]
                              }
                           },
                           {
                              "tag": "ignore",
                              "body": {
                                 "tag": "call",
                                 "name": "rt",
                                 "args": [
                                    15
                                 ]
                              }
                           },
                           {
                              "tag": "var",
                              "name": "newsize"
                           },
                           {
                              "tag": ":=",
                              "left": "newsize",
                              "right": {
                                 "tag": "*",
                                 "left": {
                                    "tag": "ident",
                                    "name": "size"
                                 },
                                 "right": 1.02
                              }
                           },
                           {
                              "tag": "ignore",
                              "body": {
                                 "tag": "call",
                                 "name": "spiral",
                                 "args": [
                                    {
                                       "tag": "ident",
                                       "name": "newsize"
                                    }
                                 ]
                              }
                           }
                        ]
                     }
                  ]
               };
        assert.deepEqual(parse(txt, 'statement'), res);
    });
});

suite('compileExpression', function () {
    var env = { bindings: 
        { a: ['a', 'b', ['c', 'd']], x: 5, y: 24,
          f: function(a) { return 3 * a + 1; } },
        outer: { bindings: {x: 3, z: 101}, outer: { } } };
    test('number', function () {
        var expr = parse('5', 'expression');
        assert.deepEqual(compileExpr(expr, env), 5);
    });
    test('2<3', function () {
        var expr = parse('2 < 3', 'expression');
        assert.deepEqual(compileExpr(expr, env), '(2)<(3)');
    });
    test('2>3', function () {
        var expr = parse('2 > 3', 'expression');
        assert.deepEqual(compileExpr(expr, env), '(2)>(3)');
    });
    test('2+2', function () {
        var expr = parse('2 + 2', 'expression');
        assert.deepEqual(compileExpr(expr, env), '(2)+(2)');
    });
    test('2+3*4', function () {
        var expr = parse('2 + 3 * 4', 'expression');
        assert.deepEqual(compileExpr(expr, env), '(2)+((3)*(4))');
    });
    test('(2+3)*4', function () {
        var expr = parse('(2 + 3) * 4', 'expression');
        assert.deepEqual(compileExpr(expr, env), '((2)+(3))*(4)');
    });
    test('inner ident x', function () {
        var expr = parse('x', 'expression');
        assert.deepEqual(compileExpr(expr, env), 'x');
    });
    test('outer ident z', function () {
        var expr = parse('z', 'expression');
        assert.deepEqual(compileExpr(expr, env), 'z');
    });
    test('x+y', function () {
        var expr = parse('x + y', 'expression');
        assert.deepEqual(compileExpr(expr, env), '(x)+(y)');
    });
    test('f(3)', function () {
        var expr = parse('f(3)', 'expression');
        assert.deepEqual(compileExpr(expr, env), 'f(3)');
    });
    test('f(f(3)+1)*2', function () {
        var expr = parse('f(f(3)+1)*2', 'expression');
        assert.deepEqual(compileExpr(expr, env), '(f((f(3))+(1)))*(2)');
    });
    test('array index a[0]', function () {
      var expr = parse('a[0]', 'expression');
      assert.deepEqual(compileExpr(expr, env), 'a');
    });
    test('array index a[2][1]', function () {
      var expr = parse('a[2][1]', 'expression');
      assert.deepEqual(compileExpr(expr, env), 'd');
    });
});

suite('compileStatement', function () {
    var env = { bindings: 
        {x: 5, y: 24, f: function(a) { return 3 * a + 1; } },
        outer: { bindings: {x: 3, z: 101}, outer: { } } };
    test('x;', function () {
        var stmt = parse('x;', 'statement');
        assert.deepEqual(compileStatement(stmt, env), '_res = (x);\n');
    });
    test('x := 3;', function () {
        var stmt = parse('x := 3;', 'statement');
        assert.deepEqual(compileStatement(stmt, env), '_res = (x = 3);\n');
    });
    test('x := f(3) + 1;', function () {
        var stmt = parse('x := f(3) + 1;', 'statement');
        assert.deepEqual(compileStatement(stmt, env), '_res = ((f(3))+(1));\n');
        assert.deepEqual(lookup(env, 'x'), 11);
    });
    test('declare var', function () {
        var stmt = parse('var a;', 'statement');
        assert.deepEqual(compileStatement(stmt, env), 0);
        assert.deepEqual(lookup(env, 'a'), 0);
    });
    test('repeat increment', function () {
        compileStatement(parse('x:=10;', 'statement'), env);
        var stmt = parse('repeat(4) { x := x + 1; }', 'statement');
        assert.deepEqual(compileStatement(stmt, env), 14);
        assert.deepEqual(lookup(env, 'x'), 14);
    });
    test('repeat two statements', function () {
        compileStatement(parse('x:=10;', 'statement'), env);
        var stmt = parse('repeat(4) { x := x + 1; y:=x;}', 'statement');
        assert.deepEqual(compileStatement(stmt, env), 14);
        assert.deepEqual(lookup(env, 'y'), 14);
    });
    test('simple if taken', function () {
        var stmt = parse('if(1 < 2) { x := 55; }', 'statement');
        assert.deepEqual(compileStatement(stmt, env), 55);
        assert.deepEqual(lookup(env, 'x'), 55);
    });
    test('simple if not taken', function () {
        var stmt = parse('if(2 < 1) { x := 77; }', 'statement');
        assert.deepEqual(compileStatement(stmt, env), undefined);
        assert.notDeepEqual(lookup(env, 'x'), 77);
    });
    test('simple define', function () {
        var stmt = parse('define g(a) { x:=a; } g(-3);', 'statements');
        assert.deepEqual(compileStatements(stmt, env), -3);
        assert.deepEqual(lookup(env, 'x'), -3);
    });
});

suite('compileStatements', function () {
    var env = { bindings: 
        {x: 5, y: 24, f: function(a) { return 3 * a + 1; } },
        outer: { bindings: {x: 3, z: 101}, outer: { } } };
    test('3; f(3);', function () {
        var stmt = parse('3; f(3);', 'statements');
        assert.deepEqual(compileStatements(stmt, env), 10);
    });
    test('simple define sequenced', function () {
        var stmt = parse('define g() {} 100;', 'statements');
        assert.deepEqual(compileStatements(stmt, env), 100);
    });
});