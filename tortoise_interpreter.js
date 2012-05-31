if (typeof module !== 'undefined') {
  var Tortoise = {
    parser: require('./tortoise_parser.js')
  };
}
var parse = Tortoise.parser.parse;

var Tortoise = Tortoise || {};
Tortoise.interpreter = (function () {

  function Exception (message) {
    this.message = message;
  }

  var myTurtle;
  var positions = [];
  var init_env = {
    bindings: {
      forward: function(d) { myTurtle.forward(d); },
      backward: function(d) { myTurtle.backward(d); },
      right: function(a) { myTurtle.right(a); },
      left: function(a) { myTurtle.left(a); },
      up: function() { myTurtle.up(); },
      down: function() { myTurtle.down(); },
      push: function () {
        positions.push({x: myTurtle.x,
                        y: myTurtle.y,
                        angle: myTurtle.angle});
      },
      pop: function () {
        if (positions.length > 0) {
          var position = positions.pop();
          myTurtle.x = position.x;
          myTurtle.y = position.y;
          myTurtle.angle = position.angle;
          myTurtle.updateTurtle();
        }
      },
      random: Math.random,
      floor: Math.floor
    },
    outer: {}
  };

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

  var start = function (eval, expr, env, cont, xcont) {
    return {
      data: eval(expr, env, cont || thunkValue, xcont || thunkValue),
      done: false
    };
  };

  var step = function (state) {
    //state.forEach(function (state) {
      if (state.data.tag === 'value') {
        state.data = state.data.val;
        state.done = true;
      } else if (state.data.tag === 'thunk') {
        state.data = state.data.func.apply(null, state.data.args);
      } else {
        throw new Exception("What?");
      }
    //});
  }

  var evalFull = function (eval, expr, env, cont, xcont) {
    var state = start(eval, expr, env, cont, xcont);
    while (!state.done) {
      step(state);
    }
    return state.data;
  }

  var evalTortoiseString = function (prg, env, cont, xcont) {
    env = env || {};
    var expr = parse(prg);
    return evalFull(evalStatements, expr, env);
  };

  // Evaluate a Tortoise expression, return value
  var evalExpr = function (expr, env, cont, xcont) {
    // Numbers evaluate to themselves
    if (typeof expr === 'number') {
      return thunk(cont, expr);
    } else if (typeof expr === 'string') {
      return thunk(cont, expr);
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
        var func = lookup(env, expr.name)
          , i = -1
          , ilen = expr.args.length
          , eval_args = []
        ;
        return function nextArg(r) {
          if (i >= 0) {
            eval_args[i] = r;
          }
          if (++i < ilen) {
            return thunk(evalExpr, expr.args[i], env, nextArg, xcont);
          } else {
            if (typeof func === 'function') {
              return thunk(cont, func.apply(null, eval_args));
            } else {
              return thunk(evalStatements, func.body, 
                add_bindings({bindings: {}, outer: func.env}, func.args, eval_args),
                cont, xcont);
            }
          }
        }();
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
            if (stmt.else) {
              return thunk(evalStatements, stmt.else, env, cont, xcont);
            } else {
              return thunk(cont);
            }
          }
        }, xcont);           
      case 'repeat':
        return thunk(evalExpr, stmt.expr, env, function (count) {
          var i = -1;
          return function repeatStmt (r) {
            if (++i < count) {
              return thunk(evalStatements, stmt.body, env, repeatStmt, xcont);
            } else {
              return thunk(cont, r);
            }
          }();
        }, xcont);
      case 'define':
        return thunk(cont, add_binding(env, stmt.name, {
          body: stmt.body,
          env: env,
          args: stmt.args
        }));
      case 'throw':
        return thunk(evalExpr, stmt.expr, env, xcont, xcont);
      case 'try':
        return thunk(evalStatements, stmt.body, env, cont, function (v) {
          if (stmt.catch) {
            return thunk(evalStatements, stmt.catch, env, cont, xcont);
          } else {
            return thunk(cont, v);
          }
        });
    }
  };

  var evalStatements = function (seq, env, cont, xcont) {
    var i = -1
      , ilen = seq.length
    ;
    return function evalNext (r) {
      if (++i < ilen) {
        return thunk(evalStatement, seq[i], env, evalNext, xcont);
      } else {
        return thunk(cont, r);
      }
    }();
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

  Turtle.prototype.setSpeed = function (speed) {
    this.speed = speed;
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

  Turtle.prototype.hideTurtle = function () {
    this.turtleimg.remove();
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

  var obj = {
    evalFull: evalFull,
    evalExpr: evalExpr,
    evalStatement: evalStatement,
    evalStatements: evalStatements,
    start: start,
    step: step,
    lookup: lookup,
    evalTortoise: function (expr, env) {
      return evalFull(evalStatements, expr, env);
    },
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
