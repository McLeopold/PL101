var PEG = require('pegjs')
  , fs = require('fs')
  , input_file = 'elephant.peg'
  , output_file = 'elephant_parser.js'
;

task('default', ['build']);

task('build', [], function () {
  fs.readFile(input_file, function (err, data) {
    if (err) throw err;
    fs.writeFile(output_file,
               'var Elephant = Elephant || {};\nElephant.parser = '
               + PEG.buildParser(String(data), {}).toSource()
               + ';\nif (typeof module !== "undefined") { module.exports = Elephant.parser; }',
               function (err) {
      if (err) throw err;
      complete();
    });
  });
})
