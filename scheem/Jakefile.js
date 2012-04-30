var PEG = require('pegjs')
  , fs = require('fs')
  , input_file = 'scheem.peg'
  , output_file = 'scheem-parser.js'
;

task('default', ['build']);

task('build', [], function () {
  fs.readFile(input_file, function (err, data) {
    if (err) throw err;
    fs.writeFile(output_file,
               'Scheem = Scheem || {};\nScheem.parser = '
               + PEG.buildParser(String(data), {}).toSource()
               + ';\nif (typeof module !== "undefined") { module.exports = Scheem.parser; }',
               function (err) {
      if (err) throw err;
      complete();
    });
  });
})