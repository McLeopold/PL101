var Benchmark = require('benchmark');
var compiler1 = require('./compiler.js').compiler;
var compiler2 = require('./mark.js');

var suite = new Benchmark.Suite;

var longMusWide = (function (n) {
  var i = 0
    , tree = {tag : 'seq', left: {}, right : {}}
    , stack = [tree.left, tree.right]
    , cur
  ;

  cur = stack.pop();
  while (i < n && cur) {
    cur.tag = 'seq';
    cur.left = {};
    cur.right = {};
    stack.unshift(cur.right);
    stack.unshift(cur.left);
    cur = stack.pop();
    i += 1;
  }
   
  while (cur) {
    cur.tag = "note";
    cur.pitch = "c4";
    cur.dur = 250;
    cur = stack.pop();
  }
  
  return tree;
    
}(1e4));

var longMusDeep = (function (n) {
  var i = 0
    , tree = {tag : 'seq', left: {}, right : {}}
    , stack = [tree.left, tree.right]
    , cur
  ;

  cur = stack.pop();
  while (i < n && cur) {
    cur.tag = 'seq';
    cur.left = {};
    cur.right = { tag: 'note', pitch: 'd4', dur: 500 };
    //stack.unshift(cur.right);
    stack.unshift(cur.left);
    cur = stack.pop();
    i += 1;
  }
   
  while (cur) {
    cur.tag = "note";
    cur.pitch = "c4";
    cur.dur = 250;
    cur = stack.pop();
  }
  
  return tree;
    
}(1e4));

var musics = [longMusWide, longMusDeep];

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