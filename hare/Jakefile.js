var PEG = require('pegjs')
  , fs = require('fs')
  , input_file = 'hare.peg'
  , output_file = 'hare_parser.js'
;

task('default', ['build']);

task('build', [], function () {
  fs.readFile(input_file, function (err, data) {
    if (err) throw err;
    fs.writeFile(output_file,
               'var Hare = Hare || {};\nHare.parser = '
               + PEG.buildParser(String(data), {}).toSource()
               + ';\nif (typeof module !== "undefined") { module.exports = Hare.parser; }',
               function (err) {
      if (err) throw err;
      complete();
    });
  });
})
