;(function(exports){

  var compiler = {
    compile_fns: {}
  };
  compiler.extend = function (tag, compile_fn) {
    this.compile_fns[tag] = compile_fn;
  };
  compiler.compile = function (expr, time) {
    time = time || 0;
    var notes = [];
    var dispatch = compiler.compile_fns;
    var compile = function (expr, time, notes, compile) {
      return dispatch[expr.tag](expr, time, notes, compile);
    }
    compiler.compile_fns[expr.tag](expr, time, notes, compile);
    return notes;
  };

  compiler.extend(
    'note',
    function (expr, time, notes, compile) {
      notes.push({tag: 'note',
                       pitch: convertPitch(expr.pitch),
                       start: time,
                       dur: expr.dur});
      return time + expr.dur;
    }
  );

  compiler.extend(
    'rest',
    function (expr, time, notes, compile) {
      return time + expr.dur;
    }
  );

  compiler.extend(
    'seq',
    function (expr, time, notes, compile) {
      time = compile(expr.left, time, notes, compile);
      return compile(expr.right, time, notes, compile);
    }
  );

  compiler.extend(
    'par',
    function (expr, time, notes, compile) {
      var time1 = compile(expr.left, time, notes, compile);
      var time2 = compile(expr.right, time, notes, compile);
      return (time1 < time2) ? time1 : time2;
    }
  );

  compiler.extend(
    'repeat',
    function (expr, time, notes, compile) {
      for (var i = expr.count; i > 0; --i) {
        time = compile(expr.section, time, notes, compile);
      }
      return time;
    }
  );

  compiler.extend(
    'reverse',
    function (expr, time, notes, compile) {
      return compile(expr.section, time, notes, function reverse_compile (expr, time, notes, compile) {
        if (expr.left && expr.right) {
          var temp = expr.right;
          expr.right = expr.left;
          expr.left = temp;
        }
        var result = compile(expr, time, notes, reverse_compile);
        if (expr.left && expr.right) {
          var temp = expr.right;
          expr.right = expr.left;
          expr.left = temp;
        }
        return result;
      });
    }
  );

  /**
   *  will cut off the section if it extends past a specified duration
   *  {tag: 'cut', dur: 1000, section: <MUS_EXPR> }
   */
  compiler.extend(
    'cut',
    function (expr, time, notes, compile) {
      var cut_time = time + expr.dur;
      return compile(expr.section, time, notes, function cut_compile (expr, time, notes, compile) {
        if (time < cut_time) {
          var result = compile(expr, time, notes, cut_compile);
          var last_note = notes[notes.length-1];
          // shorten last note if it goes over the cut_time
          if (last_note.start + last_note.dur > cut_time) {
            last_note.dur = cut_time - last_note.start;
          }
          return result;
        }
      });
    }
  );

  /**
   *  will repeat the left node as long as the right node is playing
   *  useful for providing a background harmony for a melody
   *  {tag: 'round', round: <MUS_EXPR>, section: <MUS_EXPR>}
   */
  compiler.extend(
    'round',
    function (expr, time, notes, compile) {
      var cut_time = compile(expr.section, time, notes, compile);
      while (time < cut_time) {
        time = compile({tag: 'cut', dur: (cut_time - time), section: expr.round}, time, notes, compile);
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
    function (expr, time, notes, compile) {
      compiler.storage[expr.name] = expr.section;
    }
  );

  /**
   *  will compile a stored structure at the current location
   *  {tag: 'load', name: 'name'}
   */
  compiler.extend(
    'load',
    function (expr, time, notes, compile) {
      return compile(compiler.storage[expr.name], time, notes, compile);
    }
  );

  var convertPitch = function (pitch) {
    var letterPitches = { c: 12, d: 14, e: 18, f: 17, g: 19, a: 21, b: 23 };
    return letterPitches[pitch[0]] +
           12 * parseInt(pitch[1]);
  };

  exports.compiler = compiler;
}(typeof exports=='object'?exports:MUS={}));