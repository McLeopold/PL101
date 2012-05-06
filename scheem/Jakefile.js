var PEG = require('pegjs');

desc('Build the scheem PEG parser.');
task('build', [], function () {
  fs.readFile('scheem.peg', 'ascii', function(err, data) {
    parse = PEG.buildParser(data).parse;
  });
});

task('default', ['build']);