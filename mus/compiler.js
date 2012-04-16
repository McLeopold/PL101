var compiler = {
  endTime_fns: {},
  compile_fns: {}
};
compiler.extend = function (tag, endTime_fn, compile_fn) {
  this.endTime_fns[tag] = endTime_fn;
  this.compile_fns[tag] = compile_fn;
};
compiler.endTime = function (expr, time) {
  time = time || 0;
  if (expr.tag in this.endTime_fns) {
    return this.endTime_fns[expr.tag].call(this, expr, time);
  }
}
compiler.compile = function (expr, time) {
  time = time || 0;
  if (expr.tag in this.compile_fns) {
    return this.compile_fns[expr.tag].call(this, expr, time);
  }
};

compiler.extend(
  'note',
  function (expr, time) {
    return time + expr.dur;
  },
  function (expr, time) {
    return [{tag: 'note',
             pitch: convertPitch(expr.pitch),
             start: time,
             dur: expr.dur}];
  }
);

compiler.extend(
  'rest',
  function (expr, time) {
    return time + expr.dur;
  },
  function (expr, time) {
    return [{tag: 'rest',
             start: time,
             dur: expr.dur}];
  }
);

compiler.extend(
  'seq',
  function (expr, time) {
    return  this.endTime(expr.right, this.endTime(expr.left, time));
  },
  function (expr, time) {
    return this.compile(expr.left, time).concat(
            this.compile(expr.right, this.endTime(expr.left, time)));
  }
);

compiler.extend(
  'par',
  function (expr, time) {
    return Math.max(this.endTime(expr.right), this.endTime(expr.left));
  },
  function (expr, time) {
    return this.compile(expr.left, time).concat(
            this.compile(expr.right, time));
  }
);

compiler.extend(
  'repeat',
  function (expr, time) {
    return time + this.endTime(expr.section) * expr.count;
  },
  function (expr, time) {
    var result = [];
    for (var i = expr.count; i > 0; --i) {
      result = result.concat(this.compile(expr.section, time));
      time = this.endTime(expr.section, time);
    }
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
    return Math.min(time + expr.dur, this.endTime(expr.section, time));
  },
  function (expr, time) {
    var stop_time = this.endTime(expr);
    var result = this.compile(expr.section);
    var new_result = [];
    for (var i = 0, ilen = result.length; i < ilen; ++i) {
      var note = result[i];
      if (note.start < stop_time) {
        if (note.start + note.dur > stop_time) {
          note.dur = stop_time - note.start;
        }
        new_result.push(note);
      }
    }
    return new_result;
  }
);

var convertPitch = function (pitch) {
  return (12 + 12 * parseInt(pitch.charAt(1)) +
          ((pitch.charCodeAt() - 'a'.charCodeAt() - 2) % 12));
};

var melody_mus = 
  { tag: 'cut',
    dur: 1750,
    section: { tag: 'seq',
      left: 
       { tag: 'seq',
         left: { tag: 'note', pitch: 'a4', dur: 250 },
         right: { tag: 'note', pitch: 'b4', dur: 250 } },
      right:
       { tag: 'seq',
         left: {tag: 'repeat', count: 4, section: { tag: 'note', pitch: 'd4', dur: 500 } },
         right: { tag: 'note', pitch: 'c4', dur: 500 } } } };

console.log(melody_mus);
console.log(compiler.compile(melody_mus));
