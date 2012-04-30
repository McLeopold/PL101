if (typeof module !== 'undefined') {
  var Scheem = {
    parser: require('./scheem-parser.js')
  };
}
var parse = Scheem.parser.parse;

var Scheem = Scheem || {};
Scheem.interpreter = (function () {
  var evalScheemString = function (prg, env) {
    var expr = parse(prg);
    return evalScheem(expr, env);
  };

  var evalScheem = function (expr, env) {
    // Numbers evaluate to themselves
    if (typeof expr === 'number') {
      return expr;
    }
    if (typeof expr === 'string') {
      return env[expr];
    }
    // Look at head of list for operation
    switch (expr[0]) {
      case '+':
        return evalScheem(expr[1], env) +
               evalScheem(expr[2], env);
      case '-':
        return evalScheem(expr[1], env) -
               evalScheem(expr[2], env);
      case '*':
        return evalScheem(expr[1], env) *
               evalScheem(expr[2], env);
      case '/':
        return evalScheem(expr[1], env) /
               evalScheem(expr[2], env);
      case 'define':
        env[expr[1]] = evalScheem(expr[2], env);
        return 0;
      case 'set!':
        if (!env[expr[1]]) throw new Error("set! variable " + expr[1] + " not defined");
        env[expr[1]] = evalScheem(expr[2], env);
        return 0;
      case 'begin':
        var result = 0;
        for (var i = 1; i < expr.length; ++i) {
          result = evalScheem(expr[i], env);
        }
        return result;            
      case 'quote':
        if (expr.length !== 2) throw new Error("quote expects 1 parameter, got " + (expr.length - 1));
        return expr[1];
      case '=':
        var eq =
          (evalScheem(expr[1], env) ===
           evalScheem(expr[2], env));
        if (eq) return '#t';
        return '#f';
      case '<':
        var eq =
          (evalScheem(expr[1], env) <
           evalScheem(expr[2], env));
        if (eq) return '#t';
        return '#f';
      case 'cons':
        return [evalScheem(expr[1], env)].concat(evalScheem(expr[2], env));
      case 'car':
        return evalScheem(expr[1], env)[0];
      case 'cdr':
        return evalScheem(expr[1], env).slice(1);
      case 'if':
        var t = evalScheem(expr[1], env);
        if (t === '#t') {
          return evalScheem(expr[2], env);
        } else {
          return evalScheem(expr[3], env);
        }
      }
  };

  return {
    evalScheem: evalScheem,
    evalScheemString: evalScheemString
  };
}());
if (typeof module !== "undefined") { module.exports = Scheem.interpreter; }