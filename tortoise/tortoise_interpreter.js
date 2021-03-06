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

  var positions = [];
  var init_env = {
    bindings: {
      forward: function(d) { this.forward(d); },
      backward: function(d) { this.backward(d); },
      right: function(a) { this.right(a); },
      left: function(a) { this.left(a); },
      up: function() { this.up(); },
      down: function() { this.down(); },
      push: function () {
        positions.push({x: this.x,
                        y: this.y,
                        angle: this.angle});
      },
      pop: function () {
        if (positions.length > 0) {
          var position = positions.pop();
          this.x = position.x;
          this.y = position.y;
          this.angle = position.angle;
          this.updateTurtle();
        }
      },
      random: Math.random,
      floor: Math.floor,
      width: function (d) { this.setWidth(d); },
      color: function (r, g, b) { this.setColor(r, g, b); },
      log: function (msg) { if (msg === undefined) msg = ''; myConsole.text(myConsole.text() + msg); },
      logln: function (msg) { if (msg === undefined) msg = ''; myConsole.text(myConsole.text() + msg + '\n'); },
      font: function (font) { this.setFont(font); },
      text: function (text) { this.text(text); },
      'true': true,
      'false': false

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

  var thunk = function (fn) {
    var args = Array.prototype.slice.call(arguments, 1);
    return {
      tag: "thunk",
      func: fn,
      args: args
    };
  };

  // used to shortcut a thunk if the expr does not exist
  // and returns the val on the next continuation
  var default_thunk = function (val, fn, expr, env, conts) {
    if (expr !== undefined) {
      var args = Array.prototype.slice.call(arguments, 2);
      return {
        tag: "thunk",
        func: fn,
        args: args
      };
    } else {
      return conts[0].call(this, val);
    }
  };

  var thunkValue = function (x) {
    return {
      tag: 'value',
      val: x
    };
  };

  var myTurtles, myConsole;
  var start = function (eval, expr, env, conts) {
    var states = [];
    spawn(states, eval, expr, env, conts, myTurtles && myTurtles.turtles[0]);
    return states;
  };

  var spawn = function (states, eval, expr, env, conts, turtle) {
    var state = {}
      , i
    ;
    if (conts) {
      for (i = 0, ilen = conts.length; i < ilen; ++i) {
        conts[i] = conts[i] || thunkValue;
      }
    } else {
      conts = [thunkValue, thunkValue, thunkValue, thunkValue, thunkValue];
    }
    state.data = eval.call(state, expr, env, conts);
    state.done = false;
    state.turtle = turtle;
    state.turtles = myTurtles;
    state.states = states;
    states.push(state);
    return state;
  }

  var step = function (states) {
    states.forEach(function (state) {
      if (!state.done) {
        if (state.data.tag === 'value') {
          state.data = state.data.val;
          state.done = true;
          state.turtle && state.turtle.hide();
        } else if (state.data.tag === 'thunk') {
          try {
            state.data = state.data.func.apply(state, state.data.args);
          } catch (e) {
            e.loc = state.data.args[0].loc;
            console.log(e);
            throw e;
          }
        } else {
          throw new Exception("What?");
        }
      }
    });
  }

  var finished = function (states) {
    for (var i = 0, ilen = states.length; i < ilen; ++i) {
      if (!states[i].done) {
        return false;
      }
    }
    return true;
  };

  var evalFull = function (eval, expr, env, conts) {
    var states = start(eval, expr, env, conts);
    while (!finished(states)) {
      step(states);
    }
    return states[0].data;
  }

  var evalTortoiseString = function (prg, env, conts) {
    env = env || {};
    var expr = parse(prg);
    return evalFull(evalStatements, expr, env);
  };

  // conts is a list of continuations that point to possible next statements
  // [next, exception, break, continue]
  var NEXT = 0
    , EXCEPT = 1
    , BREAK = 2
    , CONTINUE = 3
    , RETURN = 4
  ;
  // Evaluate a Tortoise expression, return value
  var evalExpr = function (expr, env, conts) {
    // Numbers evaluate to themselves
    if (typeof expr === 'number') {
      return thunk.call(this, conts[NEXT], expr);
    } else if (typeof expr === 'string') {
      return thunk.call(this, conts[NEXT], expr);
    } else if (typeof expr === 'boolean') {
      return thunk.call(this, conts[NEXT], expr);
    } else if (expr instanceof Array) {
      var i = -1
        , ilen = expr.length
        , values = []
      ;
      return function nextArg(r) {
        if (i >= 0) {
          values[i] = r;
        }
        if (++i < ilen) {
          return thunk.call(this, evalExpr, expr[i], env, [nextArg].concat(conts.slice(1)));
        } else {
          return thunk.call(this, conts[NEXT], values);
        }
      }.call(this);
    }
    // Look at tag to see what to do
    switch(expr.tag) {
      // Simple built-in binary operations
      case '&&':
        return thunk.call(this, evalExpr, expr.left, env, [function (v1) {
          if (v1) {
            return thunk.call(this, evalExpr, expr.right, env, [function (v2) {
              return thunk.call(this, conts[NEXT], v2);
            }].concat(conts.slice(1)));
          } else {
            return thunk.call(this, conts[NEXT], v1);
          }
        }].concat(conts.slice(1)));
      case '||':
        return thunk.call(this, evalExpr, expr.left, env, [function (v1) {
          if (v1) {
            return thunk.call(this, conts[NEXT], v1);
          } else {
            return thunk.call(this, evalExpr, expr.right, env, [function (v2) {
              return thunk.call(this, conts[NEXT], v2);
            }].concat(conts.slice(1)));
          }
        }].concat(conts.slice(1)));
      case '==':
        return thunk.call(this, evalExpr, expr.left, env, [function (v1) {
          return thunk.call(this, evalExpr, expr.right, env, [function (v2) {
            return thunk.call(this, conts[NEXT], v1 === v2);
          }].concat(conts.slice(1)));
        }].concat(conts.slice(1)));
      case '!=':
        return thunk.call(this, evalExpr, expr.left, env, [function (v1) {
          return thunk.call(this, evalExpr, expr.right, env, [function (v2) {
            return thunk.call(this, conts[NEXT], v1 !== v2);
          }].concat(conts.slice(1)));
        }].concat(conts.slice(1)));
      case '<':
        return thunk.call(this, evalExpr, expr.left, env, [function (v1) {
          return thunk.call(this, evalExpr, expr.right, env, [function (v2) {
            return thunk.call(this, conts[NEXT], v1 < v2);
          }].concat(conts.slice(1)));
        }].concat(conts.slice(1)));
      case '>':
        return thunk.call(this, evalExpr, expr.left, env, [function (v1) {
          return thunk.call(this, evalExpr, expr.right, env, [function (v2) {
            return thunk.call(this, conts[NEXT], v1 > v2);
          }].concat(conts.slice(1)));
        }].concat(conts.slice(1)));
      case '<=':
        return thunk.call(this, evalExpr, expr.left, env, [function (v1) {
          return thunk.call(this, evalExpr, expr.right, env, [function (v2) {
            return thunk.call(this, conts[NEXT], v1 <= v2);
          }].concat(conts.slice(1)));
        }].concat(conts.slice(1)));
      case '>=':
        return thunk.call(this, evalExpr, expr.left, env, [function (v1) {
          return thunk.call(this, evalExpr, expr.right, env, [function (v2) {
            return thunk.call(this, conts[NEXT], v1 >= v2);
          }].concat(conts.slice(1)));
        }].concat(conts.slice(1)));

      case '+':
        return thunk.call(this, evalExpr, expr.left, env, [function (v1) {
          return thunk.call(this, evalExpr, expr.right, env, [function (v2) {
            return thunk.call(this, conts[NEXT], v1 + v2);
          }].concat(conts.slice(1)));
        }].concat(conts.slice(1)));
      case '-':
        return thunk.call(this, evalExpr, expr.left, env, [function (v1) {
          return thunk.call(this, evalExpr, expr.right, env, [function (v2) {
            return thunk.call(this, conts[NEXT], v1 - v2);
          }].concat(conts.slice(1)));
        }].concat(conts.slice(1)));
      case '*':
        return thunk.call(this, evalExpr, expr.left, env, [function (v1) {
          return thunk.call(this, evalExpr, expr.right, env, [function (v2) {
            return thunk.call(this, conts[NEXT], v1 * v2);
          }].concat(conts.slice(1)));
        }].concat(conts.slice(1)));
      case '/':
        return thunk.call(this, evalExpr, expr.left, env, [function (v1) {
          return thunk.call(this, evalExpr, expr.right, env, [function (v2) {
            return thunk.call(this, conts[NEXT], v1 / v2);
          }].concat(conts.slice(1)));
        }].concat(conts.slice(1)));
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
            return thunk.call(this, evalExpr, expr.args[i], env, [nextArg].concat(conts.slice(1)));
          } else {
            if (typeof func === 'function') {
              return thunk.call(this, conts[NEXT], func.apply(this.turtle, eval_args));
            } else {
              return thunk.call(this, evalStatements, func.body, 
                add_bindings({bindings: {}, outer: func.env}, func.args, eval_args),
                [conts[0], conts[1], null, null, conts[0]]);
            }
          }
        }.call(this);
      case 'index':
        var i = -1
          , ilen = expr.index.length
          , value = lookup(env, expr.name)
        ;
        return function nextArg(r) {
          if (i >= 0) {
            value = value[r];
          }
          if (++i < ilen) {
            return thunk.call(this, evalExpr, expr.index[i], env, [nextArg].concat(conts.slice(1)));
          } else {
            return thunk.call(this, conts[NEXT], value);
          }
        }.call(this);
      case 'ident':
        return thunk.call(this, conts[NEXT], lookup(env, expr.name));

    }
  };

  var evalStatement = function (stmt, env, conts) {
    var val = undefined;
    // Statements always have tags
    switch(stmt.tag) {
      // A single expression
      case 'ignore':
        // Just evaluate expression
        return thunk.call(this, evalExpr, stmt.body, env, conts);
      // Declare new variable
      case 'var':
        // New variable gets default value of 0
        return thunk.call(this, conts[NEXT], add_binding(env, stmt.name, 0));
      case ':=':
        // Evaluate right hand side
        return thunk.call(this, evalExpr, stmt.right, env, [function (v) {
          return thunk.call(this, conts[NEXT], update(env, stmt.left, v));
        }].concat(conts.slice(1)));
      case '[]=':
        // Evaluate right hand side
        var i = -1
          , ilen = stmt.index.length
          , values = []
        ;
        return function nextArg(r) {
          if (i >= 0) {
            values[i] = r;
          }
          if (++i < ilen) {
            return thunk.call(this, evalExpr, stmt.index[i], env, [nextArg].concat(conts.slice(1)));
          } else {
            return thunk.call(this, evalExpr, stmt.right, env, [function (v) {
              return thunk.call(this, conts[NEXT], update_index(env, stmt.left, values, v));
            }].concat(conts.slice(1)));
          }
        }.call(this);
      case 'if':
        return thunk.call(this, evalExpr, stmt.expr, env, [function (v) {
          if (v) {
            return thunk.call(this, evalStatements, stmt.body, env, conts);
          } else {
            if (stmt.else) {
              return thunk.call(this, evalStatements, stmt.else, env, conts);
            } else {
              return thunk.call(this, conts[NEXT]);
            }
          }
        }].concat(conts.slice(1)));           
      case 'repeat':
        return default_thunk.call(this, 0, evalExpr, stmt.start, env, [function (start) {
          return default_thunk.call(this, null, evalExpr, stmt.stop, env, [function (stop) {
            return default_thunk.call(this, start <= stop ? 1 : -1, evalExpr, stmt.step, env, [function (step) {
              var i = start - step;
              if (stmt.name !== undefined) {
                env = add_bindings({bindings: {}, outer: env}, stmt.name, 0);
              }
              return function repeatStmt (r) {
                i += step;
                if (stop === null || step > 0 && i < stop || step < 0 && i > stop) {
                  if (stmt.name !== undefined) {
                    update(env, stmt.name, i);
                  }
                  return thunk.call(this, evalStatements, stmt.body, env, [repeatStmt, conts[EXCEPT], conts[NEXT], repeatStmt]);
                } else {
                  return thunk.call(this, conts[NEXT], r);
                }
              }();
            }].concat(conts.slice(1)));
          }].concat(conts.slice(1)));
        }].concat(conts.slice(1)));
      case 'define':
        return thunk.call(this, conts[NEXT], add_binding(env, stmt.name, {
          body: stmt.body,
          env: env,
          args: stmt.args,
          name: stmt.name,
          type: 'function'
        }));
      case 'throw':
        return thunk.call(this, evalExpr, stmt.expr, env, [conts[EXCEPT]].concat(null, conts.slice(2)));
      case 'break':
        return thunk.call(this, conts[BREAK]);
      case 'continue':
        return thunk.call(this, conts[CONTINUE]);
      case 'return':
        return thunk.call(this, conts[RETURN], stmt.expr);
      case 'try':
        return thunk.call(this, evalStatements, stmt.body, env, conts[NEXT].concat(function (v) {
          if (stmt.catch) {
            return thunk.call(this, evalStatements, stmt.catch, env, conts);
          } else {
            return thunk.call(this, conts[NEXT], v);
          }
        }, conts.slice(2)));
      case 'hatch':
        var new_turtle = this.turtles.clone(this.turtle);
        spawn(this.states, evalStatements, stmt.body, env, [null, null, null, null], new_turtle);
        return thunk.call(this, conts[NEXT], 0); // TODO: return thread indentifier
    }
  };

  var evalStatements = function (seq, env, conts) {
    var i = -1
      , ilen = seq.length
    ;
    return function evalNext (r) {
      if (++i < ilen) {
        return thunk.call(this, evalStatement, seq[i], env, [evalNext].concat(conts.slice(1)));
      } else {
        return thunk.call(this, conts[NEXT], r);
      }
    }.call(this);
  };

  var Turtles = function (x, y, w, h) {
    this.paper = Raphael(x, y, w, h);
    this.originx = w / 2;
    this.originy = h / 2;
    this.turtles = [new Turtle(this)];
  }
  Turtles.prototype.clone = function (turtle) {
    var new_turtle = turtle.clone();
    this.turtles.push(new_turtle);
    return new_turtle;
  }
  Turtles.prototype.clear = function () {
    this.paper.clear();
    this.turtles = [new Turtle(this)];
    this.turtles[0].clear();
    /*
    for (var i = 0, ilen = this.turtles.length; i < ilen; ++i) {
      this.turtles[i].clear();
    }
    */
  }
  Turtles.prototype.hide = function () {
    for (var i = 0, ilen = this.turtles.length; i < ilen; ++i) {
      this.turtles[i].hide();
    }
  }
  Turtles.prototype.setSpeed = function (speed) {
    for (var i = 0, ilen = this.turtles.length; i < ilen; ++i) {
      this.turtles[i].setSpeed(speed);
    }
  }
  var Turtle = function (turtles) {
    this.paper = turtles.paper;
    this.originx = turtles.originx;
    this.originy = turtles.originy;
  };
  Turtle.prototype.clone = function () {
    var t = new Turtle({paper:this.paper, originx: this.originx, originy: this.originy});
    t.x = this.x;
    t.y = this.y;
    t.angle = this.angle;
    t.pen = this.pen;
    t.stroke = {
      "stroke-width": this.stroke["stroke-width"],
      "stroke-linecap": this.stroke["stroke-linecap"],
      "stroke-linejoin": this.stroke["stroke-linejoin"],
      "stroke": this.stroke["stroke"],
      "stroke-opacity": this.stroke["stroke-opacity"]
    }
    t.turtleimg = undefined;
    t.updateTurtle();
    return t;
  };
  Turtle.prototype.clear = function () {
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
    this.font = "20px Helvetica";
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

  Turtle.prototype.setFont = function (font) {
    this.font = font;
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
  Turtle.prototype.text = function (text) {
    this.paper.text(this.x, this.y, text).attr({font: this.font, fill: this.stroke.stroke });
  }

  var obj = {
    evalFull: evalFull,
    evalExpr: evalExpr,
    evalStatement: evalStatement,
    evalStatements: evalStatements,
    start: start,
    step: step,
    lookup: lookup,
    finished: finished,
    evalTortoise: function (expr, env) {
      return evalFull(evalStatements, expr, env);
    },
    evalTortoiseString: evalTortoiseString,
    myTortoises: myTurtles,
    value: function (v) {
      if (typeof v === 'object') {
        switch (v.type) {
          case 'function':
            return '[function ' + v.name + ']';
          default:
            return 'unknown object';
        }
      } else {
        return v;
      }
    }
  };
  var init = function (top, left, width, height, con) {
    $(function () {
      myTurtles = new Turtles(top, left, width, height);
      myConsole = con;
      obj.myTortoises = myTurtles;
    });
  };
  obj.init = init;

  return obj;
}());
if (typeof module !== "undefined") { module.exports = Tortoise.interpreter; }
