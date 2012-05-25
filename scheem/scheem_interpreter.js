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
    } else {
      throw new Error('variable ' + v + ' not defined');
    }
  };

  var add_env = function (env) {
    env.outer = {bindings: env.bindings,
                 outer: env.outer};
    env.bindings = {};
  }

  var add_binding = function (env, v, val) {
    if (!env.bindings) {
      env.bindings = {};
      env.outer = {};
    }
    env.bindings[v] = val;
  };

  var initial_env = {
    'assert-args-0': function () {
      return arguments.length === 0 ? '#t' : '#f';
    },
    'assert-args-1': function () {
      return arguments.length === 1 ? '#t' : '#f';
    },
    'assert-args-2': function () {
      return arguments.length === 2 ? '#t' : '#f';
    },
    '+': function (x, y) { return x + y; },
    '-': function (x, y) { return x - y; },
    '*': function (x, y) { return x * y; },
    '/': function (x, y) { return x / y; },
    '==': function (x, y) { return x === y ? '#t' : '#f'; },
    '>': function (x, y) { return x > y ? '#t' : '#f'; },
    '<': function (x, y) { return x < y ? '#t' : '#f'; },
    '<=>': function (x, y) { return x < y ? -1 : (x === y ? 0 : 1); },
    'cons': function (x, y) { return [x].concat(y); },
    'car': function (x, y) { return x[0]; },
    'cdr': function (x, y) { x.shift(); return x; },
    'cdr': function (x, y) { return x.slice(1); },
    'alert': function (arg) { console.log(arg); return arg; }
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
      case '=':
        if (env === null) {
          env = {name: expr[1],
                 value: evalScheem(expr[2]),
                 outer: null};
        } else if (env === {}) {
          env.name = expr[1];
          env.value = evalScheem(expr[2]);
          env.outer = null;
        } else {
          add_binding(env, expr[1], evalScheem(expr[2], env));
        }
        //env[expr[1]] = evalScheem(expr[2], env);
        return 0;
      case 'set!':
        update(env, expr[1], evalScheem(expr[2], env));
        //if (!env[expr[1]]) throw new Error("set! variable " + expr[1] + " not defined");
        //env[expr[1]] = evalScheem(expr[2], env);
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
      case 'if':
        var t = evalScheem(expr[1], env);
        if (t === '#t') {
          return evalScheem(expr[2], env);
        } else {
          return evalScheem(expr[3], env);
        }
      case 'fn':
        return function () {
          for (var i = 0, ilen = expr[1].length; i < ilen; ++i) {
            add_binding(env, expr[1][i], arguments[i]);
          }
          return evalScheem(expr[2], env);
        };
      case 'let':
        for (var i = 0, ilen = expr[1].length; i < ilen; ++i) {
          add_binding(env, expr[1][i][0], evalScheem(expr[1][i][1]));
        }
        return evalScheem(expr[2], env);
      case 'let-one':
        add_binding(env, expr[1], evalScheem(expr[2]));
        return evalScheem(expr[3], env);
      default:
        var func = evalScheem(expr[0], env);
        var args = [];
        for (var i = 1, ilen = expr.length; i < ilen; ++i) {
          args.push(evalScheem(expr[i], env));
        }
        return func.apply(null, args);
    }
  };

  return {
    evalScheem: evalScheem,
    evalScheemString: evalScheemString
  };
}());
if (typeof module !== "undefined") { module.exports = Scheem.interpreter; }
