var Hare = Hare || {};
Hare.gfx = (function () {

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
      random: function () { return Math.random(); },
      floor: function (n) { return Math.floor(n); },
      width: function (d) { myTurtle.setWidth(d); },
      color: function (r, g, b) { myTurtle.setColor(r, g, b); }
    },
    outer: {}
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
    myHare: myTurtle,
    positions: positions,
    init_env: init_env
  };
  var init = function (top, left, width, height) {
    $(function () {
      myTurtle = new Turtle(top, left, width, height);
    });
  };
  obj.init = init;
  obj.getTurtle = function () { return myTurtle; };

  return obj;
}());
if (typeof module !== "undefined") { module.exports = Hare.gfx; }
