if (typeof module !== 'undefined') {
  var parse = require('./scheem-parser.js').parse;
} else {
  var parse = scheem_parser.parse;
}

var evalScheemString = function (prg, env) {
  var expr = parse(prg);
  return evalScheem(expr, env);
};

var lookup = function (env, v) {
  if (env === null) {
    throw new Error('function ' + v + ' not found');
  }
  return (!!env && env.hasOwnProperty('name')) ?
    (env.name === v ? env.value : lookup(env.outer, v)) :
    lookup(initial_env, v);
};

var update = function (env, v, val) {
  if (env.name === v) {
      env.value = val;
  } else {
      update(env.outer, v, val);
  }
};

var add_binding = function (env, v, val, initial) {
  if (env.name) {
    env.outer = {name: env.name,
                 value: env.value,
                 outer: env.outer};
  } else {
    env.outer = initial ? null : {};
  }
  env.name = v;
  env.value = val;
};

var initial_env = (function () {
  var name
    , env = {}
    , fns = {
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
      '=': function (x, y) { return x === y ? '#t' : '#f'; },
      '>': function (x, y) { return x > y ? '#t' : '#f'; },
      '<': function (x, y) { return x < y ? '#t' : '#f'; },
      '<=>': function (x, y) { return x < y ? -1 : (x === y ? 0 : 1); },
      'cons': function (x, y) { return [x].concat(y); },
      'car': function (x, y) { return x[0]; },
      //'cdr': function (x, y) { x.shift(); return x; },
      'cdr': function (x, y) { return x.slice(1); },
      'alert': function (arg) { console.log(arg); return arg; },
    }
  ;
  for (name in fns) {
    add_binding(env, name, fns[name], true);
  }
  return env;
}());

var evalScheem = function (expr, env) {
  // Numbers evaluate to themselves
  if (typeof expr === 'number') {
    return expr;
  }
  if (typeof expr === 'string') {
    return lookup(env, expr);
  }
  // Look at head of list for operation
  switch (expr[0]) {
    case 'define':
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
    case 'lambda':
      return function () {
        for (var i = 0, ilen = expr[1].length; i < ilen; ++i) {
          add_binding(env, expr[1][i], arguments[i]);
        }
        return evalScheem(expr[2], env);
      };
    case 'let-one':
      return evalScheem(expr[3],
                        {name: expr[1],
                         value: expr[2],
                         outer: env});
    default:
      var func = evalScheem(expr[0], env);
      var args = [];
      for (var i = 1, ilen = expr.length; i < ilen; ++i) {
        args.push(evalScheem(expr[i], env));
      }
      return func.apply(null, args);
    }
};

if (typeof module !== 'undefined') {
  module.exports.evalScheem = evalScheem;
  module.exports.evalScheemString = evalScheemString;
}