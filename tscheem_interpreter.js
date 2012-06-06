if (typeof module !== 'undefined') {
  var TScheem = {
    parser: require('./tscheem_parser.js')
  };
}
var parse = TScheem.parser.parse;

var TScheem = TScheem || {};
TScheem.interpreter = (function () {
  var extend = function (obj1, obj2) {
    for (var prop in obj2) { if (obj2.hasOwnProperty(prop)) {
      obj1[prop] = obj2[prop];
    }}
  };

  var get_env = function (env) {
    var initial_env = {
      bindings: {
        '+': function (x) { return function (y) { return x + y; }; },
        '-': function (x) { return function (y) { return x - y; }; },
        '*': function (x) { return function (y) { return x * y; }; },
        '/': function (x) { return function (y) { return x / y; }; },
        '=': function (x) { return function (y) { return (x === y ? '#t' : '#f'); }; },
        '>': function (x) { return function (y) { return (x > y ? '#t' : '#f'); }; },
        '<': function (x) { return function (y) { return x < y ? '#t' : '#f'; }; },
        '<=>': function (x) { return function (y) { return x < y ? -1 : (x === y ? 0 : 1); }; },
        'cons': function (x) { return function (y) { return [x].concat(y); }; },
        'car': function (x) { return function (y) { return x[0]; }; },
        'cdr': function (x) { return function (y) { x.shift(); return x; }; },
        'cdr': function (x) { return function (y) { return x.slice(1); }; },
        'alert': function (arg) { console.log(arg); return arg; },
        'random': function () { return Math.random(); },
        '#t': true,
        '#f': false
      },
      types: {
        '+': arrowtype(basetype('number'), arrowtype(basetype('number'), basetype('number'))),
        '-': arrowtype(basetype('number'), arrowtype(basetype('number'), basetype('number'))),
        '*': arrowtype(basetype('number'), arrowtype(basetype('number'), basetype('number'))),
        '/': arrowtype(basetype('number'), arrowtype(basetype('number'), basetype('number'))),
        '=': arrowtype(basetype('number'), arrowtype(basetype('number'), basetype('boolean'))),
        '>': arrowtype(basetype('number'), arrowtype(basetype('number'), basetype('boolean'))),
        '<': arrowtype(basetype('number'), arrowtype(basetype('number'), basetype('boolean'))),
        '<=>': arrowtype(basetype('number'), arrowtype(basetype('number'), basetype('number'))),
        'random': arrowtype(basetype('unit'), basetype('number')),
        '#t': basetype('boolean'),
        '#f': basetype('boolean')
      },
      outer: {}
    };
  if (env && env.hasOwnProperty('outer')) {
      env.outer = initial_env;
      return env;
    } else {
      if (typeof env === 'object') {
        env.bindings = {};
        env.types = {};
        env.outer = initial_env;
        return env;
      } else {
        return initial_env;
      }
    }
  };

  var evalTScheem = function (expr, env) {
    env = get_env(env);
    return evalExpr(expr, env);
  };

  var evalTScheemString = function (prg, env) {
    env = get_env(env);
    var expr = parse(prg);
    return evalExpr(expr, env);
  };

  var typeTScheemString = function (prg, env) {
    env = get_env(env);
    var expr = parse(prg);
    return typeExpr(expr, env);
  };

  var lookup = function (env, v) {
    if (env.bindings) {
      if (env.bindings.hasOwnProperty(v)) {
        return env.bindings[v];
      } else {
        return lookup(env.outer, v);
      }
    } else {
      throw new Error('variable ' + v + ' not found');
    }
  };

  var lookup_type = function (env, v) {
    if (env.types) {
      if (env.types.hasOwnProperty(v)) {
        return env.types[v];
      } else {
        return lookup_type(env.outer, v);
      }
    } else {
      throw new Error('variable ' + v + ' type not found');
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
      throw new Error('set! variable ' + v + ' not defined');
    }
  };

  var add_binding = function (env, v, val) {
    return env.bindings[v] = val;
  };

  var add_type = function (env, v, type) {
    return env.types[v] = type;
  };

  var basetype = function (name) {
    return {tag:'basetype', name: name};
  }
  var arrowtype = function (left, right) {
    return {tag:'arrowtype', left: left, right: right};
  }

  var sameType = function (a, b) {
      if (a.tag === 'basetype')
          return a.tag === b.tag && a.name === b.name;
      else if (a.tag === 'arrowtype')
          return a.tag === b.tag && sameType(a.left, b.left) && sameType(a.right, b.right);
  };

  var typeExpr = function (expr, context) {
    if (typeof expr === 'number' || typeof expr === 'boolean') {
      return basetype(typeof expr);
    }
    if (typeof expr === 'string') {
      return lookup_type(context, expr);
    }
    if (typeof expr === 'object' && !(expr instanceof Array)) {
      return lookup_type(context, expr.name);
    }
    if (typeof expr === 'undefined') {
      throw new Error('invalid form');
    }
    switch (expr[0]) {
      case 'if':
        return typeExprIf(expr, context);
      case 'lambda-one':
        return typeExprLambdaOne(expr, context);
      case 'lambda':
        return typeExprLambda(expr, context);
      case 'define':
        if (typeof expr[1] === 'object') {
          add_type(context, expr[1].name, expr[1].type);
          if (!sameType(expr[1].type, typeExpr(expr[2], context))) {
            throw new Error('define does not return ' + prettyType(expr[2]) + ' but ' + typeExpr(expr[3], context));
          }
        } else {
          add_type(context, expr[1], typeExpr(expr[2], context));
        }
        return typeExpr(expr[1], context);
      case 'set!':
        var A_type = typeExpr(expr[1], context);
        var B_type = typeExpr(expr[2], context);
        if (!sameType(A_type, B_type)) {
          throw new Error('set! changing ' + expr[1] + ' from ' + prettyType(A_type) + ' to ' + prettyType(B_type));
        }
        return A_type;
      case 'begin':
        var result = [];
        for (var i = 1; i < expr.length; ++i) {
          result = typeExpr(expr[i], context);
        }
        return result;
      default:
        var A = expr[0];
        var A_type = typeExpr(A, context);
        if (expr.length === 1) {
          A_type = A_type.right;
        } else {
          for (var i = 1, ilen = expr.length; i < ilen; ++i) {
            var B = expr[i];
            var B_type = typeExpr(B, context);
            // Check that A type is arrow type
            if (A_type.tag !== 'arrowtype') {
              throw new Error('Not an arrow type');
            }
            var U_type = A_type.left;
            var V_type = A_type.right;
            // Verify argument type matches
            if (sameType(U_type, B_type) === false) {
              throw new Error('Argument type did not match' + prettyType(U_type) + prettyType(B_type));
            }
            A_type = V_type;
          }
        }
        return A_type;
    }
  };

  var typeExprIf = function (expr, context) {
    var t1 = typeExpr(expr[2], context)
    , t2 = typeExpr(expr[3], context)
    , c = typeExpr(expr[1], context)
    ;
    if (sameType(c, basetype('boolean'))) {
      if (sameType(t1, t2)) {
        return t1;
      } else {
        throw new Error('if branch return types do not match: ' + prettyType(t1) + ' != ' + prettyType(t2));
      }
    } else {
      throw new Error('if condition returns ' + prettyType(c) + ' instead of boolean');
    }
  };

  var typeExprLambdaOne = function (expr, context) {
    var new_bindings = { bindings: {}, types: {}, outer: context };
    new_bindings.types[expr[1].name] = expr[1].type;
    return {tag: 'arrowtype',
            left: expr[1].type,
            right: typeExpr(expr[2], new_bindings)
           };
  };

  var typeExprLambda = function (expr, context) {
    var new_bindings = {
      bindings: {},
      types: {},
      outer: context
    };
    var lambda_type;
    if (expr[1].length === 0) {
      lambda_type = arrowtype(basetype('unit'), typeExpr(expr[2], context));
    } else {
      final_type = lambda_type = {};
      for (var i = 0, ilen = expr[1].length; i < ilen; ++i) {
        new_bindings.types[expr[1][i].name] = expr[1][i].type;
        lambda_type = arrowtype(expr[1][i].type, lambda_type);
      }
      extend(final_type, typeExpr(expr[2], new_bindings));
    }
    return lambda_type;
  };

  var prettyType = function (type) {
    if (type.tag === 'basetype') {
      return type.name;
    } else if (type.tag === 'arrowtype') {
      return '(' + prettyType(type.left) + ' -> ' + prettyType(type.right) + ')';
    }
  };  

  var evalExpr = function (expr, env) {
    if (typeof expr === 'number' || typeof expr === 'boolean') {
      return expr;
    }
    if (typeof expr === 'string') {
      return lookup(env, expr);
    }
    switch (expr[0]) {
      case 'define':
        if (typeof expr[1] === 'object' && !(expr[1] instanceof Array)) {
          return add_binding(env, expr[1].name, evalExpr(expr[2], env));
        } else {
          return add_binding(env, expr[1], evalExpr(expr[2], env));
        }
      case 'set!':
        return update(env, expr[1], evalExpr(expr[2], env));
      case 'begin':
        var result = [];
        for (var i = 1; i < expr.length; ++i) {
          result = evalExpr(expr[i], env);
        }
        return result;            
      case 'quote':
        if (expr.length !== 2) throw new Error("quote expects 1 parameter, got " + (expr.length - 1));
        return expr[1];
      case 'if':
        var t = evalExpr(expr[1], env);
        if (t === '#t') {
          return evalExpr(expr[2], env);
        } else {
          return evalExpr(expr[3], env);
        }
      case 'lambda-one':
        return function () {
          if (typeof expr[1] === 'object' && !(expr[1] instanceof Array)) {
            add_binding(env, expr[1].name, arguments[0]);
          } else {
            add_binding(env, expr[1], arguments[0]);
          }
          return evalExpr(expr[2], env);
        };
      case 'lambda':
        var j = 0, jlen = expr[1].length;
        return function nextArg (a) {
          if (j < jlen) {
            add_binding(env, expr[1][j].name, a);
            j++;
          }
          if (j < jlen) {
            return nextArg;
          } else {
            return evalExpr(expr[2], env);
          }
          for (var i = 0, ilen = expr[1].length; i < ilen; ++i) {
            add_binding(env, expr[1][i], arguments[i]);
          }
        };
      case 'let':
        for (var i = 0, ilen = expr[1].length; i < ilen; ++i) {
          add_binding(env, expr[1][i][0], evalExpr(expr[1][i][1]));
        }
        return evalExpr(expr[2], env);
      case 'let-one':
        add_binding(env, expr[1], evalExpr(expr[2]));
        return evalExpr(expr[3], env);
      default:
        var func = evalExpr(expr[0], env);
        if (expr.length == 1) {
          func = func();
        } else {
          for (var i = 1, ilen = expr.length; i < ilen; ++i) {
            var func = func.call(null, evalExpr(expr[i], env));
          }
        }
        return func;
    }
  };

  return {
    evalExpr: evalExpr,
    evalTScheem: evalTScheem,
    evalTScheemString: evalTScheemString,
    typeTScheemString: typeTScheemString,
    basetype: basetype,
    arrowtype: arrowtype,
    prettyType: prettyType
  };
}());
if (typeof module !== "undefined") { module.exports = TScheem.interpreter; }