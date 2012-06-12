if (typeof module !== 'undefined') {
  var Hare = {
    parser: require('./hare_parser.js'),
    gfx: require('./hare_gfx.js')
  };
}

var Hare = Hare || {};
Hare.interpreter = (function () {
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

  var add_binding = function (env, v, val) {
    if (!env.bindings) {
      env.bindings = {};
      env.outer = {};
    }
    env.bindings[v] = val;
    return val;
  };

  var add_bindings = function (env, vars, vals) {
    if (!env.bindings) {
      env.bindings = {};
      env.outer = {};
    }
    for (var i = 0, ilen = vars.length; i < ilen; ++i) {
      env.bindings[vars[i]] = vals[i];
    }
    return env;
  };

  var evalHareString = function (prg, env) {
    env = env || {};
    var expr = parse(prg);
    return evalStatements(expr, env);
  };

  // Evaluate a Hare expression, return value
  var evalExpr = function (expr, env) {
    // Numbers evaluate to themselves
    if (typeof expr === 'number') {
      return expr;
    } else if (typeof expr === 'string') {
      return expr;
    } else if (expr instanceof Array) {
      var values = [];
      for (var i = 0, ilen = expr.length; i < ilen; ++i) {
        values[i] = evalExpr(expr[i], env);
      }
      return values;
    }
    // Look at tag to see what to do
    switch(expr.tag) {
      // Simple built-in binary operations
      case '&&':
        return evalExpr(expr.left, env) && evalExpr(expr.right, env);
      case '||':
        return evalExpr(expr.left, env) || evalExpr(expr.right, env);
      case '==':
        return evalExpr(expr.left, env) === evalExpr(expr.right, env);
      case '!=':
        return evalExpr(expr.left, env) !== evalExpr(expr.right, env);
      case '<':
        return evalExpr(expr.left, env) < evalExpr(expr.right, env);
      case '>':
        return evalExpr(expr.left, env) > evalExpr(expr.right, env);
      case '<=':
        return evalExpr(expr.left, env) <= evalExpr(expr.right, env);
      case '>=':
        return evalExpr(expr.left, env) >= evalExpr(expr.right, env);
      case '+':
        return evalExpr(expr.left, env) + evalExpr(expr.right, env);
      case '-':
        return evalExpr(expr.left, env) - evalExpr(expr.right, env);
      case '*':
        return evalExpr(expr.left, env) * evalExpr(expr.right, env);
      case '/':
        return evalExpr(expr.left, env) / evalExpr(expr.right, env);
      case 'call':
        var func = lookup(env, expr.name);
        var eval_args = [];
        ;
        for (var i = 0, ilen = expr.args.length; i < ilen; ++i) {
          eval_args[i] = evalExpr(expr.args[i], env);
        }
        return func.apply(null, eval_args);
      case 'index':
        var value = lookup(env, expr.name);
        for (var i = 0, ilen = expr.index.length; i < ilen; ++i) {
          value = value[evalExpr(expr.index[i], env)];
        }
        return value;
      case 'ident':
        return lookup(env, expr.name);

    }
  };

  var evalStatement = function (stmt, env) {
    switch(stmt.tag) {
      case 'ignore':
        return evalExpr(stmt.body, env);
      case 'var':
        return add_binding(env, stmt.name, 0);
      case ':=':
        return update(env, stmt.left, evalExpr(stmt.right, env));
      case '[]=':
        var values = [];
        for (var i = 0, ilen = stmt.index.length; i < ilen; ++i) {
          values[i] = evalExpr(stmt.index[i], env);
        }
        return update_index(env, stmt.left, values, evalExpr(stmt.right, env));
      case 'if':
        if (evalExpr(stmt.expr, env)) {
          return evalStatements(stmt.body, env);
        } else if (stmt.else) {
          return evalStatements(stmt.else, env);
        }         
      case 'repeat':
        var count = evalExpr(stmt.expr, env);
        var val;
        while (count-- > 0) {
          val = evalStatements(stmt.body, env);
        }
        return val;
      case 'define':
        var new_func = function () {
          var new_bindings = {};
          for (var i = 0, ilen = stmt.args.length; i < ilen; ++i) {
            new_bindings[stmt.args[i]] = arguments[i];
          }
          var new_env = { bindings: new_bindings, outer: env };
          return evalStatements(stmt.body, new_env);
        };
        add_binding(env, stmt.name, new_func);
    }
  };

  var evalStatements = function (seq, env) {
    var val;
    for (var i = 0, ilen = seq.length; i < ilen; ++i) {
      val = evalStatement(seq[i], env);
    }
    return val;
  };

  var Turtle = function (x, y, w, h) {
    this.paper = Raphael(x, y, w, h);
    this.originx = w / 2;
    this.originy = h / 2;
    this.clear();
  };
  Turtle.prototype.clear = function () {
    this.paper.clear();
    this.x = this.originx;
    this.y = this.originy;
    this.angle = 90;
    this.pen = true;
    this.stroke = {
      "stroke-width": 4,
      "stroke-linecap": 'round',
      "stroke-linejoin": 'round',
      "stroke": Raphael.rgb(0,0,0),
      "stroke-opacity": 1
    }
    this.turtleimg = undefined;
    this.updateTurtle();
  };

  Turtle.prototype.updateTurtle = function () {
    if(this.turtleimg === undefined) {
      this.turtleimg = this.paper.image(
          "http://nathansuniversity.com/gfx/turtle2.png",
          0, 0, 64, 64);
    }
    this.turtleimg.toFront();
    this.turtleimg.animate(
      {
        x: this.x - 32,
        y: this.y - 32,
        transform: "r" + (-this.angle)
      },
      this.speed
    );
  };

  Turtle.prototype.hide = function () {
    this.turtleimg.remove();
  };

  Turtle.prototype.drawTo = function (x, y) {
    var x1 = this.x;
    var y1 = this.y;
    var params = this.stroke; // { "stroke-width": 4 };
    var path = this.paper.path(Raphael.format("M{0},{1}L{2},{3}",
        x1, y1, x, y)).attr(params);
  };

  Turtle.prototype.setColor = function (r, g, b) {
    this.stroke.stroke = Raphael.rgb(r, g, b);
  }

  Turtle.prototype.setWidth = function (width) {
    this.stroke['stroke-width'] = width;
  }

  Turtle.prototype.forward = function (d) {
    var newx = this.x + Math.cos(Raphael.rad(this.angle)) * d;
    var newy = this.y - Math.sin(Raphael.rad(this.angle)) * d;
    if(this.pen) {
      this.drawTo(newx, newy);
    }
    this.x = newx;
    this.y = newy;
    this.updateTurtle();
  };

  Turtle.prototype.backward = function (d) {
    var newx = this.x - Math.cos(Raphael.rad(this.angle)) * d;
    var newy = this.y + Math.sin(Raphael.rad(this.angle)) * d;
    if(this.pen) {
      this.drawTo(newx, newy);
    }
    this.x = newx;
    this.y = newy;
    this.updateTurtle();
  };

  Turtle.prototype.right = function (ang) {
    this.angle -= ang;
    this.updateTurtle();
  };
  Turtle.prototype.left = function (ang) {
    this.angle += ang;
    this.updateTurtle();
  };
  Turtle.prototype.up = function () {
    this.pen = false;
  };
  Turtle.prototype.down = function () {
    this.pen = true;
  };

  var obj = {
    evalExpr: evalExpr,
    evalStatement: evalStatement,
    evalStatements: evalStatements,
    lookup: lookup,
    evalHare: evalHareString
  };
  var init = function (top, left, width, height) {
    $(function () {
      myTurtle = new Turtle(top, left, width, height);
    });
  };
  obj.init = init;

  return obj;
}());
if (typeof module !== "undefined") { module.exports = Hare.interpreter; }
