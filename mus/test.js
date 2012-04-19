var compiler = require('./compiler.js').compiler;

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

exports.musics = [
  {tag: 'note', pitch: 'c4', dur: 100}
];

exports.notes = [
  [{tag: 'note', pitch: 60, start: 0, dur: 100}]
];

for (var i = 0, ilen = exports.musics.length; i < ilen; ++i) {
  exports['test' + i] = (function (a, b) {
    return function (test) {
      test.deepEqual(compiler.compile(a), b);
      test.done();
    }
  }(exports.musics[i], exports.notes[i]));
}