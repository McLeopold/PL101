var compiler = {
  compile_fns: {}
};
compiler.extend = function (tag, compile_fn) {
  this.compile_fns[tag] = compile_fn;
};
compiler.compile = function (expr, time) {
  time = time || 0;
  var result = {
    note: [],
    compile: function (expr, time) {
      return compiler.compile_fns[expr.tag].call(this, expr, time);
    }
  }
  this.compile_fns[expr.tag].call(result, expr, time);
  return result.note;
};

compiler.extend(
  'note',
  function (expr, time) {
    this.note.push({tag: 'note',
                    pitch: convertPitch(expr.pitch),
                    start: time,
                    dur: expr.dur});
    return time + expr.dur;
  }
);

compiler.extend(
  'rest',
  function (expr, time) {
    return time + expr.dur;
  }
);

compiler.extend(
  'seq',
  function (expr, time) {
    time = this.compile(expr.left, time);
    return this.compile(expr.right, time);
  }
);

compiler.extend(
  'par',
  function (expr, time) {
    var time1 = this.compile(expr.left, time);
    var time2 = this.compile(expr.right, time);
    return Math.max(time1, time2);
  }
);

compiler.extend(
  'repeat',
  function (expr, time) {
    for (var i = expr.count; i > 0; --i) {
      time = this.compile(expr.section, time);
    }
    return time;
  }
);

compiler.extend(
  'reverse',
  function (expr, time) {
    var _compile = this.compile;
    this.compile = function (expr, time) {
      if (expr.left && expr.right) {
        var temp = expr.right;
        expr.right = expr.left;
        expr.left = temp;
      }
      return _compile.call(this, expr, time);
    }
    var result = this.compile(expr.section, time);
    this.compile = _compile;
    return result;
  }
);

/**
 *  will cut off the section if it extends past a specified duration
 *  {tag: 'cut', dur: 1000, section: <MUS_EXPR> }
 */
compiler.extend(
  'cut',
  function (expr, time) {
    var _compile = this.compile,
        cut_time = time + expr.dur;
    this.compile = function (expr, time) {
      if (time < cut_time) {
        var result = _compile.call(this, expr, time);
        var last_note = this.note[this.note.length-1];
        // shorten last note if it goes over the cut_time
        if (last_note.start + last_note.dur > cut_time) {
          last_note.dur = cut_time - last_note.start;
        }
        return result;
      }
    }
    var result = this.compile(expr.section, time);
    this.compile = _compile;
    return result;
  }
);

/**
 *  will repeat the left node as long as the right node is playing
 *  useful for providing a background harmony for a melody
 *  {tag: 'round', round: <MUS_EXPR>, section: <MUS_EXPR>}
 */
compiler.extend(
  'round',
  function (expr, time) {
    var cut_time = this.compile(expr.section, time);
    while (time < cut_time) {
      time = this.compile({tag: 'cut', dur: (cut_time - time), section: expr.round}, time);
    }
    return cut_time;
  }
);

/**
 *  will store a structure to be reused later, perhaps multiple times
 *  {tag: 'store', name: 'name', section: <MUS_EXPR>}
 */
compiler.storage = {};
compiler.extend(
  'store',
  function (expr, time) {
    compiler.storage[expr.name] = expr.section;
  }
);

/**
 *  will compile a stored structure at the current location
 *  {tag: 'load', name: 'name'}
 */
compiler.extend(
  'load',
  function (expr, time) {
    return this.compile(compiler.storage[expr.name]);
  }
);

var convertPitch = function (pitch) {
  var letterPitches = { c: 12, d: 14, e: 18, f: 17, g: 19, a: 21, b: 23 };
  return letterPitches[pitch[0]] +
         12 * parseInt(pitch[1]);
};

var melody_mus = { tag: 'note', pitch: 'c4', dur: 1000 };
var melody_mus = { tag: 'seq',
                   left: { tag: 'note', pitch: 'c4', dur: 1000 },
                   right: { tag: 'note', pitch: 'g4', dur: 1000 } };
var melody_mus = { tag: 'par',
                   left: { tag: 'note', pitch: 'c4', dur: 1000 },
                   right: { tag: 'note', pitch: 'g4', dur: 1000 } };
var melody_mus = 
{ tag: 'reverse',
  section:
{ tag: 'round',
  round: { tag: 'note', pitch: 'a2', dur: 500},
  section:
  { tag: 'seq',
    left: { tag: 'reverse', section:
     { tag: 'seq',
       left: { tag: 'note', pitch: 'a4', dur: 250 },
       right: { tag: 'note', pitch: 'b4', dur: 250 } } },
    right:
     { tag: 'seq',
       left: {tag: 'repeat', count: 4, section: { tag: 'note', pitch: 'd4', dur: 400 } },
       right: { tag: 'note', pitch: 'c4', dur: 500 } } } } };
var melody_mus = 
{ tag: 'seq',
  left: {
    tag: 'store',
    name: 'one',
    section: { tag: 'note', pitch: 'c4', dur: 500 }
  },
  right: {
    tag: 'seq',
    left: { tag: 'load', name: 'one' },
    right: {tag: 'load', name: 'one' }
  }
}
console.log(melody_mus);
console.log(compiler.compile(melody_mus));
