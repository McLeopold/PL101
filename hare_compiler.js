if (typeof module !== 'undefined') {
  var Hare = {
    parser: require('./hare_parser.js'),
    gfx: require('./hare_gfx.js')
  };
}

var Hare = Hare || {};
Hare.compiler = (function () {
  var parse = Hare.parser.parse;
  var init_env = Hare.gfx.init_env;

  function Exception (message) {
    this.message = message;
  }

  var lookup = function (env, v) {
    if (env.bindings) {
      if (env.bindings.hasOwnProperty(v)) {
        return env.bindings[v];
      } else {
        return lookup(env.outer, v);
      }
    } else {
      if (init_env.bindings.hasOwnProperty(v)) {
        return init_env.bindings[v];
      } else {
        throw new Error('variable ' + v + ' not found');
      }
    }
  };

  var update = function (env, v, val) {
    //console.log('update', env, v, val);
    if (env.bindings) {
      if (env.bindings.hasOwnProperty(v)) {
        env.bindings[v] = val;
      } else {
        update(env.outer, v, val);
      }
    } else {
      throw new Error('variable ' + v + ' not defined');
    }
    return val;
  };

  var update_index = function (env, v, index, val) {
    //console.log('update', env, v, val);
    if (env.bindings) {
      if (env.bindings.hasOwnProperty(v)) {
        var value = env.bindings[v];
        for (var i = 0, ilen = index.length - 1; i < ilen; ++i) {
          value = value[index[i]];
        }
        value[index[index.length - 1]] = val;
      } else {
        update_index(env.outer, v, index, val);
      }
    } else {
      throw new Error('variable ' + v + ' not defined');
    }
    return val;
  };

  var compileHareString = function (prg, env) {
    env = env || {};
    var expr = parse(prg);
    return compileEnvironment(init_env) +
           compileEnvironment(env) +
           compileStatements(expr);
  };

  // Evaluate a Hare expression, return value
  var compileExpr = function (expr) {
    // Numbers evaluate to themselves
    if (typeof expr === 'number') {
      return expr;
    } else if (typeof expr === 'string') {
      return expr;
    } else if (expr instanceof Array) {
      var values = [];
      for (var i = 0, ilen = expr.length; i < ilen; ++i) {
        values[i] = compileExpr(expr[i]);
      }
      return values;
    }
    // Look at tag to see what to do
    switch(expr.tag) {
      // Simple built-in binary operations
      case '&&':
        return '(' + compileExpr(expr.left) + ')&&(' + compileExpr(expr.right) + ')';
      case '||':
        return '(' + compileExpr(expr.left) + ')||(' + compileExpr(expr.right) + ')';
      case '==':
        return '(' + compileExpr(expr.left) + ')===(' + compileExpr(expr.right) + ')';
      case '!=':
        return '(' + compileExpr(expr.left) + ')!==(' + compileExpr(expr.right) + ')';
      case '<':
        return '(' + compileExpr(expr.left) + ')<(' + compileExpr(expr.right) + ')';
      case '>':
        return '(' + compileExpr(expr.left) + ')>(' + compileExpr(expr.right) + ')';
      case '<=':
        return '(' + compileExpr(expr.left) + ')<=(' + compileExpr(expr.right) + ')';
      case '>=':
        return '(' + compileExpr(expr.left) + ')>=(' + compileExpr(expr.right) + ')';
      case '+':
        return '(' + compileExpr(expr.left) + ')+(' + compileExpr(expr.right) + ')';
      case '-':
        return '(' + compileExpr(expr.left) + ')-(' + compileExpr(expr.right) + ')';
      case '*':
        return '(' + compileExpr(expr.left) + ')*(' + compileExpr(expr.right) + ')';
      case '/':
        return '(' + compileExpr(expr.left) + ')/(' + compileExpr(expr.right) + ')';
      case 'call':
        var result = [];
        for (var i = 0, ilen = expr.args.length; i < ilen; ++i) {
          result.push(compileExpr(expr.args[i]));
        }
        return expr.name + '(' + result.join(', ') + ')';
      case 'index':
        var value = lookup(env, expr.name);
        for (var i = 0, ilen = expr.index.length; i < ilen; ++i) {
          value = value[compileExpr(expr.index[i])];
        }
        return value;
      case 'ident':
        return expr.name;

    }
  };

  var compileEnvironment = function (env) {
    var result = '';
    if (env.outer) {
      result += compileEnvironment(env.outer);
    }
    for (var prop in env.bindings) {
      result += 'var ' + prop + ' = ' + env.bindings[prop].toString() + ';\n';
    }
    return result;
  };

  var compileStatement = function (stmt) {
    switch(stmt.tag) {
      case 'ignore':
        return '_res = (' + compileExpr(stmt.body) + ');\n';
      case 'var':
        return '_res = 0;\nvar ' + stmt.name + ';\n';
      case ':=':
        return '_res = (' + stmt.left + ' = ' + compileExpr(stmt.right) + ');\n';
      case '[]=':
        var values = [];
        for (var i = 0, ilen = stmt.index.length; i < ilen; ++i) {
          values[i] = compileExpr(stmt.index[i]);
        }
        return update_index(env, stmt.left, values, compileExpr(stmt.right));
      case 'if':
        return '_res = undefined;\n' + 
        'if(' + compileExpr(stmt.expr) + ') {\n' +
        compileStatements(stmt.body, false) + '}\n' +
        (stmt.else ? ('else {\n' + compileStatements(stmt.else) + '}\n') : '');
      case 'repeat':
        return compileRepeat(stmt);
      case 'define':
        return '_res = 0;\nvar ' + stmt.name + ' = function(' + stmt.args.join(',') + ') {\n' + compileStatements(stmt.body, true) + '};\n';
    }
  };

  var repeat = function (num, func) {
    var i;
    var res;
    for(i = 0; i < num; i++) {
        res = func();
    }
    return res;
  };

  var compileRepeat = function (stmt) {
    var result = 'var _res = repeat(' + compileExpr(stmt.expr) + ', function() {\n';
    result += compileStatements(stmt.body, true);
    result += '});\n';
    return result;
  };

  var compileStatements = function (stmts, is_funcbody) {
    var result = 'var _res = undefined;\n';
    for (var i = 0, ilen = stmts.length; i < ilen; ++i) {
      result += compileStatement(stmts[i]);
    }
    if (is_funcbody) {
      result += 'return _res;\n';
    }
    return result;
  };

  var obj = {
    compileExpr: compileExpr,
    compileStatement: compileStatement,
    compileStatements: compileStatements,
    lookup: lookup,
    compileHare: compileHareString,
    repeat: repeat
  };

  return obj;
}());
if (typeof module !== "undefined") { module.exports = Hare.compiler; }
