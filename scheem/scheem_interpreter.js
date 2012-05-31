if (typeof module !== 'undefined') {
  var Scheem = {
    parser: require('./scheem_parser.js')
  };
}
var parse = Scheem.parser.parse;

var Scheem = Scheem || {};
Scheem.interpreter = (function () {
  var evalScheemString = function (prg, env) {
    env = env || {bindings: {}, outer: {}};
    var expr = parse(prg);
    return evalScheem(expr, env);
  };

  var lookup = function (env, v) {
    if (env.bindings) {
      if (env.bindings.hasOwnProperty(v)) {
        return env.bindings[v];
      } else {
        return lookup(env.outer, v);
      }
    } else {
      if (initial_env.hasOwnProperty(v)) {
        return initial_env[v];
      } else {
        throw new Error('variable ' + v + ' not found');
      }
    }
  };

  var update = function (env, v, val) {
    if (env.bindings) {
      if (env.bindings.hasOwnProperty(v)) {
        env.bindings[v] = val;
      } else {
        update(env.outer, v, val);
      }
      return val;
    } else {
      throw new Error('variable ' + v + ' not defined');
    }
  };

  var add_binding = function (env, v, val) {
    if (!env.bindings) {
      env.bindings = {};
      env.outer = {};
    }
    return env.bindings[v] = val;
  };

  var initial_env = {
    'assert-args-0': function () {
      return arguments.length === 0 ? true : false;
    },
    'assert-args-1': function () {
      return arguments.length === 1 ? true : false;
    },
    'assert-args-2': function () {
      return arguments.length === 2 ? true : false;
    },
    // operators
    // access
    '.': function (x, y) {
      return x.y;
    },
    // unary
    '~': function (x) { return ~x; },
    // exponent
    '^': function (x, y) { return Math.pow(x, y); },
    // multiplication
    '*': function (x, y) { return x * y; },
    '/': function (x, y) { return x / y; },
    '//': function (x, y) { return Math.floor(x / y); },
    '%': function (x, y) { return x % y; },
    // addition / subtraction
    '+': function (x, y) {
      if (arguments.length === 2 )
        return x + y;
      else {
        var result = 0;
        for (var i = 0, ilen = arguments.length; i < ilen; ++i) {
          result += arguments[i];
        }
        return result;
      }
    },
    '++': function (x, y) { return x + y; },
    '-': function (x, y) { return x - y; },
    // bitshift
    '>>': function (x, y) { return x >> y; },
    '<<': function (x, y) { return x << y; },
    // bitwise
    '&': function (x, y) { return x & y; },
    '|': function (x, y) { return x | y; },
    '><': function (x, y) { return x ^ y; },
    // comparison
    '==': function (x, y) { return x === y ? true : false; },
    '!=': function (x, y) { return x !== y ? true : false; },
    '>': function (x, y) { return x > y ? true : false; },
    '<': function (x, y) { return x < y ? true : false; },
    '>=': function (x, y) { return x >= y ? true : false; },
    '<=': function (x, y) { return x <= y ? true : false; },
    '<=>': function (x, y) { return x < y ? -1 : (x === y ? 0 : 1); },
    'in': function (x, y) { return y.indexOf(x) >= 0 ? true : false; },
    // logical
    'not': function (x, y) { return x ^ y; },
    'and': function (x, y) { return x & y; },
    'or': function (x, y) { return x | y; },
    'xor': function (x, y) { return x ^ y; },
    // builtins
    'cons': function (x, y) { return [x].concat(y); },
    'car': function (x, y) { return x[0]; },
    'cdr': function (x, y) { x.shift(); return x; },
    'cdr': function (x, y) { return x.slice(1); },
    'alert': function (arg) {
      console.log(arg); return arg;
    }
  };

  var evalScheem = function (expr, env) {
    env = env || {bindings: {}, outer: {}};
    // Numbers evaluate to themselves
    if (typeof expr === 'number') {
      return expr;
    }
    if (typeof expr === 'string') {
      return lookup(env, expr);
    }
    // Look at head of list for operation
    switch (expr[0]) {
      case 'do':
        var result = 0;
        for (var i = 1; i < expr.length; ++i) {
          result = evalScheem(expr[i], env);
        }
        return result;
      case 'list':
        var result = [];
        for (var i = 0, ilen = expr[1].length; i < ilen; ++i) {
          result.push(evalScheem(expr[1][i], env));
        }
        return result;
      case 'set':
        var result = {};
        for (var i = 0, ilen = expr[1].length; i < ilen; ++i) {
          result[evalScheem(expr[1][i], env)] = true;
        }
        return result;
      case 'map':
        var result = {};
        for (var i = 0, ilen = expr[1].length; i < ilen; ++i) {
          result[evalScheem(expr[1][i][0], env)] = evalScheem(expr[1][i][1], env);
        }
        return result;
      case 'quote':
        if (expr.length !== 2) throw new Error("quote expects 1 parameter, got " + (expr.length - 1));
        return expr[1];
      case 'if':
        var t = evalScheem(expr[1], env);
        if (t === true) {
          return evalScheem(expr[2], env);
        } else {
          return evalScheem(expr[3], env);
        }
      case 'fn':
        return function () {
          env = {bindings: {}, outer: env};
          for (var i = 0, ilen = expr[1].length; i < ilen; ++i) {
            add_binding(env, expr[1][i], arguments[i]);
          }
          return evalScheem(expr[2], env);
        };
      case 'scope':
        return evalScheem(expr[1], {bindings: {}, outer: env});
      case 'let':
        for (var i = 0, ilen = expr[1].length; i < ilen; ++i) {
          add_binding(env, expr[1][i][0], evalScheem(expr[1][i][1]));
        }
        return evalScheem(expr[2], env);
      case '.':
        return evalScheem(expr[1])[expr[2]];
      case 'define':
      case ':=':
        return add_binding(env, expr[1], evalScheem(expr[2], env));
      case 'set!':
      case '=':
        return update(env, expr[1], evalScheem(expr[2], env));
      case '^=':
      case '*=':
      case '/=':
      case '%=':
      case '//=':
      case '+=':
      case '++=':
      case '-=':
      case '<<=':
      case '>>=':
      case '&=':
      case '|=':
      case '><=':
        var func = evalScheem(expr[0].slice(0, -1), env);
        var val = func.call(env, evalScheem(expr[1], env), evalScheem(expr[2], env))
        return update(env, expr[1], val);
      default:
        var func = evalScheem(expr[0], env);
        var args = [];
        for (var i = 1, ilen = expr.length; i < ilen; ++i) {
          args.push(evalScheem(expr[i], env));
        }
        return func.apply(env, args);
    }
  };

  return {
    evalScheem: evalScheem,
    evalScheemString: evalScheemString
  };
}());
if (typeof module !== "undefined") { module.exports = Scheem.interpreter; }
