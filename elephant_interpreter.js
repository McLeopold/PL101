if (typeof module !== 'undefined') {
  var Elephant = {
    parser: require('./elephant_parser.js')
  };
}
var parse = Elephant.parser.parse;

var Elephant = Elephant || {};
Elephant.interpreter = (function () {
  var evalProg = function (prg, env) {
    env = env || {bindings: {}, outer: {}};
    var expr = parse(prg);
    return evalExpr(expr, env);
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
    // operators
    // access
    '.': function (x, y) {
      return x[y];
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
      if (arguments.length === 2 ) {
        if (x instanceof Array) {
          for (var i = 0, ilen = y.length; i < ilen; ++i) {
            x.push(y[i]);
          }
          return x;
        } else {
          return x + y;
        }
      } else {
        var result = arguments[0];
        for (var i = 1, ilen = arguments.length; i < ilen; ++i) {
          if (result instanceof Array) {
            for (var i = 0, ilen = y.length; i < ilen; ++i) {
              result.push(y[i]);
            }
          } else {
            result += arguments[i];
          }          
        }
        return result;
      }
    },
    '++': function (x, y) { x.push(y); return x; },
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
    'len': function (x) { return x.length; },
    'alert': function (arg) {
      console.log(arg); return arg;
    },
    '#t': true,
    '#f': false
  };

  var evalExpr = function (expr, env) {
    env = env || {bindings: {}, outer: {}};
    // Look at head of list for operation
    if (expr instanceof Array) {
      if (expr.length === 0) {
        return expr;
      }
      switch (expr[0].value) {
        case 'do':
          var result = 0;
          for (var i = 1; i < expr.length; ++i) {
            result = evalExpr(expr[i], env);
          }
          return result;
        case 'list':
          var result = [];
          for (var i = 0, ilen = expr[1].length; i < ilen; ++i) {
            result.push(evalExpr(expr[1][i], env));
          }
          return result;
        case 'set':
          var result = {};
          for (var i = 0, ilen = expr[1].length; i < ilen; ++i) {
            result[evalExpr(expr[1][i], env)] = true;
          }
          return result;
        case 'map':
          var result = {};
          for (var i = 0, ilen = expr[1].length; i < ilen; ++i) {
            result[evalExpr(expr[1][i][0], env)] = evalExpr(expr[1][i][1], env);
          }
          return result;
        case 'quote':
          if (expr.length !== 2) throw new Error("quote expects 1 parameter, got " + (expr.length - 1));
          return expr[1];
        case 'if':
          var t = evalExpr(expr[1], env);
          if (t === true) {
            return evalExpr(expr[2], env);
          } else {
            return evalExpr(expr[3], env);
          }
        case 'fn':
          return function () {
            env = {bindings: {}, outer: env};
            for (var i = 0, ilen = expr[1].length; i < ilen; ++i) {
              add_binding(env, expr[1][i].value, arguments[i]);
            }
            return evalExpr(expr[2], env);
          };
        case 'scope':
          return evalExpr(expr[1], {bindings: {}, outer: env});
        case 'let':
          for (var i = 0, ilen = expr[1].length; i < ilen; ++i) {
            add_binding(env, expr[1][i][0], evalExpr(expr[1][i][1]));
          }
          return evalExpr(expr[2], env);
        case '.':
          return evalExpr(expr[1])[expr[2].value];
        case 'define':
        case ':=':
          return add_binding(env, expr[1].value, evalExpr(expr[2], env));
        case 'set!':
        case '=':
          return update(env, expr[1].value, evalExpr(expr[2], env));
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
          var func = evalExpr(expr[0].slice(0, -1), env);
          var val = func.call(env, evalExpr(expr[1], env), evalExpr(expr[2], env))
          return update(env, expr[1], val);
        default:
          var func = evalExpr(expr[0], env);
          var args = [];
          for (var i = 1, ilen = expr.length; i < ilen; ++i) {
            args.push(evalExpr(expr[i], env));
          }
          if (typeof func !== 'function') {
            return func;
          } else {
            return func.apply(env, args);
          }
      }
    }
    // Numbers evaluate to themselves
    if (expr.tag === 'literal') {
      return expr.value;
    }
    /*
    if (typeof expr === 'number' || typeof expr === 'boolean') {
      return expr;
    }
    */
    if (expr.tag === 'identifier' || expr.tag === 'operator') {
      return lookup(env, expr.value);
    }
    /*
    if (typeof expr === 'string') {
      return lookup(env, expr);
    }
    */

  };

  return {
    evalExpr: evalExpr,
    evalProg: evalProg
  };
}());
if (typeof module !== "undefined") { module.exports = Elephant.interpreter; }
