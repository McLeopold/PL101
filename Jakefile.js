var PEG = require('pegjs')
  , fs = require('fs')
  , util = require('util')
  , exec = require('child_process').exec
  , input_file = 'scheem.peg'
  , output_file = 'scheem-parser.js'
;

task('default', ['deploy']);

task('deploy', [], function () {
  run('rm -Rf deploy/*')
    .run('mkdir deploy/js')
    .run('mkdir deploy/css')
    .run('jake -f scheem/Jakefile.js -C scheem')
    .run('cp -v scheem/scheem*.js deploy/js/')
    .run('cp -v scheem/scheem.peg deploy/')
    .run('cp -v scheem/test/*.js deploy/js/')
    .run('cp -v scheem/test/*.html deploy/')
    .run('cp -v node_modules/mocha/mocha.js deploy/js/')
    .run('cp -v node_modules/mocha/mocha.css deploy/css/')
    .run('cp -v node_modules/chai/chai.js deploy/js/')
    .run('cp -v codemirror2/lib/codemirror.js deploy/js/')
    .run('cp -v codemirror2/lib/codemirror.css deploy/css/')
    .run('cp -v codemirror2/theme/monokai.css deploy/css/')
    .run('cp -v codemirror2/mode/scheme/scheme.js deploy/js/')
    .run('cp -v web/*.html deploy/')
    .run('cp -v web/js/*.js deploy/js/')
    .run('cp -v web/css/*.css deploy/css/')
});

function puts(callback) {
  return function puts(error, stdout, stderr) {
    util.puts(error ? stderr : stdout);
    if (!error) callback();
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
      return run(cmd, seq);
    }
  };
}

