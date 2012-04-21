var compiler = require('./compiler.js').compiler;

exports.musics = [
  {tag: 'note', pitch: 'c4', dur: 1000},
  { tag: 'seq',
    left: { tag: 'note', pitch: 'c4', dur: 1000 },
    right: { tag: 'note', pitch: 'g4', dur: 1000 } },
  { tag: 'par',
    left: { tag: 'seq',
            left: { tag: 'note', pitch: 'c4', dur: 1000 },
            right: { tag: 'note', pitch: 'g4', dur: 1000 } },
    right: { tag: 'seq',
             left: { tag: 'note', pitch: 'c4', dur: 1000 },
             right: { tag: 'note', pitch: 'g4', dur: 1000 } } },
  { tag: 'context',
    context: 'one',
    section: { tag: 'par',
               left: { tag: 'context', context: 'two', section: { tag: 'seq',
                       left: { tag: 'note', pitch: 'c4', dur: 1000 },
                       right: { tag: 'note', pitch: 'g4', dur: 1000 } } },
               right: { tag: 'seq',
                        left: { tag: 'note', pitch: 'c4', dur: 1000 },
                        right: { tag: 'note', pitch: 'g4', dur: 1000 } } } },
  { tag: 'reverse',
    section:
    { tag: 'par',
      left: { tag: 'seq',
              left: { tag: 'note', pitch: 'c4', dur: 1000 },
              right: { tag: 'note', pitch: 'g4', dur: 1000 } },
      right: { tag: 'seq',
               left: { tag: 'note', pitch: 'c4', dur: 1000 },
               right: { tag: 'note', pitch: 'g4', dur: 1000 } } } },
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
         right: { tag: 'note', pitch: 'c4', dur: 500 } } } }
];

exports.notes = [
  [{tag: 'note', pitch: 60, start: 0, dur: 1000}],
  [{tag: 'note', pitch: 60, start: 0, dur: 1000},
   {tag: 'note', pitch: 67, start: 1000, dur: 1000}],
  [ { tag: 'note', pitch: 60, start: 0, dur: 1000 },
    { tag: 'note', pitch: 67, start: 1000, dur: 1000 },
    { tag: 'note', pitch: 60, start: 0, dur: 1000 },
    { tag: 'note', pitch: 67, start: 1000, dur: 1000 } ],
  [ { tag: 'note', pitch: 60, start: 0, dur: 1000 },
    { tag: 'note', pitch: 67, start: 1000, dur: 1000 },
    { tag: 'note', pitch: 60, start: 0, dur: 1000 },
    { tag: 'note', pitch: 67, start: 1000, dur: 1000 } ],
  [ { tag: 'note', pitch: 67, start: 0, dur: 1000 },
    { tag: 'note', pitch: 60, start: 1000, dur: 1000 },
    { tag: 'note', pitch: 67, start: 0, dur: 1000 },
    { tag: 'note', pitch: 60, start: 1000, dur: 1000 } ],
  [ { tag: 'note', pitch: 71, start: 0, dur: 250 },
    { tag: 'note', pitch: 69, start: 250, dur: 250 },
    { tag: 'note', pitch: 62, start: 500, dur: 400 },
    { tag: 'note', pitch: 62, start: 900, dur: 400 },
    { tag: 'note', pitch: 62, start: 1300, dur: 400 },
    { tag: 'note', pitch: 62, start: 1700, dur: 400 },
    { tag: 'note', pitch: 60, start: 2100, dur: 500 },
    { tag: 'note', pitch: 45, start: 0, dur: 500 },
    { tag: 'note', pitch: 45, start: 500, dur: 500 },
    { tag: 'note', pitch: 45, start: 1000, dur: 500 },
    { tag: 'note', pitch: 45, start: 1500, dur: 500 },
    { tag: 'note', pitch: 45, start: 2000, dur: 500 },
    { tag: 'note', pitch: 45, start: 2500, dur: 100 } ]
];

for (var i = 0, ilen = Math.min(exports.musics.length, exports.notes.length); i < ilen; ++i) {
  exports['compile_' + i] = (function (a, b) {
    return function (test) {
      test.deepEqual(compiler.compile(a), b);
      test.done();
    }
  }(exports.musics[i], exports.notes[i]));
}
