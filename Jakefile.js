var PEG = require('pegjs')
  , fs = require('fs')
  , util = require('util')
  , exec = require('child_process').exec
  , input_file = 'scheem.peg'
  , output_file = 'scheem-parser.js'
;

function puts(callback) {
  return function puts(error, stdout, stderr) {
    util.puts(error ? stderr : stdout);
    callback();
  }
}

function run(cmd, seq) {
  if (!seq) {
    seq = [];
    setTimeout(function next () {
      if (seq.length > 0) {
        seq.shift()(next);
      }
    }, 0);
  }
  if (typeof cmd === 'string') {
    seq.push(function (callback) {
      exec(cmd, puts(callback));
    });
  }
  return {
    run: function (cmd) {
      run(cmd, seq);
    }
  };
}

task('default', ['deploy']);

task('build', [], function () {
  fs.readFile(input_file, function (err, data) {
    if (err) throw err;
    fs.writeFile(
      output_file,
      'var Scheem = Scheem || {};\nScheem.parser = ' +
      PEG.buildParser(String(data), {}).toSource() +
      ';\nif (typeof module !== "undefined") { module.exports = Scheem.parser; }',
      function (err) {
        if (err) throw err;
        complete();
      }
    );
  });
})

task('deploy', [], function () {
  run('rm -R deploy/*')
    .run('jake -f scheem/Jakefile.js -C scheem')
    .run('cp scheem/scheem-interpreter.js scheem.peg deploy/')
    .run('mkdir deploy/test')
    .run('cp scheem/test/*.js scheem/test/*.html deploy/test')
    .run('cp node_modules/mocha/mocha.* deploy/')
    .run('cp node_modules/chai/chai.js deploy/')
    .run('cp web/* deploy/')
});

