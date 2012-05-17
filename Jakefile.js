var exec = require('tooljs').exec
;

task('default', ['deploy']);

task('deploy', [], function () {
  exec([], {verbose: true})
    .run('jake -f scheem/Jakefile.js -C scheem')
    .rm('deploy/*', {recursive: true})
    .cp('scheem/scheem*', 'deploy/')
    .cp('scheem/test/*', 'deploy/')
    .cp('node_modules/mocha/mocha.*', 'deploy/')
    .cp('node_modules/chai/chai.js', 'deploy/')
    .cp('CodeMirror2/lib/codemirror.*', 'deploy/')
    .cp('CodeMirror2/theme/monokai.css', 'deploy/')
    .cp('CodeMirror2/mode/scheme/scheme.js', 'deploy/')
    .cp('web/*', 'deploy/')
  ;
});