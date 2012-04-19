var Benchmark = require('benchmark');
var compiler1 = require('./compiler.js').compiler;
var compiler2 = require('./mark.js');
var musics = require('./test.js').musics;

var suite = new Benchmark.Suite;

// add tests
suite
.add('compiler1', function () {
  for (var i = 0, ilen = musics.length; i < ilen; ++i) {
    compiler1.compile(musics[i]);
  }
})
.add('compiler2', function () {
  for (var i = 0, ilen = musics.length; i < ilen; ++i) {
    compiler2(musics[i]);
  }
})
.on('cycle', function(event, bench) {
  console.log(String(bench));
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').pluck('name'));
})
.run();