var exec = require('tooljs').exec
;

task('default', ['deploy']);

task('clean', [], function () {
  exec([], {verbose: false}, function () { console.log('done with cleanup'); complete(); })
    .rm('deploy/*', {recursive: true})
  ;
}, true);

task('compile', [], function () {
  exec([], {verbose: true}, function () { complete(); })
    .run('jake -f scheem/Jakefile.js -C scheem')
    .run('jake -f tscheem/Jakefile.js -C tscheem')
    .run('jake -f tortoise/Jakefile.js -C tortoise')
    .run('jake -f elephant/Jakefile.js -C elephant')
  ;
}, true);

task('deploy', ['clean', 'compile'], function () {
  exec([], {verbose: true}, function () { complete(); })
    .cp('scheem/scheem*', 'deploy/')
    .cp('scheem/test/*', 'deploy/')
    .cp('tscheem/tscheem*', 'deploy/')
    .cp('tscheem/test/*', 'deploy/')
    .cp('tortoise/tortoise*', 'deploy/')
    .cp('tortoise/test/*', 'deploy/')
    .cp('hare/hare*', 'deploy/')
    .cp('hare/test/*', 'deploy/')
    .cp('elephant/test/*', 'deploy/')
    .cp('elephant/elephant*', 'deploy/')
    .cp('web/*', 'deploy/', {recursive: true})
    .cp('node_modules/mocha/mocha.*', 'deploy/')
    .cp('node_modules/chai/chai.js', 'deploy/')
    .cp('CodeMirror2/lib/codemirror.*', 'deploy/')
    .cp('CodeMirror2/theme/*.css', 'deploy/')
    .cp('CodeMirror2/mode/scheme/scheme.js', 'deploy/')
    .cp('CodeMirror2/mode/javascript/javascript.js', 'deploy/')
    .cp('raphael/raphael.js', 'deploy/')
  ;
}, true);