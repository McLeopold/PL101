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
      throw new Error('set! variable ' + v + ' not defined');
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

  var evalTortoiseString = function (prg, env) {
    env = env || {};
    var expr = parse(prg);
    return evalStatements(expr, env);
  };

  // Evaluate a Tortoise expression, return value
  var evalExpr = function (expr, env) {
    // Numbers evaluate to themselves
    if (typeof expr === 'number') {
      return expr;
    }
    // Look at tag to see what to do
    switch(expr.tag) {
      // Simple built-in binary operations
      case '<':
        return evalExpr(expr.left, env) <
               evalExpr(expr.right, env);
      case '>':
        return evalExpr(expr.left, env) >
               evalExpr(expr.right, env);
      case '+':
        return evalExpr(expr.left, env) +
               evalExpr(expr.right, env);
      case '*':
        return evalExpr(expr.left, env) *
               evalExpr(expr.right, env);
      case 'call':
        // Get function value
        var func = lookup(env, expr.name);
        // Evaluate arguments to pass
        var ev_args = [];
        var i = 0;
        for(i = 0; i < expr.args.length; i++) {
          ev_args[i] = evalExpr(expr.args[i], env);
        }
        return func.apply(null, ev_args);
      case 'ident':
        return lookup(env, expr.name);

    }
  };

  var evalStatement = function (stmt, env) {
    var val = undefined;
    // Statements always have tags
    switch(stmt.tag) {
      // A single expression
      case 'ignore':
        // Just evaluate expression
        return evalExpr(stmt.body, env);
      // Declare new variable
      case 'var':
        // New variable gets default value of 0
        add_binding(env, stmt.name, 0);
        return 0;
      case ':=':
        // Evaluate right hand side
        val = evalExpr(stmt.right, env);
        update(env, stmt.left, val);
        return val;
      case 'if':
        if(evalExpr(stmt.expr, env)) {
          val = evalStatements(stmt.body, env);
        }
        return val;            
      case 'repeat':
        var count = evalExpr(stmt.expr);
        var val;
        while (count-- > 0) {
          val = evalStatements(stmt.body, env);
        }
        return val;
      case 'define':
        // name args body
        var new_func = function() {
          // This function takes any number of arguments
          var i;
          var new_env;
          var new_bindings;
          new_bindings = { };
          for(i = 0; i < stmt.args.length; i++) {
            new_bindings[stmt.args[i]] = arguments[i];
          }
          new_env = { bindings: new_bindings, outer: env };
          return evalStatements(stmt.body, new_env);
        };
        add_binding(env, stmt.name, new_func);
        return 0;            
    }
  };

  var evalStatements = function (seq, env) {
      var i;
      var val = undefined;
      for(i = 0; i < seq.length; i++) {
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

  Turtle.prototype.right = function (ang) {
    this.angle -= ang;
    this.updateTurtle();
  };
  Turtle.prototype.left = function (ang) {
    this.angle += ang;
    this.updateTurtle();
  };

  var myTurtle;
  if (typeof $ !== 'undefined') {
    $(function () {
      myTurtle = new Turtle(0, 0, 400, 400);
    });
  }
  var init_env = { };
  add_binding(init_env, 'forward', function(d) { myTurtle.forward(d); });
  add_binding(init_env, 'right', function(a) { myTurtle.right(a); });
  add_binding(init_env, 'left', function(a) { myTurtle.left(a); });

  return {
    evalExpr: evalExpr,
    evalStatement: evalStatement,
    evalStatements: evalStatements,
    lookup: lookup,
    evalTortoise: evalStatements,
    evalTortoiseString: evalTortoiseString,
    myTortoise: myTurtle
  };
}());
if (typeof module !== "undefined") { module.exports = Tortoise.interpreter; }
