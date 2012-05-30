if (typeof module !== 'undefined') {
  var Tortoise = {
    parser: require('./tortoise_parser.js')
  };
  var Raphael = function () {
    return {
      clear: function () {},
      image: function () {
        return {
          attr: function () {},
          toFront: function () {}
        };
      }
    };
  };
  Raphael.rad = function (deg) {
    return deg % 360 * Math.pi / 180;
  }
}
var parse = Tortoise.parser.parse;

var Tortoise = Tortoise || {};
Tortoise.interpreter = (function () {

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

  var add_env = function (env) {
    env.outer = {bindings: env.bindings,
                 outer: env.outer};
    env.bindings = {};
  }

  var add_binding = function (env, v, val, pause) {
    if (!env.bindings) {
      env.bindings = {};
      env.outer = {};
    }
    env.bindings[v] = val;
    val.pause = !!pause;
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

  var thunk = function (f, lst) {
    return {
      tag: 'thunk',
      func: f,
      args: lst
    };
  };

  var thunk = function (f) {
    var args = Array.prototype.slice.call(arguments, 1);
    return {
      tag: "thunk",
      func: f,
      args: args
    };
};

  var thunkValue = function (x) {
    return {
      tag: 'value',
      val: x
    };
  };

  var trampoline = function (thk) {
    while (true) {
      if (thk.tag === 'value') {
        return thk.val;
      }
      if (thk.tag === 'thunk') {
        thk = thk.func.apply(null, thk.args);
      }
    }
  };

  var start_expr_step = function (expr, env) {
    return {
      data: evalExpr(expr, env, thunkValue),
      done: false
    };
  }

  var start_statement_step = function (expr, env) {
    return {
      data: evalStatement(expr, env, thunkValue),
      done: false
    };
  }

  var start_statements_step = function (expr, env) {
    return {
      data: evalStatements(expr, env, thunkValue),
      done: false
    };
  }

  var step = function (state, count) {
    //console.log('step', count, state);
    if (state.data.tag === 'value') {
      state.data = state.data.val;
      state.done = true;
    } else if (state.data.tag === 'thunk') {
      state.data = state.data.func.apply(null, state.data.args);
    } else {
      throw new Exception("What?");
    }
  }

  var evalExprFull = function (expr, env) {
    var count = evalExprFull.count++;
    //console.log('evalExprFull', expr);
    var state = start_expr_step(expr, env);
    while (!state.done) {
      step(state, count);
    }
    return state.data;
  }
  evalExprFull.count = 0;

  var evalStatementFull = function (stmt, env, cont, xcont) {
    var count = evalStatementFull.count++;
    //console.log('evalStatementFull', stmt);
    var state = start_statement_step(stmt, env);
    while (!state.done) {
      step(state, count);
    }
    return state.data;
  }
  evalStatementFull.count = 0;

  var evalStatementsFull = function (stmt, env, cont, xcont) {
    var count = evalStatementsFull.count++;
    //console.log('evalStatementsFull', stmt);
    var state = start_statements_step(stmt, env);
    while (!state.done) {
      step(state, count);
    }
    return state.data;
  }
  evalStatementsFull.count = 0;

  var evalTortoiseString = function (prg, env, cont, xcont) {
    env = env || {};
    var expr = parse(prg);
    return evalStatementsFull(expr, env);
  };


  // Evaluate a Tortoise expression, return value
  var evalExpr = function (expr, env, cont, xcont) {
    // Numbers evaluate to themselves
    if (typeof expr === 'number') {
      return thunk(cont, expr);
      return expr;
    }
    // Look at tag to see what to do
    switch(expr.tag) {
      // Simple built-in binary operations
      case '==':
        return thunk(evalExpr, expr.left, env, function (v1) {
          return thunk(evalExpr, expr.right, env, function (v2) {
            return thunk(cont, v1 === v2);
          }, xcont);
        }, xcont);
      case '<':
        return thunk(evalExpr, expr.left, env, function (v1) {
          return thunk(evalExpr, expr.right, env, function (v2) {
            return thunk(cont, v1 < v2);
          }, xcont);
        }, xcont);
      case '>':
        return thunk(evalExpr, expr.left, env, function (v1) {
          return thunk(evalExpr, expr.right, env, function (v2) {
            return thunk(cont, v1 > v2);
          }, xcont);
        }, xcont);
      case '<=':
        return thunk(evalExpr, expr.left, env, function (v1) {
          return thunk(evalExpr, expr.right, env, function (v2) {
            return thunk(cont, v1 <= v2);
          }, xcont);
        }, xcont);
      case '>=':
        return thunk(evalExpr, expr.left, env, function (v1) {
          return thunk(evalExpr, expr.right, env, function (v2) {
            return thunk(cont, v1 >= v2);
          }, xcont);
        }, xcont);
      case '+':
        return thunk(evalExpr, expr.left, env, function (v1) {
          return thunk(evalExpr, expr.right, env, function (v2) {
            return thunk(cont, v1 + v2);
          }, xcont);
        }, xcont);
      case '-':
        return thunk(evalExpr, expr.left, env, function (v1) {
          return thunk(evalExpr, expr.right, env, function (v2) {
            return thunk(cont, v1 - v2);
          }, xcont);
        }, xcont);
      case '*':
        return thunk(evalExpr, expr.left, env, function (v1) {
          return thunk(evalExpr, expr.right, env, function (v2) {
            return thunk(cont, v1 * v2);
          }, xcont);
        }, xcont);
      case '/':
        return thunk(evalExpr, expr.left, env, function (v1) {
          return thunk(evalExpr, expr.right, env, function (v2) {
            if (v2 === 0)
              return thunk(xcont, 'Exception');
            else
              return thunk(cont, v1 / v2);
          }, xcont);
        }, xcont);
      case 'call':
        // Get function value
        var func = lookup(env, expr.name);
        var i = -1;
        var eval_args = [];
        var new_bindings = {bindings: {}, outer: func.env};
        return thunk(function nextArg(r) {
          if (i >= 0) {
            eval_args[i] = r;
          }
          i += 1;
          if (i === expr.args.length) {
            if (typeof func === 'function') {
              return thunk(cont, func.apply(null, eval_args));
            } else {
              add_bindings(new_bindings, func.args, eval_args);
              return thunk(evalStatements, func.body, new_bindings, cont, xcont);
            }
          } else {
            eval_args[i] = r;
            return thunk(evalExpr, expr.args[i], env, nextArg, xcont);
          }
        });
        if (typeof func === 'function') {
          var i = 0;
          var ev_args = [];
          for(i = 0; i < expr.args.length; i++) {
            ev_args.push(evalExprFull(expr.args[i], env));
          }
          return thunk(cont, func.apply(null, ev_args));
        } else {
          var i = 0;
          for(i = 0; i < expr.args.length; i++) {
            add_binding(func.env, func.args[i], evalExprFull(expr.args[i], env));
          }
          return thunk(evalStatements, func.body, func.env, cont, xcont);
        }
        //return func.apply(null, ev_args);
      case 'ident':
        return thunk(cont, lookup(env, expr.name));

    }
  };

  var evalStatement = function (stmt, env, cont, xcont) {
    //console.log('evalStatement', stmt, env, cont, xcont);
    var val = undefined;
    // Statements always have tags
    switch(stmt.tag) {
      // A single expression
      case 'ignore':
        // Just evaluate expression
        return thunk(evalExpr, stmt.body, env, cont, xcont);
      // Declare new variable
      case 'var':
        // New variable gets default value of 0
        return thunk(cont, add_binding(env, stmt.name, 0));
      case ':=':
        // Evaluate right hand side
        return thunk(evalExpr, stmt.right, env, function (v) {
          return thunk(cont, update(env, stmt.left, v));
        }, xcont);
      case 'if':
        return thunk(evalExpr, stmt.expr, env, function (v) {
          if (v) {
            return thunk(evalStatements, stmt.body, env, cont, xcont);
          } else {
            return thunk(cont);
          }
        }, xcont);           
      case 'repeat':
        return thunk(evalExpr, stmt.expr, env, function (v) {
          var i = -1;
          return thunk(function repeatStmt (r) {
            i += 1;
            if (i === v) {
              return thunk(cont, r);
            } else {
              return thunk(evalStatements, stmt.body, env, repeatStmt, xcont);
            }
          });
        }, xcont);
      case 'define':
        return thunk(cont, add_binding(env, stmt.name, {
          body: stmt.body,
          env: env,
          args: stmt.args
        }));
    }
  };

  var evalStatements = function (seq, env, cont, xcont) {
    var i = -1;
    return thunk(function evalNext (r) {
      i += 1;
      if (i === seq.length) {
        return thunk(cont, r);
      } else {
        return thunk(evalStatement, seq[i], env, evalNext, xcont);
      }
    });
  };

  var Turtle = function (x, y, w, h) {
    this.paper = Raphael(x, y, w, h);
    this.originx = w / 2;
    this.originy = h / 2;
  };
  Turtle.prototype.clear = function () {
    this.paper.clear();
    this.x = this.originx;
    this.y = this.originy;
    this.angle = 90;
    this.pen = true;
    this.turtleimg = undefined;
    this.updateTurtle();
  };

  Turtle.prototype.updateTurtle = function () {
    if(this.turtleimg === undefined) {
      this.turtleimg = this.paper.image(
          "http://nathansuniversity.com/gfx/turtle2.png",
          0, 0, 64, 64);
    }
    this.turtleimg.attr({
      x: this.x - 32,
      y: this.y - 32,
      transform: "r" + (-this.angle)});
    this.turtleimg.toFront();
  };

  Turtle.prototype.drawTo = function (x, y) {
    var x1 = this.x;
    var y1 = this.y;
    var params = { "stroke-width": 4 };
    var path = this.paper.path(Raphael.format("M{0},{1}L{2},{3}",
        x1, y1, x, y)).attr(params);
  };

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

  var myTurtle;
  var init_env = { };
  var positions = [];
  add_binding(init_env, 'forward', function(d) {
    myTurtle.forward(d);
  }, true);
  add_binding(init_env, 'backward', function(d) {
    myTurtle.backward(d);
  }, true);
  add_binding(init_env, 'right', function(a) {
    myTurtle.right(a);
  }, true);
  add_binding(init_env, 'left', function(a) {
    myTurtle.left(a);
  }, true);
  add_binding(init_env, 'up', function() {
    myTurtle.up();
  });
  add_binding(init_env, 'down', function() {
    myTurtle.down();
  });
  add_binding(init_env, 'push', function () {
    positions.push({x: myTurtle.x,
                    y: myTurtle.y,
                    angle: myTurtle.angle});
  });
  add_binding(init_env, 'pop', function () {
    if (positions.length > 0) {
      var position = positions.pop();
      myTurtle.x = position.x;
      myTurtle.y = position.y;
      myTurtle.angle = position.angle;
      myTurtle.updateTurtle();
    }
  }, true);
  add_binding(init_env, 'random', function () {
    return Math.random();
  });
  add_binding(init_env, 'floor', function (n) {
    return Math.floor(n);
  });

  var obj = {
    evalExpr: evalExprFull,
    evalStatement: evalStatementFull,
    evalStatements: evalStatementsFull,
    startStatements: start_statements_step,
    step: step,
    lookup: lookup,
    evalTortoise: evalStatementsFull,
    evalTortoiseString: evalTortoiseString,
    myTortoise: myTurtle
  };
  var init = function (top, left, width, height) {
    $(function () {
      myTurtle = new Turtle(top, left, width, height);
      obj.myTortoise = myTurtle;
    });
  };
  obj.init = init;

  return obj;
}());
if (typeof module !== "undefined") { module.exports = Tortoise.interpreter; }