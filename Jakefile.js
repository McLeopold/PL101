var Exec = require('./tool.js').Exec
;

task('default', ['deploy']);

task('deploy', [], function () {
  Exec()
    //.rm('cd deploy; rm -rf *; cd ..')
    //.run('jake -f scheem\\Jakefile.js -C scheem')
    .rm('deploy/*', true)
    .copy('scheem/scheem*', 'deploy/')
    .copy('scheem/test/*', 'deploy/')
    .copy('node_modules/mocha/mocha.*', 'deploy/')
    .copy('node_modules/chai/chai.js', 'deploy/')
    .copy('CodeMirror2/lib/codemirror.*', 'deploy/')
    .copy('CodeMirror2/theme/monokai.css', 'deploy/')
    .copy('CodeMirror2/mode/scheme/scheme.js', 'deploy/')
    .copy('web/*', 'deploy/')
  ;
});