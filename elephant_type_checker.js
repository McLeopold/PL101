if (typeof module !== 'undefined') {
  var Elephant = {
    parser: require('./elephant_parser.js')
  };
}
var parse = Elephant.parser.parse;

var Elephant = Elephant || {};
Elephant.type_checker = (function () {
  var typeProg = function (prg, env) {
    env = get_env(env);
    var expr = parse(prg);
    return typeExpr(expr, env);
  };

  var typeElephantExpr = function (expr, env) {
    env = get_env(env);
    return typeExpr(expr, env);
  }

  var extend = function (obj1, obj2) {
    for (var prop in obj2) { if (obj2.hasOwnProperty(prop)) {
      obj1[prop] = obj2[prop];
    }}
  };

/*
  var initial_env = {
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
*/
  var get_env = function (env) {
    var initial_env = {
      types: {
        //
        '+': arrow2type('number', 'number', 'number'),
        '-': arrow2type('number', 'number', 'number'),
        '*': arrow2type('number', 'number', 'number'),
        '/': arrow2type('number', 'number', 'number'),
        '==': arrow2type('number', 'number', 'boolean'),
        '>': arrow2type('number', 'number', 'boolean'),
        '<': arrow2type('number', 'number', 'boolean'),
        '<=>': arrow2type('number', 'number', 'number'),
        '+=': arrow2type('number', 'number', 'number'),
        'len': arrow1type('list', 'number'),
        'random': arrowtype(basetype('unit'), basetype('number')),
        '#t': basetype('boolean'),
        '#f': basetype('boolean'),
        'alert': arrow1type('variant', 'variant')
      },
      outer: {}
    };
  if (env && env.hasOwnProperty('outer')) {
      env.outer = initial_env;
      return env;
    } else {
      if (typeof env === 'object') {
        env.types = {};
        env.outer = initial_env;
        return env;
      } else {
        return initial_env;
      }
    }
  };

  var lookup = function (env, v) {
    if (env.types) {
      if (env.types.hasOwnProperty(v)) {
        return env.types[v];
      } else {
        return lookup(env.outer, v);
      }
    } else {
      throw new Error('variable ' + v + ' type not found');
    }
  };

  var update = function (env, v, val) {
    if (env.types) {
      if (env.types.hasOwnProperty(v)) {
        env.types[v] = val;
      } else {
        update(env.outer, v, val);
      }
    } else {
      throw new Error('set! variable ' + v + ' not defined');
    }
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
  var arrow1type = function (a, b) {
    return {tag:'arrowtype', left: basetype(a), right:basetype(b)};
  }
  var arrow2type = function (a, b, c) {
    return {tag:'arrowtype', left: basetype(a), right:{tag:'arrowtype', left:basetype(b), right:basetype(c)}};
  }

  var sameType = function (a, b) {
      if (a.tag === 'basetype')
          return a.tag === b.tag &&
                (a.name === 'variant' || a.name === b.name);
      else if (a.tag === 'arrowtype')
          return a.tag === b.tag && sameType(a.left, b.left) && sameType(a.right, b.right);
  };

  var restrictiveType = function (a, b) {
    if (a.name === 'variant') {
      return b;
    } else {
      return a;
    }
  }

  var typeExpr = function (expr, context) {
    if (typeof expr === 'undefined') {
      throw new Error('invalid form');
    }
    if (typeof expr === 'number' || typeof expr === 'boolean') {
      return basetype(typeof expr);
    }
    if (typeof expr === 'string') {
      return lookup(context, expr);
    }
    if (typeof expr === 'object' && !(expr instanceof Array)) {
      return lookup(context, expr.name);
    }
    if (expr.length === 0) {
      return basetype('unit');
    }
    switch (expr[0]) {
      case 'if':
        return typeExprIf(expr, context);
      case 'fn':
        return typeExprLambda(expr, context);
      case ':=':
        if (typeof expr[1] === 'object') {
          add_type(context, expr[1].name, expr[1].type);
          if (!sameType(expr[1].type, typeExpr(expr[2], context))) {
            throw new Error('define does not return ' + prettyType(expr[2]) + ' but ' + typeExpr(expr[3], context));
          }
        } else {
          add_type(context, expr[1], typeExpr(expr[2], context));
        }
        return typeExpr(expr[1], context);
      case ':=':
        var A_type = typeExpr(expr[1], context);
        var B_type = typeExpr(expr[2], context);
        if (!sameType(A_type, B_type)) {
          throw new Error('set! changing ' + expr[1] + ' from ' + prettyType(A_type) + ' to ' + prettyType(B_type));
        }
        return A_type;
      case 'do':
        var result = [];
        for (var i = 1; i < expr.length; ++i) {
          result = typeExpr(expr[i], context);
        }
        return result;
      case 'list':
        return basetype('list');
      default:
        var A = expr[0];
        var A_type = typeExpr(A, context);
        if (expr.length === 1) {
          A_type = A_type.right || A_type;
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
              throw new Error('Argument type did not match: ' + prettyType(U_type) + ' != ' + prettyType(B_type));
            }
            A_type = V_type;
          }
        }
        return restrictiveType(A_type, B_type);
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

  var typeExprLambda = function (expr, context) {
    var new_env = {
      types: {},
      outer: context
    };
    var lambda_type;
    if (expr[1].length === 0) {
      lambda_type = arrowtype(basetype('unit'), typeExpr(expr[2], context));
    } else {
      final_type = lambda_type = {};
      for (var i = 0, ilen = expr[1].length; i < ilen; ++i) {
        var name, vtype;
        if (typeof expr[1][i] === 'object' && !(expr[1][i] instanceof Array)) {
          vtype = expr[1][i].type;
          name = expr[1][i].name;
        } else {
          vtype = basetype('variant');
          name = expr[1][i];
        }
        new_env.types[name] = vtype;
        lambda_type = arrowtype(vtype, lambda_type);
      }
      extend(final_type, typeExpr(expr[2], new_env));
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

  return {
    typeExpr: typeElephantExpr,
    typeProg: typeProg,
    prettyType: prettyType
  };
}());
if (typeof module !== "undefined") { module.exports = Elephant.type_checker; }
