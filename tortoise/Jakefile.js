var PEG = require('pegjs')
  , fs = require('fs')
  , input_file = 'tortoise.peg'
  , output_file = 'tortoise_parser.js'
;

task('default', ['build']);

task('build', [], function () {
  fs.readFile(input_file, function (err, data) {
    if (err) throw err;
    fs.writeFile(output_file,
               'var Tortoise = Tortoise || {};\nTortoise.parser = '
               + PEG.buildParser(String(data), {}).toSource()
               + ';\nif (typeof module !== "undefined") { module.exports = Tortoise.parser; }',
               function (err) {
      if (err) throw err;
      complete();
    });
  });
})
