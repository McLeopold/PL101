var PEG = require('pegjs')
  , fs = require('fs')
  , input_file = 'tscheem.peg'
  , output_file = 'tscheem_parser.js'
;

task('default', ['build']);

task('build', [], function () {
  fs.readFile(input_file, function (err, data) {
    if (err) throw err;
    fs.writeFile(output_file,
               'var TScheem = TScheem || {};\nTScheem.parser = '
               + PEG.buildParser(String(data), {}).toSource()
               + ';\nif (typeof module !== "undefined") { module.exports = TScheem.parser; }',
               function (err) {
      if (err) throw err;
      complete();
    });
  });
})